# AI-HAS System Architecture

## Overview
AI-HAS (AI-Powered Enterprise Helpdesk and Workflow Automation System) is an enterprise-grade IT Support Automation platform. It resolves level-1 operational requests using Retrieval-Augmented Generation (RAG) over IT knowledge bases, executes operational workflows via LLM function calling, and escalates unresolved or sensitive requests to human handlers.

## Core Components
- Frontend: Next.js 14 App Router, TypeScript, Tailwind CSS, Roboto Mono typography, SSE streaming client.
- Backend: FastAPI, SQLAlchemy 2.0 ORM, Alembic schema migrations, Pydantic v2 validation.
- Database: PostgreSQL 16 relational store for transactional state (users, conversations, messages, tickets, audit logs).
- Vector Engine: Qdrant vector database with dense and sparse hybrid retrieval.
- Workflow Orchestration: Self-hosted n8n instance for external IT integrations (e.g., Jira tickets, notification dispatch).
- Guardrails: Presidio analyzer/anonymizer for PII scrubbing and prompt injection detection layer.

## Security and RBAC Matrix
- user:
  - Access to self-service chat portal.
  - Can only query own conversations and own tickets.
  - Can trigger explicit confirmation actions (e.g., password reset).
- handler:
  - Access to human-in-the-loop (HITL) agent queue.
  - Review AI-suggested replies, inspect transcripts with redacted PII, and resolve escalated tickets.
- admin:
  - Full access to KPI dashboard, knowledge base indexing and chunk previews, and user account/role management.

## Audit and Safety Invariants
- Tool calls (password reset, ticket creation) must take the authenticated user ID from the JWT session, never from model output or client parameters.
- Destructive and administrative operations (e.g., password reset) require explicit confirmation state.
- All PII is redacted prior to LLM forwarding and audit logging.
- Low-confidence retrievals reject hallucinated answers and prompt user for escalation.
- Model names are resolved dynamically via LLM_MODEL and EMBEDDING_MODEL environment variables.
