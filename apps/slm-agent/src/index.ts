import 'dotenv/config';
import express from 'express';
import { logger } from './util/logger.js';
import { StockNewsAgent } from './agents/StockNewsAgent.js';
import { SYSTEM_PROMPT, REACT_INSTRUCTIONS_AND_FEWSHOT } from './prompts/index.js';
import { OllamaAdapter } from './core/SLMAdapters.js';
import { toAnalyses } from './agents/transform.js';
import { placeMarket, listOrders, listPositions } from "./paper/store.js";
import { getLtp } from "./paper/ltp.js";


const app = express();
app.use(express.json({ limit: '1mb' }));

app.get('/health', (_req, res) => res.json({ ok: true, message: 'Healthy server' }));

app.post('/analyze', async (req, res) => {
  try {
    const { query } = req.body || {};
    if (!query || typeof query !== 'string') {
      return res.status(400).json({ error: 'Body must include { query: string }' });
    }
    logger.info({ query }, 'Received /analyze request');
      const agent = new StockNewsAgent({
        llm: OllamaAdapter,
        maxSteps: 6,
        postNewsNudge: true,
        systemPrompt: SYSTEM_PROMPT,
        reactInstructions: REACT_INSTRUCTIONS_AND_FEWSHOT
      });
    const result = await agent.run(query);
    const analyses = toAnalyses(query, result);
    res.json({ analyses });
  } catch (err: any) {
    logger.error({ err }, 'Error in /analyze');
    res.status(500).json({ error: err?.message || 'Internal error' });
  }
});

app.post("/paper/orders", async (req, res) => {
  try {
    const { symbol, side, qty, type = "MARKET" } = req.body || {};
    if (!symbol?.exchange || !symbol?.symbol) return res.status(400).json({ error: "symbol {exchange, symbol} required" });
    if (side !== "BUY" && side !== "SELL") return res.status(400).json({ error: "side must be BUY or SELL" });
    if (type !== "MARKET") return res.status(400).json({ error: "only MARKET supported" });

    const size = Math.max(1, Number(qty) || 1);
    const price = await getLtp(symbol);
    const order = placeMarket(symbol, side, size, price);
    res.status(201).json({ order });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || "Internal error" });
  }
});

app.get("/paper/orders", (_req, res) => {
  res.json({ orders: listOrders() });
});

app.get("/paper/positions", (_req, res) => {
  res.json({ positions: listPositions() });
});


const port = Number(process.env.PORT || 8000);
app.listen(port, () => {
  logger.info({ port }, `Agent News backend listening on :${port}`);
});
