# SLM Agent



SLM Agent is a Node.js/TypeScript service for orchestrating stock-pilot tools and agents. It exposes endpoints for agent queries and integrates with other microservices like news-mcp (Google News search) and mcp-angel. This service orchestrates tools and agents for stock-pilot using Node.js and TypeScript.

---

## Cloudflare Workers (Edge) Deployment

SLM Agent can be deployed to Cloudflare Workers for fast, scalable edge inference. See `README.workers.md` for full setup, configuration, and troubleshooting.

- **Live URL (prod):** https://slm-agent.stockpilot.workers.dev
- **Runtime:** Cloudflare Workers (Fetch API) with `nodejs_compat`
- **Router:** Hono (`src/worker.ts`)
- **LLM at edge:** Groq (recommended; Ollama is Node-only)
- **Endpoints:**
  - `GET  /health` — Health check
  - `POST /analyze` — `{ "query": "Tata Motors" }`
  
**See `README.workers.md` for:**
- Required environment variables and secrets
- Wrangler and Cloudflare setup
- Local development and deployment commands
- Troubleshooting, FAQ, and best practices

---

## LLM Model Setup

SLM Agent supports both local Ollama and Groq (OpenAI-compatible) models for LLM inference.

### Using Groq

Set the following environment variables in your `.env` file:
- `GROQ_API_KEY` — Your Groq API key
- `GROQ_MODEL_Llama` — Model name (default: `llama-3.1-8b-instant`)
Groq will be used automatically if `GROQ_API_KEY` is set.

### Using Ollama (local)

Make sure Ollama is installed and running:
1. [Install Ollama](https://ollama.com/download)
2. Start the Ollama server:
   ```bash
   ollama serve
   ```
3. List available models:
   ```bash
   ollama list
   ```
4. Pull a model (e.g., llama3):
   ```bash
   ollama pull llama3
   ```
Set `OLLAMA_MODEL` in your `.env` file if you want to override the default model (`llama3.1:8b`).

See `src/adapters/slm/ollama.ts` for model selection logic.

## Setup



1. Install dependencies:1. Install dependencies:

   ```bash   ```bash

   npm install

   ```   ```

2. Copy `.env.example` to `.env` and set environment variables as needed.

3. Build the project:3. Build and start:

   ```bash   ```

   npm run build

   ```   npm start

4. Start the server:   ```

   ```bash

   npm start## Endpoints

`GET /health` — Health check
`POST /analyze` — Main agent endpoint. Accepts JSON `{ "query": "..." }` and returns agent response.

## Folder Structure

- `src/index.ts` — Express entrypoint
- `src/tools/` — Tool clients (news-mcp, mcp-angel, etc.)
- `src/prompts/` — Prompt templates
- `src/agents/` — Agent implementations
- `src/core/` — Core logic and adapters
- `src/schemas/` — Type definitions and schemas
- `src/util/` — Utility functions

## Environment Variables

See `.env.example` for required variables. 

## Development

- Use `npm run dev` for hot-reloading with nodemon.
- TypeScript sources are in `src/`, compiled output is in `dist/`.

## Integrations

- Communicates with `news-mcp` (Google News search) and `mcp-angel` microservices for news and trading operations.

## License

MIT
