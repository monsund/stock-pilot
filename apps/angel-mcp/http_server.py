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
    "login_status": angel_login_status,
    "login": angel_login,
    "logout": angel_logout,
    "search_scrip": angel_search_scrip,
    "ltp": angel_ltp,
    "candles": angel_candles,
    "mode": angel_mode,
    "set_mode": angel_set_mode,
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

# Helper to find symboltoken for a given exchange and tradingsymbol
def get_symboltoken(exchange, tradingsymbol):
    scrips = TOOL_MAP["search_scrip"](exchange, tradingsymbol)
    symboltoken = None
    if exchange and exchange.lower() == "bse":
        if scrips and scrips[0].get("symboltoken"):
            symboltoken = scrips[0]["symboltoken"]
    else:
        for scrip in scrips:
            if scrip.get("tradingsymbol", "").endswith("-EQ"):
                symboltoken = scrip.get("symboltoken")
                break
    return symboltoken

# POST endpoints for state-changing actions
@http_app.post("/login")
async def login_endpoint():
    return JSONResponse(TOOL_MAP["login"]())

@http_app.post("/logout")
async def logout_endpoint():
    return JSONResponse(TOOL_MAP["logout"]())

@http_app.post("/search_scrip")
async def search_scrip_endpoint(exchange: str, tradingSymbol: str):
    return JSONResponse(TOOL_MAP["search_scrip"](exchange, tradingSymbol))

@http_app.post("/set_mode")
async def set_mode_endpoint(new_mode: str):
    return JSONResponse(TOOL_MAP["set_mode"](new_mode))

@http_app.post("/place_order")
async def place_order_endpoint(request: Request):
    body = await request.json()
    exchange = body.get("exchange")
    tradingsymbol = body.get("tradingsymbol")
    transactiontype = body.get("transactiontype")
    quantity = body.get("quantity")
    ordertype = body.get("ordertype", "MARKET")
    price = body.get("price")
    symboltoken = get_symboltoken(exchange, tradingsymbol)
    return JSONResponse(TOOL_MAP["place_order"](exchange, tradingsymbol, transactiontype, quantity, ordertype, price, symboltoken))

# GET endpoints for read-only actions
@http_app.get("/ping")
async def ping_endpoint():
    return JSONResponse(TOOL_MAP["ping"]())

@http_app.post("/ltp")
async def ltp_endpoint(request: Request):
    try:
        body = await request.json()
        exchange = body.get("exchange")
        tradingsymbol = body.get("tradingsymbol")
        symboltoken = get_symboltoken(exchange, tradingsymbol)
        if not symboltoken:
            return JSONResponse({"error": f"No symboltoken found for {tradingsymbol} on {exchange}"}, status_code=404)
        result = angel_ltp(exchange, tradingsymbol, symboltoken)
        return JSONResponse(result)
    except Exception as e:
        return JSONResponse({"error": str(e)}, status_code=500)

@http_app.post("/candles")
async def candles_endpoint(request: Request):
    try:
        body = await request.json()
        exchange = body.get("exchange")
        tradingsymbol = body.get("tradingsymbol")
        interval = body.get("interval")
        from_date = body.get("from_date")
        to_date = body.get("to_date")
        symboltoken = get_symboltoken(exchange, tradingsymbol)
        if not symboltoken:
            return JSONResponse({"error": f"No symboltoken found for {tradingsymbol} on {exchange}"}, status_code=404)
        result = TOOL_MAP["candles"](exchange, symboltoken, interval, from_date, to_date)
        return JSONResponse(result)
    except Exception as e:
        return JSONResponse({"error": str(e)}, status_code=500)

@http_app.get("/mode")
async def mode_endpoint():
    return JSONResponse(TOOL_MAP["mode"]())

@http_app.get("/list_orders")
async def list_orders_endpoint():
    return JSONResponse(TOOL_MAP["list_orders"]())

@http_app.get("/list_positions")
async def list_positions_endpoint():
    return JSONResponse(TOOL_MAP["list_positions"]())

if __name__ == "__main__":
    port = int(os.environ.get("ANGEL_HTTP_PORT", 8001))
    print(f"angel-mcp HTTP server running on port {port}", file=sys.stderr, flush=True)
    uvicorn.run(http_app, host="0.0.0.0", port=port, log_level="info")