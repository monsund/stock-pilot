# SLM Agent — Cloudflare Workers (Hono) Deployment

This guide documents **Cloudflare Workers (edge) deployment** for `slm-agent`.

**Live URL (prod):** https://slm-agent.stockpilot.workers.dev/health

---

## Overview

- **Runtime:** Cloudflare Workers (Fetch API) with `nodejs_compat`
- **Router:** Hono (`src/worker.ts`)
- **LLM at edge:** **Groq** (recommended). Ollama is **Node-only** and not supported on Workers.
- **Endpoints:**
  - `GET  /health` — Health check
  - `POST /analyze` — `{ "query": "Tata Motors" }`
  - `POST /paper/orders` — `{ symbol:{exchange,symbol}, side:BUY|SELL, qty:number, type:"MARKET" }`
  - `GET  /paper/orders` — List orders
  - `GET  /paper/positions` — List positions
  - `GET  /market/ltp?exchange=NSE&symbol=RELIANCE` — Market price
  - `GET  /news/search?query=...` — News search
  - *(optional)* `GET /` — Friendly root route

---

## Prerequisites

- Node.js **20+** (22 recommended)
- Cloudflare account with **Workers** enabled
- Wrangler CLI (`npx wrangler`)
- Project path: `apps/slm-agent`

---

## Edge-specific setup & notes

> **Important:** Remove any `import 'dotenv/config'` from code imported by `src/worker.ts`. Workers cannot load `.env` files.

---

## Required configuration

### `wrangler.toml`
```toml
name = "slm-agent"
main = "src/worker.ts"
compatibility_date = "2025-09-22"
compatibility_flags = ["nodejs_compat"]

# Deploys to *.workers.dev by default. Add routes for custom domains if needed.

[vars]
APP_NAME = "slm-agent"
USE_GROQ = "1"  # Ensures Groq is used at edge (Ollama is Node-only)
```

### `package.json` (scripts)
```json
{
  "scripts": {
    "dev:worker": "wrangler dev",
    "deploy:worker": "wrangler deploy"
  }
}
```

### `tsconfig.json` (edge-friendly)
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "resolveJsonModule": true,
    "sourceMap": true,
    "outDir": "dist",
    "lib": ["ES2022", "WebWorker"],
    "types": ["@cloudflare/workers-types"]
  },
  "include": ["src"]
}
```

---

## Cloudflare Authentication & Secrets

### One-time login

```sh
npx wrangler login
npx wrangler whoami   # verify account
```

### Required secrets

- `GROQ_API_KEY` — Required for `/analyze` endpoint
  ```sh
  npx wrangler secret put GROQ_API_KEY
  ```

### Optional integrations

- `NEWS_MCP_BASE` — For `/news/search` passthrough to your news-mcp
  ```sh
  npx wrangler secret put NEWS_MCP_BASE   # e.g. https://news-mcp.<you>.workers.dev
  ```
- `ANGEL_BASE` — For `/market/ltp` passthrough to angel MCP
  ```sh
  npx wrangler secret put ANGEL_BASE      # e.g. https://angel-mcp.onrender.com
  ```

### Non-secret Vars (set in wrangler.toml)

- `APP_NAME=slm-agent`
- `USE_GROQ=1` (ensures Ollama is not used on Workers)

You can also add/edit secrets from Cloudflare Dashboard → Workers → slm-agent → Bindings.

---

## Local Development & Deployment

### Run locally (Workers preview)

```sh
npm run dev:worker
# In another terminal:
curl -s http://127.0.0.1:8787/health
```

### Deploy to Workers

```sh
npm run deploy:worker
# Prints URL, e.g. https://slm-agent.stockpilot.workers.dev
```

---

## Quick Test Commands

### Health
```sh
curl -s https://slm-agent.stockpilot.workers.dev/health
```

### Analyze (requires GROQ_API_KEY)
```sh
curl -s -X POST https://slm-agent.stockpilot.workers.dev/analyze \
  -H 'content-type: application/json' \
  -d '{"query":"Tata Motors"}'
```

### Paper Trading Demo
```sh
curl -s -X POST https://slm-agent.stockpilot.workers.dev/paper/orders \
  -H 'content-type: application/json' \
  -d '{"symbol":{"exchange":"NSE","symbol":"RELIANCE"},"side":"BUY","qty":2}'

curl -s https://slm-agent.stockpilot.workers.dev/paper/orders
curl -s https://slm-agent.stockpilot.workers.dev/paper/positions
```

### Market LTP (uses ANGEL_BASE if set; else demo)
```sh
curl -s "https://slm-agent.stockpilot.workers.dev/market/ltp?exchange=NSE&symbol=RELIANCE"
```

### News Search (requires NEWS_MCP_BASE)
```sh
curl -s "https://slm-agent.stockpilot.workers.dev/news/search?query=Tata%20Motors"
```

---

## Troubleshooting & FAQ

**Q: My Worker fails to deploy or run.**
- Check Wrangler version (`npx wrangler --version`). Use v3+ for nodejs_compat.
- Ensure all secrets are set (`GROQ_API_KEY` is required).
- Remove any `dotenv/config` imports from edge code.
- Check for typos in `wrangler.toml` and `package.json`.

**Q: Ollama is not working at the edge.**
- Ollama is Node-only. Use Groq for edge deployments.

**Q: How do I update secrets or environment variables?**
- Use `npx wrangler secret put <NAME>` or Cloudflare Dashboard → Workers → Bindings.

**Q: How do I test endpoints?**
- Use the curl commands above, or Postman/Insomnia.

**Q: How do I debug errors?**
- Check Cloudflare Worker logs in the Dashboard.
- Use `wrangler dev` for local preview and debugging.

---

## Best Practices

- Keep secrets out of code and only in Worker bindings.
- Use Groq for LLM at the edge; Ollama for Node.js only.
- Keep dependencies minimal for fast cold starts.
- Document all endpoints and environment variables.

---

## References

- [Cloudflare Workers Docs](https://developers.cloudflare.com/workers/)
- [Wrangler CLI Docs](https://developers.cloudflare.com/workers/wrangler/)
- [Hono Router](https://hono.dev/)