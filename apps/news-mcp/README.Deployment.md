# Deployment Guide: news-mcp

This guide explains how to deploy the `news-mcp` backend service for Stock Pilot.

---

## Prerequisites
- Docker (recommended)
- Python 3.11+ (for manual deployment)
- Uvicorn (ASGI server)

---

## Docker Deployment (Recommended)

1. Build the Docker image:
   ```sh
   cd apps/news-mcp
   docker build -t stock-pilot-news-mcp .
   ```
2. Run the container:
   ```sh
   docker run -d -p 5101:5101 --name news-mcp stock-pilot-news-mcp
   ```
   - The service will be available at `http://localhost:5101`

---

## Manual Python Deployment

1. Install dependencies:
   ```sh
   cd apps/news-mcp
   pip install -r requirements.txt
   ```
2. Run the server:
   ```sh
   uvicorn news_mcp.server:http_app --host 0.0.0.0 --port 5101
   ```

---

## Environment Variables
- Set `PORT` as needed (default is 5101).
- Configure any API keys or secrets in `.env` or environment variables.

---

## Updating the Service
- Pull the latest code and rebuild the Docker image or restart the Python server.

---

## Troubleshooting
- Check container logs: `docker logs news-mcp`
- Ensure all dependencies are installed and ports are available.

---


## Cloud Deployment
- The news-mcp service is deployed to [Render](https://render.com), a cloud platform for web services.
- Render automatically builds and deploys from the repository using the provided Dockerfile.
- Environment variables (such as `PORT` and any API keys) can be set in the Render dashboard.
- The service is exposed on port 5101 (or as configured in Render).
- For updates, push changes to the main branch and Render will redeploy automatically.

- You can also use the Docker image for other cloud platforms (AWS ECS, GCP Cloud Run, Azure, etc.)
- Set environment variables and expose port 5101 as required.

---

For further help, open a GitHub issue or contact the maintainer.
