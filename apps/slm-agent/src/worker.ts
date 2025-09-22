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

app.post('/paper/orders', async (c) => {
  const { symbol, side, qty, type = 'MARKET' } = await c.req.json().catch(() => ({}))
  if (!symbol?.exchange || !symbol?.symbol) return c.json({ error: 'symbol {exchange, symbol} required' }, 400)
  if (side !== 'BUY' && side !== 'SELL') return c.json({ error: 'side must be BUY or SELL' }, 400)
  if (type !== 'MARKET') return c.json({ error: 'only MARKET supported' }, 400)
  const size = Math.max(1, Number(qty) || 1)
  const price = await getLtp(symbol)
  const order = placeMarket(symbol, side, size, price)
  return c.json({ order }, 201)
})

app.get('/paper/orders', (_c) => _c.json({ orders: listOrders() }))
app.get('/paper/positions', (_c) => _c.json({ positions: listPositions() }))

app.get('/market/ltp', async (c) => {
  const exchange = c.req.query('exchange') || ''
  const symbol = c.req.query('symbol') || ''
  if (!exchange || !symbol) return c.json({ error: 'exchange & symbol required' }, 400)
  const ltp = await getLtp({ exchange: exchange as any, symbol })
  return c.json({ ltp })
})

app.get('/news/search', async (c) => {
  const base = c.env.NEWS_MCP_BASE
  if (!base) return c.json({ error: 'NEWS_MCP_BASE not set' }, 501)
  const query = c.req.query('query') || ''
  if (!query) return c.json({ error: 'query required' }, 400)
  const articles = await callTool<any, any[]>(base, 'news.search', { query, lookback: '14d', locale: 'en-IN' })
  return c.json({ articles })
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
