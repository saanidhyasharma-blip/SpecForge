# SpecForge

An AI-powered system that converts natural language prompts into structured, validated, and executable application configurations — spanning UI, API, Database, and Auth layers.

---

## Features

- **Multi-Stage Pipeline** — Intent extraction → System design → Schema generation → Cross-layer validation → Deterministic repair → Execution simulation
- **Full-Stack Schema Generation** — Produces interconnected UI pages, REST API endpoints, database tables, and role-based auth configs from a single prompt
- **Validation Engine** — Deep cross-layer consistency checks ensuring API endpoints map to DB tables, UI components reference valid endpoints, and auth roles carry permissions
- **Deterministic Repair** — Rule-based repair engine that fixes schema errors in-place without regenerating the full schema or calling an LLM
- **Execution Simulation** — Static analysis layer that verifies the generated system is structurally complete and ready to run
- **Evaluation Suite** — Automated test runner with 20 prompts (including edge cases) tracking success rates, latency, repair frequency, and failure patterns

---

## Architecture

```
User Prompt
    │
    ▼
┌─────────────────┐
│  Intent Extract  │  Parse features, roles, entities from natural language
└────────┬────────┘
         ▼
┌─────────────────┐
│  Design Engine   │  Generate entities, relationships, flows (LLM-assisted)
└────────┬────────┘
         ▼
┌─────────────────┐
│ Schema Generator │  Produce UI, API, DB, and Auth layers deterministically
└────────┬────────┘
         ▼
┌─────────────────┐
│   Validator      │  Cross-layer consistency checks (API↔DB, UI↔API, Auth)
└────────┬────────┘
         ▼
    ┌────┴────┐
    │  Pass?  │
    └────┬────┘
     No  │  Yes
     ▼   │
┌────────┐│
│ Repair ││  Deterministic, in-place fixes by error type
└────┬───┘│
     │    │
     ▼    ▼
┌─────────────────┐
│   Execution Sim  │  Verify system is structurally executable
└────────┬────────┘
         ▼
    Final Output
```

### Pipeline Stages

| Stage | File | Purpose |
|---|---|---|
| Intent Extraction | `pipeline/intent.ts` | Parses the user prompt into structured features, roles, and entities |
| Design Generation | `pipeline/design.ts` | Uses OpenAI to generate entity relationships, data flows, and system architecture |
| Schema Generation | `pipeline/schema.ts` | Deterministically produces UI, API, DB, and Auth schemas from the design |
| Validation | `pipeline/validation.ts` | Runs cross-layer checks and returns structured `ValidationError` objects |
| Repair | `pipeline/repair.ts` | Applies targeted fixes based on error type (`DB_ERROR`, `API_DB_MISMATCH`, etc.) |
| Execution Simulation | `runtime/simulate.ts` | Verifies the final schema is structurally complete and internally consistent |
| Orchestrator | `pipeline/orchestrator.ts` | Coordinates the full pipeline lifecycle |

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js (App Router), Tailwind CSS, Framer Motion |
| Backend | Node.js, Express, TypeScript |
| AI | OpenAI API (GPT) |
| Evaluation | Custom test runner with latency and error tracking |

---

## Getting Started

### Prerequisites

- Node.js 18+
- npm
- OpenAI API key

### 1. Clone the repository

```bash
git clone https://github.com/your-username/SpecForge.git
cd SpecForge
```

### 2. Set up environment variables

```bash
cp .env.example .env
```

Edit `.env` and add your OpenAI API key:

```
NEXT_PUBLIC_API_URL=http://localhost:3000
OPENAI_API_KEY=your_openai_api_key_here
```

### 3. Install dependencies

```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

### 4. Run the application

```bash
# Terminal 1 — Backend (port 3000)
cd backend
npm run dev

# Terminal 2 — Frontend (port 3001)
cd frontend
npm run dev
```

Open [http://localhost:3001](http://localhost:3001) in your browser.

---

## Usage

### Via the Web UI

1. Open the frontend in your browser
2. Type a prompt like: *"Build a CRM with login and contacts"*
3. Click **Generate App**
4. View the generated Schema, Validation results, and Execution status in the tabbed output

### Via the API

```bash
curl -X POST http://localhost:3000/run \
  -H "Content-Type: application/json" \
  -d '{"prompt": "Build a CRM with login and contacts"}'
```

### Run the Evaluation Suite

```bash
cd backend
npx ts-node evaluation/test.ts
```

This runs 20 prompts (10 normal + 10 edge cases) and outputs:

```
totalTests: 20
successRate: 0.95
avgLatency: 1420.50
retriesPerRequest: 0.90
failureTypes: [...]
slowestPrompt: { prompt: "...", latency: 14500 }
fastestPrompt: { prompt: "...", latency: 480 }
```

---

## Project Structure

```
SpecForge/
├── backend/
│   ├── pipeline/
│   │   ├── intent.ts          # Intent extraction from prompts
│   │   ├── design.ts          # LLM-assisted system design
│   │   ├── schema.ts          # Schema aggregator
│   │   ├── schema/
│   │   │   ├── ui.ts          # UI layer generation
│   │   │   ├── api.ts         # API layer generation
│   │   │   ├── db.ts          # DB layer generation
│   │   │   └── auth.ts        # Auth layer generation
│   │   ├── validation.ts      # Cross-layer validation
│   │   ├── repair.ts          # Deterministic repair engine
│   │   └── orchestrator.ts    # Pipeline coordinator
│   ├── runtime/
│   │   └── simulate.ts        # Execution simulation
│   ├── evaluation/
│   │   ├── test.ts            # Evaluation runner
│   │   └── testData.ts        # Test prompt dataset
│   └── server.ts              # Express API server
├── frontend/
│   └── src/app/
│       └── page.tsx           # Next.js frontend UI
├── .env.example
├── .gitignore
└── README.md
```

---

## Future Improvements

- **Code Generation** — Generate boilerplate application code from the validated schema
- **Persistent Storage** — Save generated designs to PostgreSQL or MongoDB
- **API Documentation** — Auto-generate OpenAPI/Swagger specs from the API schema layer
- **Visual Schema Editor** — Drag-and-drop interface to modify generated schemas
- **Multi-Model Support** — Swap between OpenAI, Gemini, and Claude for design generation
- **CI/CD Integration** — Run the evaluation suite as part of a continuous integration pipeline

---

## License

MIT
