import 'dotenv/config';
import express from 'express';
import { logger } from './util/logger.js';
import { StockNewsAgent } from './agents/StockNewsAgent.js';
import { SYSTEM_PROMPT, REACT_INSTRUCTIONS_AND_FEWSHOT } from './prompts/index.js';
import { OllamaAdapter } from './core/SLMAdapters.js';

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
    res.json(result);
  } catch (err: any) {
    logger.error({ err }, 'Error in /analyze');
    res.status(500).json({ error: err?.message || 'Internal error' });
  }
});

const port = Number(process.env.PORT || 8000);
app.listen(port, () => {
  logger.info({ port }, `Agent News backend listening on :${port}`);
});
