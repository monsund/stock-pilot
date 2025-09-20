from mcp.server.fastmcp import FastMCP
import sys, os
from tools_shared import ping, Yo, angel_login_status, angel_login, angel_logout, angel_search_scrip, angel_ltp, angel_candles, angel_mode, angel_set_mode, place_order, list_orders, list_positions

app = FastMCP("angel-one-mcp")

@app.tool()
def ping_tool():
    return ping()

@app.tool()
def Yo_tool():
    return Yo()

@app.tool()
def angel_login_status_tool():
    return angel_login_status()

@app.tool()
def angel_login_tool():
    return angel_login()

@app.tool()
def angel_logout_tool():
    return angel_logout()

@app.tool()
def angel_search_scrip_tool(exchange: str, query: str):
    return angel_search_scrip(exchange, query)

@app.tool()
def angel_ltp_tool(exchange: str, tradingsymbol: str, token: str):
    return angel_ltp(exchange, tradingsymbol, token)

@app.tool()
def angel_candles_tool(exchange: str, token: str, interval: str, from_dt: str, to_dt: str):
    return angel_candles(exchange, token, interval, from_dt, to_dt)

@app.tool()
def angel_mode_tool():
    return angel_mode()

@app.tool()
def angel_set_mode_tool(new_mode: str):
    return angel_set_mode(new_mode)

@app.tool()
def place_order_tool(exchange: str, tradingsymbol: str, transactiontype: str,
                quantity: int, ordertype: str = "MARKET",
                price: float | None = None, token: str | None = None):
    return place_order(exchange, tradingsymbol, transactiontype, quantity, ordertype, price, token)

@app.tool()
def list_orders_tool():
    return list_orders()

@app.tool()
def list_positions_tool():
    return list_positions()

if __name__ == "__main__":
    port = int(os.environ.get("MCP_PORT", 8000))
    print(f"qaz----angel aggregator running on port {port}", file=sys.stderr, flush=True)
    app.run()
