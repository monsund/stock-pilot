# Stock Pilot

Stock Pilot is a modular trading and analysis platform composed of several microservices and a modern frontend. Each service is designed for a specific purpose and can be developed, deployed, and scaled independently.

## Services Overview


### [Frontend](apps/frontend/)
A Next.js/React web application for stock trading, analysis, and dashboard visualization. Integrates with backend APIs for market data, trading, and news.

### [Angel MCP](apps/angel-mcp/)
A FastAPI backend service for interacting with Angel One MCP APIs. Provides endpoints for market data, trading, and paper trading simulation.

### [SLM Agent](apps/slm-agent/)
A Node.js/TypeScript backend for agent orchestration, paper trading, and LLM-powered analysis. Integrates with Ollama for LLM inference and other microservices for news and market data.

### [News MCP](apps/news-mcp/)
A FastAPI backend service for aggregating and searching financial news from Google News and other sources. Used for news enrichment in agent flows.

---

For detailed setup, API documentation, and architecture, see the README.md in each service directory.

---

MIT License
