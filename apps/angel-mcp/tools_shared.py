import os
from typing import Dict, Any
import angel_client
import paper_engine

MODE = os.getenv("ANGEL_MODE", "PAPER").upper()
client = angel_client.AngelClient()

def ping() -> str:
    return "pong"
def Yo() -> str:
    return "honey"
def angel_login_status():
    return client.login_status()
def angel_login():
    return client.force_login()
def angel_logout():
    return client.logout()
def angel_search_scrip(exchange: str, query: str):
    result = client.search_scrip(exchange, query)
    return result
def angel_ltp(exchange: str, tradingsymbol: str, token: str):
    return client.ltp(exchange, tradingsymbol, token)
def angel_candles(exchange: str, token: str, interval: str, from_dt: str, to_dt: str):
    return client.candles(exchange, token, interval, from_dt, to_dt)
def angel_mode() -> str:
    return MODE
def angel_set_mode(new_mode: str) -> str:
    global MODE
    nm = new_mode.upper()
    if nm not in ("PAPER", "LIVE"):
        raise ValueError("Mode must be PAPER or LIVE")
    MODE = nm
    return MODE
def place_order(exchange: str, tradingsymbol: str, transactiontype: str,
                quantity: int, ordertype: str = "MARKET",
                price: float | None = None, token: str | None = None):
    if MODE == "PAPER":
        return paper_engine.place_order_paper(
            exchange, tradingsymbol, quantity, transactiontype, ordertype, price, token
        )
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
def list_orders():
    return paper_engine.list_orders()
def list_positions():
    return paper_engine.list_positions()