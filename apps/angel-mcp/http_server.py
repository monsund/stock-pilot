import sys
import os
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
import uvicorn
from fastapi.middleware.cors import CORSMiddleware

from tools_shared import ping, Yo, angel_login_status, angel_login, angel_logout, angel_search_scrip, angel_ltp, angel_candles, angel_mode, angel_set_mode, place_order, list_orders, list_positions

http_app = FastAPI(title="angel-mcp-http")

TOOL_MAP = {
    "ping": ping,
    "Yo": Yo,
    "angel_login_status": angel_login_status,
    "angel_login": angel_login,
    "angel_logout": angel_logout,
    "angel_search_scrip": angel_search_scrip,
    "angel_ltp": angel_ltp,
    "angel_candles": angel_candles,
    "angel_mode": angel_mode,
    "angel_set_mode": angel_set_mode,
    "place_order": place_order,
    "list_orders": list_orders,
    "list_positions": list_positions,
}

    # Allow frontend dev server to access API
http_app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Replace with your frontend URL in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@http_app.post("/tools/{tool_name}")
async def call_tool(tool_name: str, request: Request):
    if tool_name not in TOOL_MAP:
        return JSONResponse({"error": f"Tool '{tool_name}' not found"}, status_code=404)
    args = await request.json()
    try:
        result = TOOL_MAP[tool_name](**args) if args else TOOL_MAP[tool_name]()
        return JSONResponse(result)
    except Exception as e:
        return JSONResponse({"error": str(e)}, status_code=500)

if __name__ == "__main__":
    print("angel-mcp HTTP server running", file=sys.stderr, flush=True)
    uvicorn.run(http_app, host="0.0.0.0", port=int(os.getenv("ANGEL_HTTP_PORT", "6277")), log_level="info")