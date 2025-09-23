import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from './util/logger.js'
import { StockNewsAgent } from './agents/StockNewsAgent.js'
import { SYSTEM_PROMPT, REACT_INSTRUCTIONS_AND_FEWSHOT } from './prompts/index.js'
import { OllamaAdapter } from './core/SLMAdapters.js'
import { toAnalyses } from './agents/transform.js'
import { placeMarket, listOrders, listPositions } from "./paper/store.js"
import { getLtp } from "./paper/ltp.js"
import { callTool } from './mcp/client.js'
import { enrichWithHeadlines } from './mcp/enrich.js'

type Env = {
  APP_NAME: string
  USE_GROQ?: string
  GROQ_API_KEY?: string
  GROQ_MODEL_Llama?: string
  OLLAMA_MODEL?: string
  NEWS_MCP_BASE?: string
  ANGEL_BASE?: string
  LOG_LEVEL?: string
}

const app = new Hono<{ Bindings: Env }>()
app.use('/*', cors({
  origin: '*',
  allowHeaders: ['Content-Type', 'Authorization'],
  allowMethods: ['GET','POST','OPTIONS'],
  maxAge: 86400
}))

app.get('/health', (c) => c.json({ ok: true, message: 'Healthy server' }))

app.post('/analyze', async (c) => {
  try {
    const body = await c.req.json<{ query?: string }>().catch(() => ({} as any))
    const query = (body?.query ?? '').toString()
    if (!query) return c.json({ error: 'Body must include { query: string }' }, 400)

    const agent = new StockNewsAgent({
      slm: OllamaAdapter,
      maxSteps: 6,
      postNewsNudge: true,
      systemPrompt: SYSTEM_PROMPT,
      reactInstructions: REACT_INSTRUCTIONS_AND_FEWSHOT
    })

    const result = await agent.run(query)
    let analyses = toAnalyses(query, result)
    if (c.env.NEWS_MCP_BASE) analyses = await enrichWithHeadlines(query, analyses)
    return c.json({ analyses, run: result })
  } catch (err: any) {
    logger.error({ err }, 'analyze error')
    return c.json({ error: err?.message || 'Internal error' }, 500)
  }
})

// Export Worker and inject env → process.env so existing modules can read it
export default {
  fetch(request: Request, env: Env, ctx: ExecutionContext) {
    const g: any = globalThis as any
    g.process = g.process || { env: {} }
    Object.assign(g.process.env, {
      APP_NAME: env.APP_NAME,
      USE_GROQ: env.USE_GROQ,
      GROQ_API_KEY: env.GROQ_API_KEY,
      GROQ_MODEL_Llama: env.GROQ_MODEL_Llama,
      OLLAMA_MODEL: env.OLLAMA_MODEL,
      NEWS_MCP_BASE: env.NEWS_MCP_BASE,
      ANGEL_BASE: env.ANGEL_BASE,
      LOG_LEVEL: env.LOG_LEVEL
    })
    return app.fetch(request, env, ctx)
  }
}
