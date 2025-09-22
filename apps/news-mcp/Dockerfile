# ---- builder with uv (fast Python installer) ----
FROM ghcr.io/astral-sh/uv:python3.11-bookworm AS builder

WORKDIR /app
# project files
COPY pyproject.toml ./
# package code
COPY src ./src

# install project without dev deps; creates .venv in /app
RUN uv sync --no-dev

# ---- runtime ----
FROM python:3.11-slim-bookworm AS runtime
ENV PYTHONUNBUFFERED=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1 \
    PATH="/app/.venv/bin:${PATH}"

WORKDIR /app
# copy virtualenv and code
COPY --from=builder /app/.venv /app/.venv
COPY --from=builder /app /app

# Render (or similar) will inject PORT; default for local
ENV PORT=5101

# IMPORTANT: use your actual ASGI app path: news_mcp.server:http_app
CMD ["sh", "-c", "uvicorn news_mcp.server:http_app --host 0.0.0.0 --port ${PORT} --log-level info"]
