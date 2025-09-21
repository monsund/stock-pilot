# SLM Agent



SLM Agent is a Node.js/TypeScript service for orchestrating stock-pilot tools and agents. It exposes endpoints for agent queries and integrates with other microservices like news-mcp (Google News search) and mcp-angel. This service orchestrates tools and agents for stock-pilot using Node.js and TypeScript.




## Ollama Setup

SLM Agent uses Ollama for SLM inference. Make sure Ollama is installed and running:

1. [Install Ollama](https://ollama.com/download) if not already installed.
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
5. The model name is now configured in code (see `src/adapters/slm/ollama.ts`).

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
