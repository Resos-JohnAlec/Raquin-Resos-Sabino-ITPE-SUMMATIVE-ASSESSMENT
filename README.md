# AI-HAS (AI-Powered Enterprise Helpdesk and Workflow Automation System)

Enterprise IT Helpdesk platform providing automated Level-1 support, grounded RAG citations, LLM function calling, human-in-the-loop escalation, security guardrails, and workflow automation.

## Technology Stack
- Frontend: Next.js 14 (App Router, TypeScript, Tailwind CSS, Roboto Mono)
- Backend: FastAPI (Python 3.12), SQLAlchemy 2.0, Alembic, Pydantic v2
- Relational Database: PostgreSQL 16
- Vector Database: Qdrant Hybrid Search (Dense & Sparse)
- Knowledge Base & Retrieval: LlamaIndex & OpenAI Function Calling
- Automation Engine: self-hosted n8n (Webhook Ticket Creation & Notifications)
- Directory Service: Mock Active Directory Password Reset Service
- Guardrails: Presidio PII scrubbing & Regex/heuristic Prompt Injection filtering
- Evaluation & Testing: Ragas, Pytest, Locust
- DevOps: Docker Compose & GitHub Actions CI/CD

## Role-Based Access Control (RBAC)
- user: Self-service chat portal, queries knowledge base, initiates password resets, escalates to human handlers.
- handler: Human-in-the-loop (HITL) agent queue, inspects PII-scrubbed transcripts, reviews AI-suggested responses, resolves tickets.
- admin: KPI & Observability dashboard, Knowledge Base chunk management and re-indexing, user identity and RBAC role assignment.

## Security & Operational Invariants
- Authenticated Session Injection: Tool executions (Active Directory password reset, ticket creation) extract the target user ID strictly from the authenticated JWT session, never from model parameters or user text.
- Explicit Action Confirmation: Destructive or administrative operations (password resets) require a confirmation card in the UI before execution.
- PII Sanitization: Microsoft Presidio scrubbing redacts emails, phone numbers, credit cards, SSNs, and IP addresses before sending data to LLM APIs or logging.
- Grounded Citations & Thresholding: Responses cite verified SOP chunks. If retrieval score is below the configured threshold, the assistant flags low confidence and offers human escalation instead of hallucinating.
- Model Flexibility: Models are dynamically bound to LLM_MODEL and EMBEDDING_MODEL environment variables without hardcoded models.

## Pre-seeded Accounts
| Role | Email | Password |
| :--- | :--- | :--- |
| Admin | admin@aihas.local | Admin123! |
| Handler | handler@aihas.local | Handler123! |
| User | user@aihas.local | User123! |

## Quick Start (Docker Compose)
1. Copy environment variables:
```bash
cp .env.example .env
```
2. Build and start containers:
```bash
docker compose up --build -d
```
3. Run database migrations:
```bash
docker compose exec backend alembic upgrade head
```
4. Seed the initial accounts:
```bash
docker compose exec backend python -m app.db.seed
```

## Running Frontend Standalone (NPM)
```bash
cd frontend
npm install
npm run dev
```
Access the application at: http://localhost:3000

## Service URLs
- Frontend Web App: http://localhost:3000
- FastAPI Interactive Docs: http://localhost:8000/api/v1/docs
- API Health Status: http://localhost:8000/api/v1/health
- Qdrant Vector Console: http://localhost:6333/dashboard
- n8n Workflow Automation: http://localhost:5678

## Testing and Evaluation
- Unit & Guardrail Tests:
```bash
cd backend
pytest -v
```
- Ragas Metric Evaluation:
```bash
python eval/ragas_evaluate.py
```
- Locust Load Stress Test:
```bash
locust -f eval/locustfile.py --host http://localhost:8000
```
