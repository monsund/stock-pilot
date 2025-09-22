# ---- builder with uv (Python 3.12) ----
FROM ghcr.io/astral-sh/uv:python3.12-bookworm AS builder
WORKDIR /app

# project files
COPY pyproject.toml ./
# app code
COPY . .

# install runtime deps only; creates /app/.venv
RUN uv sync --no-dev

# ---- runtime ----
FROM python:3.12-slim-bookworm AS runtime
ENV PYTHONUNBUFFERED=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1 \
    PATH="/app/.venv/bin:${PATH}"

WORKDIR /app
COPY --from=builder /app/.venv /app/.venv
COPY --from=builder /app /app

# Render injects PORT; keep a sensible default for local
ENV PORT=8001
# Force PAPER mode unless you override later
ENV ANGEL_MODE=PAPER

# Your FastAPI app lives in http_server.py as `http_app`
CMD ["sh", "-c", "uvicorn http_server:http_app --host 0.0.0.0 --port ${PORT} --log-level info"]
