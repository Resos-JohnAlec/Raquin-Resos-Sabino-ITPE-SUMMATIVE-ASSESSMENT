import json
from typing import List, Optional, Dict, Any
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from sqlalchemy.orm import Session
from openai import OpenAI
from app.db.session import get_db
from app.core.config import settings
from app.core.dependencies import get_current_user
from app.models.user import User
from app.models.conversation import Conversation
from app.models.message import Message, MessageSender
from app.models.ticket import Ticket, TicketStatus
from app.models.tool_invocation import ToolInvocation, ToolInvocationStatus
from app.services.guardrails.pii import redact_pii
from app.services.guardrails.injection import check_prompt_injection
from app.services.guardrails.audit import log_audit_event
from app.services.rag.retrieval import retrieve_context
from app.services.tools.tool_registry import TOOL_DEFINITIONS
from app.services.tools.ticket_tool import create_support_ticket
from app.services.tools.ad_mock import reset_ad_password

router = APIRouter()

openai_client = OpenAI(api_key=settings.OPENAI_API_KEY) if settings.OPENAI_API_KEY and not settings.OPENAI_API_KEY.startswith("your-") else None


class ConversationCreate(BaseModel):
    title: Optional[str] = "IT Helpdesk Session"


class ConversationResponse(BaseModel):
    id: UUID
    title: Optional[str]
    created_at: Any

    class Config:
        from_attributes = True


class MessageCreate(BaseModel):
    conversation_id: UUID
    content: str


class ActionConfirmRequest(BaseModel):
    tool_invocation_id: UUID
    confirmed: bool


class EscalateRequest(BaseModel):
    conversation_id: UUID
    reason: Optional[str] = "User requested transfer to human handler"


@router.post("/conversations", response_model=ConversationResponse, status_code=status.HTTP_201_CREATED)
def create_conversation(
    payload: ConversationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    conv = Conversation(
        user_id=current_user.id,
        title=payload.title or "IT Helpdesk Session"
    )
    db.add(conv)
    db.commit()
    db.refresh(conv)
    return conv


@router.get("/conversations", response_model=List[ConversationResponse])
def list_conversations(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return db.query(Conversation).filter(Conversation.user_id == current_user.id).order_by(Conversation.created_at.desc()).all()


@router.delete("/conversations/{conversation_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_conversation(
    conversation_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    conv = db.query(Conversation).filter(
        Conversation.id == conversation_id,
        Conversation.user_id == current_user.id
    ).first()
    if not conv:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Conversation not found")
    db.delete(conv)
    db.commit()
    return None


class SwitchToAIRequest(BaseModel):
    conversation_id: UUID


@router.post("/switch-to-ai")
def switch_to_ai(
    payload: SwitchToAIRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    conv = db.query(Conversation).filter(
        Conversation.id == payload.conversation_id,
        Conversation.user_id == current_user.id
    ).first()
    if not conv:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Conversation not found")

    notice_text = "Session returned to AI Assistant mode. You can now consult standard operating procedures, request password resets, or ask IT support questions."
    assistant_msg = Message(
        conversation_id=conv.id,
        sender_type=MessageSender.ASSISTANT,
        content=notice_text,
        redacted_content=notice_text,
        citations=[]
    )
    db.add(assistant_msg)
    db.commit()

    return {
        "status": "switched_to_ai",
        "is_escalated": False,
        "message": notice_text
    }


@router.get("/conversations/{conversation_id}/messages")
def get_messages(
    conversation_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    conv = db.query(Conversation).filter(
        Conversation.id == conversation_id,
        Conversation.user_id == current_user.id
    ).first()
    if not conv:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Conversation not found")

    messages = db.query(Message).filter(Message.conversation_id == conversation_id).order_by(Message.created_at.asc()).all()
    return [
        {
            "id": str(m.id),
            "sender_type": m.sender_type.value if hasattr(m.sender_type, 'value') else str(m.sender_type),
            "content": m.content,
            "redacted_content": m.redacted_content,
            "citations": m.citations,
            "created_at": m.created_at.isoformat() if m.created_at else None
        }
        for m in messages
    ]


@router.post("/message")
def send_message(
    payload: MessageCreate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    client_ip = request.client.host if request.client else None
    conv = db.query(Conversation).filter(
        Conversation.id == payload.conversation_id,
        Conversation.user_id == current_user.id
    ).first()
    if not conv:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Conversation not found")

    is_injection, injection_reason = check_prompt_injection(payload.content)
    if is_injection:
        log_audit_event(
            db=db,
            event_type="prompt_injection_blocked",
            user_id=current_user.id,
            details={"content": payload.content[:100], "reason": injection_reason},
            ip_address=client_ip
        )
        return {
            "role": "assistant",
            "content": "Security Alert: Your input triggered enterprise prompt safety guardrails and cannot be processed. This incident has been logged.",
            "citations": [],
            "action_card": None,
            "escalation_available": True
        }

    redacted_input, pii_entities = redact_pii(payload.content)
    if pii_entities:
        log_audit_event(
            db=db,
            event_type="pii_redacted",
            user_id=current_user.id,
            details={"entities_count": len(pii_entities), "types": [e["type"] for e in pii_entities]},
            ip_address=client_ip
        )

    user_msg = Message(
        conversation_id=conv.id,
        sender_type=MessageSender.USER,
        content=payload.content,
        redacted_content=redacted_input
    )
    db.add(user_msg)
    db.commit()

    active_ticket = db.query(Ticket).filter(
        Ticket.conversation_id == conv.id,
        Ticket.status.in_([TicketStatus.OPEN, TicketStatus.IN_PROGRESS])
    ).first()

    if active_ticket:
        response_text = f"Your message has been updated on Ticket #{active_ticket.id} and routed to the assigned human handlers. A support specialist will respond shortly."
        assistant_msg = Message(
            conversation_id=conv.id,
            sender_type=MessageSender.ASSISTANT,
            content=response_text,
            redacted_content=response_text,
            citations=[]
        )
        db.add(assistant_msg)
        db.commit()
        return {
            "role": "assistant",
            "content": response_text,
            "citations": [],
            "action_card": None,
            "escalation_available": False,
            "is_escalated": True,
            "ticket_id": str(active_ticket.id)
        }

    rag_result = retrieve_context(redacted_input, limit=3)
    citations = rag_result.get("citations", [])
    context_text = rag_result.get("context_text", "")
    is_confident = rag_result.get("is_confident", False)

    action_card = None
    response_text = ""

    if openai_client:
        system_prompt = (
            "You are AI-HAS, an enterprise IT Helpdesk Assistant. "
            "Use the provided Knowledge Base context to answer user technical inquiries. "
            "Always cite sources grounded in the context. "
            "If user requests a password reset, invoke the 'propose_password_reset' function. "
            "If the request requires manual intervention or ticket escalation, invoke 'create_support_ticket'. "
            "Do not fabricate credentials or execute unverified commands.\n\n"
            f"Context:\n{context_text}"
        )

        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": redacted_input}
        ]

        try:
            completion = openai_client.chat.completions.create(
                model=settings.LLM_MODEL,
                messages=messages,
                tools=TOOL_DEFINITIONS,
                tool_choice="auto"
            )
            choice = completion.choices[0].message

            if choice.tool_calls:
                tool_call = choice.tool_calls[0]
                fn_name = tool_call.function.name

                if fn_name == "propose_password_reset":
                    tool_inv = ToolInvocation(
                        conversation_id=conv.id,
                        user_id=current_user.id,
                        tool_name="propose_password_reset",
                        parameters={},
                        status=ToolInvocationStatus.PENDING
                    )
                    db.add(tool_inv)
                    db.commit()
                    db.refresh(tool_inv)

                    log_audit_event(
                        db=db,
                        event_type="password_reset_proposed",
                        user_id=current_user.id,
                        details={"tool_invocation_id": str(tool_inv.id)},
                        ip_address=client_ip
                    )

                    response_text = "I have prepared an Active Directory password reset for your account. Please review and confirm the action below to proceed."
                    action_card = {
                        "type": "confirm_password_reset",
                        "tool_invocation_id": str(tool_inv.id),
                        "title": "Active Directory Password Reset",
                        "description": f"Target Account: {current_user.email}. This will generate a temporary 15-minute password and invalidate your prior credentials.",
                        "requires_confirmation": True
                    }

                elif fn_name == "create_support_ticket":
                    args = json.loads(tool_call.function.arguments or "{}")
                    ticket = create_support_ticket(
                        db=db,
                        requester_id=current_user.id,
                        title=args.get("title", "IT Support Request"),
                        description=args.get("description", redacted_input),
                        priority=args.get("priority", "medium"),
                        conversation_id=conv.id
                    )
                    response_text = f"An IT support ticket (Reference: {ticket.id}) has been created and escalated to our human handlers. Our team will contact you shortly."

            else:
                if not is_confident:
                    response_text = "The knowledge base does not contain sufficient verified SOP information to resolve your request with high confidence. Would you like me to connect you with an IT support handler?"
                else:
                    response_text = choice.content or ""

        except Exception as exc:
            response_text = f"Temporary service disruption: {str(exc)}"
    else:
        lower_input = redacted_input.lower()
        if "reset" in lower_input and "password" in lower_input:
            tool_inv = ToolInvocation(
                conversation_id=conv.id,
                user_id=current_user.id,
                tool_name="propose_password_reset",
                parameters={},
                status=ToolInvocationStatus.PENDING
            )
            db.add(tool_inv)
            db.commit()
            db.refresh(tool_inv)

            log_audit_event(
                db=db,
                event_type="password_reset_proposed",
                user_id=current_user.id,
                details={"tool_invocation_id": str(tool_inv.id)},
                ip_address=client_ip
            )

            response_text = "I have prepared an Active Directory password reset for your corporate account. Please confirm to proceed with provisioning your temporary credentials."
            action_card = {
                "type": "confirm_password_reset",
                "tool_invocation_id": str(tool_inv.id),
                "title": "Active Directory Password Reset",
                "description": f"Target Account: {current_user.email}. A temporary 15-minute OTP password will be generated.",
                "requires_confirmation": True
            }

        elif any(w in lower_input for w in ["escalate", "human", "agent", "ticket", "talk to human"]):
            ticket = create_support_ticket(
                db=db,
                requester_id=current_user.id,
                title="Level-1 Support Escalation",
                description=redacted_input,
                priority="medium",
                conversation_id=conv.id,
                escalation_reason="User requested human assistance in chat"
            )
            response_text = f"Your request has been escalated to an IT handler. Ticket Reference: {ticket.id}. An agent is reviewing your inquiry."

        elif is_confident and citations:
            best_chunk = citations[0]["excerpt"]
            response_text = (
                f"Based on our IT Standard Operating Procedures ({citations[0]['title']}):\n\n"
                f"{best_chunk}...\n\n"
                "Please follow the troubleshooting steps outlined in the cited knowledge base article."
            )
        elif any(w in lower_input for w in ["vpn", "gateway", "timeout"]):
            citations = [{
                "title": "SOP-IT-001: Enterprise VPN Troubleshooting Guide",
                "doc_id": "d1111111",
                "score": 0.96,
                "chunk_index": 0,
                "excerpt": "Flush DNS with ipconfig /flushdns, ensure gateway is vpn.enterprise-corp.com:443, and restart PanGPS service."
            }]
            response_text = (
                "Based on SOP-IT-001 (Enterprise VPN Troubleshooting Guide):\n\n"
                "1. Network Verification: Confirm internet connection and flush DNS cache in PowerShell (Admin): ipconfig /flushdns\n"
                "2. Gateway Configuration: Ensure VPN client gateway is set to vpn.enterprise-corp.com:443.\n"
                "3. Service Restart: Restart the client background service: Restart-Service -Name 'PanGPS' -Force\n"
                "4. Route Conflicts: Verify your home subnet does not overlap with corporate 10.0.0.0/8 ranges."
            )
        elif any(w in lower_input for w in ["software", "license", "docker", "jetbrains"]):
            citations = [{
                "title": "SOP-IT-003: Software Licensing Standard",
                "doc_id": "d3333333",
                "score": 0.95,
                "chunk_index": 0,
                "excerpt": "Tier 2 developer tools require line manager approval with 24 business hour SLA."
            }]
            response_text = (
                "Based on SOP-IT-003 (Software Licensing Standard):\n\n"
                "1. Tiers: Tier 1 (standard apps) install via Company Portal. Tier 2 (Docker Pro, JetBrains) requires Engineering Manager approval.\n"
                "2. Approval SLA: Manager approval SLA is 24 business hours.\n"
                "3. Action: Submit your software request in the portal with your manager on copy."
            )
        elif any(w in lower_input for w in ["wifi", "wi-fi", "802.1x", "network"]):
            citations = [{
                "title": "SOP-IT-004: Enterprise Wi-Fi and 802.1x Network Troubleshooting",
                "doc_id": "d4444444",
                "score": 0.95,
                "chunk_index": 0,
                "excerpt": "Connect to SSID Enterprise-Secure with 802.1x PEAP credentials. Reset stack via netsh winsock reset if DHCP fails."
            }]
            response_text = (
                "Based on SOP-IT-004 (Enterprise Wi-Fi and 802.1x Network Troubleshooting):\n\n"
                "1. SSID: Connect to 'Enterprise-Secure' with your full corporate email and domain credentials.\n"
                "2. DHCP Renewal: Run ipconfig /release and ipconfig /renew in PowerShell.\n"
                "3. Network Reset: Run netsh winsock reset and netsh int ip reset, then restart your workstation."
            )
        elif any(w in lower_input for w in ["outlook", "email", "sync", "exchange", "mailbox"]):
            citations = [{
                "title": "SOP-IT-005: Corporate Exchange and Outlook Client Recovery",
                "doc_id": "d5555555",
                "score": 0.94,
                "chunk_index": 0,
                "excerpt": "Isolate add-ins with outlook.exe /safe, purge Credential Manager cache, and rebuild OST data file."
            }]
            response_text = (
                "Based on SOP-IT-005 (Corporate Exchange and Outlook Client Recovery):\n\n"
                "1. Safe Mode: Press Win + R and run outlook.exe /safe to test without add-ins.\n"
                "2. Credential Cache: Purge cached Office credentials under Windows Credential Manager.\n"
                "3. Cache Rebuild: Rename .ost file to .ost.bak to trigger fresh Exchange synchronization."
            )
        elif any(w in lower_input for w in ["mfa", "authenticator", "token", "phone"]):
            citations = [{
                "title": "SOP-IT-006: Multi-Factor Authentication (MFA) & TAP Policy",
                "doc_id": "d6666666",
                "score": 0.97,
                "chunk_index": 0,
                "excerpt": "Identity verification required for MFA resets. Authorized handlers generate an 8-hour Temporary Access Pass (TAP)."
            }]
            response_text = (
                "Based on SOP-IT-006 (Multi-Factor Authentication (MFA) & TAP Policy):\n\n"
                "1. Identity Check: Secondary identity verification is required under Zero Trust standards.\n"
                "2. TAP Access: Contact an IT Handler to issue an emergency 8-hour Temporary Access Pass.\n"
                "3. Enrollment: Sign in to https://mysignins.microsoft.com/security-info to register your new device."
            )
        elif any(w in lower_input for w in ["slow", "cpu", "freezing", "performance", "lag"]):
            citations = [{
                "title": "SOP-IT-007: Workstation Performance and OS Diagnostics",
                "doc_id": "d7777777",
                "score": 0.93,
                "chunk_index": 0,
                "excerpt": "Triage CPU and RAM via Task Manager, purge temp directories, and execute sfc /scannow and DISM image repair."
            }]
            response_text = (
                "Based on SOP-IT-007 (Workstation Performance and OS Diagnostics):\n\n"
                "1. Triage: Inspect CPU/Memory consumers via Task Manager (Ctrl + Shift + Esc).\n"
                "2. Temp Cleanup: Purge temp files via Remove-Item -Path \"$env:TEMP\\*\" -Recurse -Force\n"
                "3. OS Repair: Execute sfc /scannow and DISM.exe /Online /Cleanup-image /Restorehealth in PowerShell (Admin)."
            )
        elif any(w in lower_input for w in ["monitor", "dock", "display", "screen", "hdmi"]):
            citations = [{
                "title": "SOP-IT-008: External Displays and Peripheral Docking Standards",
                "doc_id": "d8888888",
                "score": 0.95,
                "chunk_index": 0,
                "excerpt": "Restart graphics subsystem with Win + Ctrl + Shift + B and perform 15-second AC power drain on docking station."
            }]
            response_text = (
                "Based on SOP-IT-008 (External Displays and Peripheral Docking Standards):\n\n"
                "1. Driver Reset: Press Win + Ctrl + Shift + B to restart display drivers.\n"
                "2. Dock Power Drain: Disconnect USB-C cable and AC power from docking station for 15 seconds, then reconnect.\n"
                "3. Multi-Display: Press Win + P and verify projection mode is set to 'Extend'."
            )
        elif any(w in lower_input for w in ["phish", "suspicious", "security", "malware", "hacked"]):
            citations = [{
                "title": "SOP-IT-009: Phishing and Information Security Incident Response",
                "doc_id": "d9999999",
                "score": 0.98,
                "chunk_index": 0,
                "excerpt": "Immediate network isolation if link clicked. Report via Outlook Phishing ribbon or forward headers to security@aihas.local."
            }]
            response_text = (
                "Based on SOP-IT-009 (Phishing and Information Security Incident Response):\n\n"
                "1. Containment: Do NOT click links or enter credentials. Disconnect Wi-Fi/cable immediately if link was clicked.\n"
                "2. Report: Click 'Report Message' -> 'Phishing' in Outlook or forward .eml headers to security@aihas.local.\n"
                "3. SOC Isolation: Security filters will automatically purge matching malicious emails across all mailboxes."
            )
        else:
            response_text = "The knowledge base does not contain sufficient confidence to answer your query. You can click 'Talk to a human' to transfer this conversation to an IT support handler."

    assistant_msg = Message(
        conversation_id=conv.id,
        sender_type=MessageSender.ASSISTANT,
        content=response_text,
        redacted_content=response_text,
        citations=citations
    )
    db.add(assistant_msg)
    db.commit()

    log_audit_event(
        db=db,
        event_type="chat_response_generated",
        user_id=current_user.id,
        details={"conversation_id": str(conv.id), "citations_count": len(citations)},
        ip_address=client_ip
    )

    return {
        "role": "assistant",
        "content": response_text,
        "citations": citations,
        "action_card": action_card,
        "escalation_available": True
    }


@router.post("/actions/confirm")
def confirm_action(
    payload: ActionConfirmRequest,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    client_ip = request.client.host if request.client else None
    tool_inv = db.query(ToolInvocation).filter(
        ToolInvocation.id == payload.tool_invocation_id,
        ToolInvocation.user_id == current_user.id
    ).first()

    if not tool_inv:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tool invocation not found or unauthorized"
        )

    if tool_inv.status != ToolInvocationStatus.PENDING:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Action is already in state: {tool_inv.status}"
        )

    if not payload.confirmed:
        tool_inv.status = ToolInvocationStatus.FAILED
        tool_inv.result = {"status": "cancelled_by_user"}
        db.commit()
        return {"status": "cancelled", "message": "Action was cancelled by user."}

    if tool_inv.tool_name == "propose_password_reset":
        ad_res = reset_ad_password(
            user_id=str(current_user.id),
            email=current_user.email
        )
        tool_inv.status = ToolInvocationStatus.EXECUTED
        tool_inv.result = {
            "status": "success",
            "service": ad_res["service"],
            "expires_in_minutes": ad_res["expires_in_minutes"]
        }
        db.commit()

        log_audit_event(
            db=db,
            event_type="password_reset_executed",
            user_id=current_user.id,
            details={"email": current_user.email, "service": ad_res["service"]},
            ip_address=client_ip
        )

        return {
            "status": "success",
            "temporary_password": ad_res["temporary_password"],
            "expires_in_minutes": ad_res["expires_in_minutes"],
            "message": ad_res["message"]
        }

    return {"status": "unsupported_action"}


@router.post("/escalate")
def escalate_to_human(
    payload: EscalateRequest,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    client_ip = request.client.host if request.client else None
    conv = db.query(Conversation).filter(
        Conversation.id == payload.conversation_id,
        Conversation.user_id == current_user.id
    ).first()
    if not conv:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Conversation not found")

    messages = db.query(Message).filter(Message.conversation_id == conv.id).order_by(Message.created_at.asc()).all()
    first_user_msg = next((m.content for m in messages if m.sender_type == MessageSender.USER), "User consultation")
    title_snippet = first_user_msg[:45]

    ticket = create_support_ticket(
        db=db,
        requester_id=current_user.id,
        title=f"Consultation: {title_snippet}",
        description=first_user_msg,
        priority="high",
        conversation_id=conv.id,
        escalation_reason=payload.reason
    )

    log_audit_event(
        db=db,
        event_type="ticket_escalated_to_handler",
        user_id=current_user.id,
        details={"ticket_id": str(ticket.id), "conversation_id": str(conv.id)},
        ip_address=client_ip
    )

    return {
        "status": "escalated",
        "ticket_id": str(ticket.id),
        "message": "Your conversation has been routed to the active Handler Queue. An IT support specialist will assist you."
    }


@router.get("/stream")
def stream_chat_sse(
    conversation_id: UUID,
    query: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    def event_generator():
        redacted, _ = redact_pii(query)
        rag_data = retrieve_context(redacted, limit=3)
        citations = rag_data.get("citations", [])

        yield f"event: citations\ndata: {json.dumps(citations)}\n\n"

        words = ["Based", "on", "the", "enterprise", "IT", "documentation:"]
        for w in words:
            yield f"event: token\ndata: {json.dumps({'token': w + ' '})}\n\n"

        yield f"event: done\ndata: {json.dumps({'status': 'completed'})}\n\n"

    return StreamingResponse(event_generator(), media_type="text/event-stream")
