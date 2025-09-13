from mcp.server.fastmcp import FastMCP
import sys, logging, os
from typing import Dict, Any
import angel_client

import paper_engine

app = FastMCP("angel-one-mcp")


MODE = os.getenv("ANGEL_MODE", "PAPER").upper()  # PAPER by default

@app.tool()
def ping() -> str:
    return "pong"

@app.tool()
def Yo() -> str:
    return "honey"

# --- Session utilities ---
client = angel_client.AngelClient()
@app.tool()
def angel_login_status():
    return client.login_status()

@app.tool()
def angel_login():
    return client.force_login()

@app.tool()
def angel_logout():
    return client.logout()

# --- Market data ---
@app.tool()
def angel_search_scrip(exchange: str, query: str):
    return client.search_scrip(exchange, query)

@app.tool()
def angel_ltp(exchange: str, tradingsymbol: str, token: str):
    return client.ltp(exchange, tradingsymbol, token)

@app.tool()
def angel_candles(exchange: str, token: str, interval: str, from_dt: str, to_dt: str):
    return client.candles(exchange, token, interval, from_dt, to_dt)

# --- Orders (PAPER default) ---
@app.tool()
def angel_mode() -> str:
    return MODE

@app.tool()
def angel_set_mode(new_mode: str) -> str:
    global MODE
    nm = new_mode.upper()
    if nm not in ("PAPER", "LIVE"):
        raise ValueError("Mode must be PAPER or LIVE")
    MODE = nm
    return MODE

@app.tool()
def place_order(exchange: str, tradingsymbol: str, transactiontype: str,
                quantity: int, ordertype: str = "MARKET",
                price: float | None = None, token: str | None = None):
    if MODE == "PAPER":
        return paper_engine.place_order_paper(
            exchange, tradingsymbol, quantity, transactiontype, ordertype, price, token
        )
    # LIVE (use carefully)
    if token is None:
        hits = client.search_scrip(exchange, tradingsymbol)
        if not hits:
            raise RuntimeError(f"No scrip found for {tradingsymbol} on {exchange}")
        token = str(hits[0]["token"])
    params: Dict[str, Any] = {
        "variety": "NORMAL",
        "tradingsymbol": tradingsymbol,
        "symboltoken": str(token),
        "transactiontype": transactiontype,
        "exchange": exchange,
        "ordertype": ordertype,
        "producttype": "INTRADAY",
        "duration": "DAY",
        "quantity": int(quantity),
    }
    if ordertype.upper() == "LIMIT":
        if price is None:
            raise ValueError("LIMIT orders need 'price'")
        params["price"] = float(price)
    return client.place_order_live(params)

@app.tool()
def list_orders():
    return paper_engine.list_orders()

@app.tool()
def list_positions():
    return paper_engine.list_positions()

if __name__ == "__main__":
    print("qaz----angel aggregator running", file=sys.stderr, flush=True)
    app.run()
