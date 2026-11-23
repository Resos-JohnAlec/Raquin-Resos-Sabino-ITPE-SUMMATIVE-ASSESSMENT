# SOP-IT-009: Phishing and Information Security Incident Response

## Purpose
Standard Operating Procedure for handling suspected phishing emails, malicious attachment execution, credential harvesting attempts, and immediate endpoint containment.

## Scope
Applies to all enterprise personnel and endpoints encountering unsolicited or suspicious electronic communications.

## Procedure

### 1. Immediate Threat Containment
- Do not click hyperlinks, download attachments, or enter corporate credentials.
- Do not approve unexpected multi-factor authentication (MFA) push prompts.
- If an attachment was opened or credentials were entered:
  1. Immediately disconnect network cable or disable Wi-Fi to isolate the workstation.
  2. Contact the Information Security hotline or escalate immediately through AI Helpdesk.

### 2. Threat Reporting Workflow
- In Microsoft Outlook, select the suspect message and click 'Report Message' -> 'Phishing' on the Home ribbon.
- If reporting manually, export the message as an RFC 822 .eml file to preserve email routing headers (DKIM, SPF, ARC) and forward to security@aihas.local.

### 3. Security Operations Center (SOC) Triage
- The automated mail filter assesses recipient scope and domain reputation.
- Malicious messages matching the sender footprint are purged across all tenant mailboxes within 10 minutes.
