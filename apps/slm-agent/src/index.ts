import 'dotenv/config';
import express from 'express';
import { logger } from './util/logger.js';
import { StockNewsAgent } from './agents/StockNewsAgent.js';
import { SYSTEM_PROMPT, REACT_INSTRUCTIONS_AND_FEWSHOT } from './prompts/index.js';
import { OllamaAdapter } from './core/SLMAdapters.js';
import { toAnalyses } from './agents/transform.js';
import { placeMarket, listOrders, listPositions } from "./paper/store.js";
import { getLtp } from "./paper/ltp.js";
import { callTool } from './mcp/client.js';
import { enrichWithHeadlines } from './mcp/enrich.js';

type NewsArticle = { title: string; url: string; source?: string; publishedAt?: string };

const app = express();
app.use(express.json({ limit: '1mb' }));

app.get('/health', (_req, res) => res.json({ ok: true, message: 'Healthy server' }));

app.post('/analyze', async (req, res) => {
  try {
    const { query } = req.body || {};
    if (!query || typeof query !== 'string') {
      return res.status(400).json({ error: 'Body must include { query: string }' });
    }
    logger.info({ query }, 'qaz---Received /analyze request with query');
    const agent = new StockNewsAgent({
      slm: OllamaAdapter,
      maxSteps: 6,
      postNewsNudge: true,
      systemPrompt: SYSTEM_PROMPT,
      reactInstructions: REACT_INSTRUCTIONS_AND_FEWSHOT
    });
    const result = await agent.run(query);
    let analyses = toAnalyses(query, result);

    try {
      analyses = await enrichWithHeadlines(query, analyses);
    } catch (e) {
      logger.warn({ err: e }, "news-mcp enrichment failed (non-fatal)");
    }

    res.json({ analyses });
  } catch (err: any) {
    logger.error({ err }, 'Error in /analyze');
    res.status(500).json({ error: err?.message || 'Internal error' });
  }
});

const port = Number(process.env.PORT || 8000);
app.listen(port, () => {
  logger.info({ port }, `Agent News backend listening on :${port}`);
});
