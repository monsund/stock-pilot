# News MCP

News MCP is a backend service for aggregating, analyzing, and serving financial news data for trading and research applications. It is designed to be integrated with trading dashboards, agents, and automation tools.

## Features

- FastAPI-based MCP server for news logic and orchestration
- REST API endpoints for news retrieval and analysis
- Extensible architecture for adding custom news sources and analytics
- Designed for integration with trading and research frontends

## Setup

1. **Clone the repository**
   ```sh
   git clone <repo-url>
   cd apps/news-mcp
   ```

2. **Create and activate a Python virtual environment**
   ```sh
   python3 -m venv .venv
   source .venv/bin/activate
   ```

3. **Install dependencies**
   ```sh
   uv pip install --system --requirements pyproject.toml
   ```

## Running the Server

Start the MCP server on port 5101 using uvicorn:

```sh
uvicorn src.news_mcp.server:app --host 0.0.0.0 --port 5101 --reload
```

## API Endpoints

- `/news` — Retrieve latest financial news
- `/analyze` — Analyze news sentiment or relevance
- `/health` — Health check

All endpoints return JSON responses. See the server code for request/response formats.

## Project Structure

```
src/news_mcp/
    server.py         # Main MCP server entry point
    __init__.py       # Package init
    ...               # Additional modules and logic
pyproject.toml        # Python dependencies
README.md             # Project documentation
```

## License

MIT
