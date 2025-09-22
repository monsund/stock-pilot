# Deployment Guide: angel-mcp

This guide explains how to deploy the `angel-mcp` backend service for Stock Pilot.

---

## Prerequisites
- Docker (recommended)
- Python 3.12+ (for manual deployment)
- Uvicorn (ASGI server)

---

## Docker Deployment (Recommended)

1. Build the Docker image:
   ```sh
   cd apps/angel-mcp
   docker build -t stock-pilot-angel-mcp .
   ```
2. Run the container:
   ```sh
   docker run -d -p 8001:8001 --name angel-mcp stock-pilot-angel-mcp
   ```
   - The service will be available at `http://localhost:8001`

---

## Manual Python Deployment

1. Install dependencies:
   ```sh
   cd apps/angel-mcp
   pip install -r requirements.txt
   ```
2. Run the server:
   ```sh
   uvicorn angel_remote:http_app --host 0.0.0.0 --port 8001
   ```
   - Adjust the app path if your ASGI entrypoint differs.

---

## Environment Variables
- Set `PORT` as needed (default is 8001).
- Configure any API keys or secrets in `.env` or environment variables.
- Example: `ANGEL_MCP_BASE=http://localhost:8001`

---

## Updating the Service
- Pull the latest code and rebuild the Docker image or restart the Python server.

---

## Troubleshooting
- Check container logs: `docker logs angel-mcp`
- Ensure all dependencies are installed and ports are available.

---

## Cloud Deployment
- Use the Docker image for cloud platforms (AWS ECS, GCP Cloud Run, Azure, Render, etc.)
- Set environment variables and expose port 8001 as required.
- On Render, deployment is automatic from the repository using the Dockerfile.

---

For further help, open a GitHub issue or contact the maintainer.
