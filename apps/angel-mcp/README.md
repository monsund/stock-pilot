
# Angel MCP

Angel MCP is a backend service for automated trading, market data retrieval, and tool orchestration using Angel One’s SmartAPI. It provides:

- A FastAPI-based MCP server for tool logic and orchestration
- An HTTP server for REST API access to trading and market data
- Support for both live and paper trading (simulated)
- Extensible tools for scrip search, LTP, candles, order placement, and more

This project is designed to be integrated with frontend dashboards and other automation clients.

---

## Running MCP and HTTP Servers


### 1. MCP Server

Start the MCP server (agent/tools logic) on port 8000 using uvicorn (recommended for FastAPI apps):

```sh
cd apps/angel-mcp
uvicorn server:http_app --host 0.0.0.0 --port 8000 --reload
# or, if you want to specify the port via env:
MCP_PORT=8000 uvicorn server:http_app --host 0.0.0.0 --port 8000 --reload
```


### 2. HTTP Server


Start the HTTP server (tool API exposure) on port 8001:

```sh
cd apps/angel-mcp
uvicorn http_server:http_app --host 0.0.0.0 --port 8001 --reload
# or, if you want to specify the port via env:
ANGEL_HTTP_PORT=8001 uvicorn http_server:http_app --host 0.0.0.0 --port 8001 --reload
```

#### HTTP API Endpoints

The HTTP server exposes the following endpoints for frontend and external integration:

**POST Endpoints**

- `/login` — Login to Angel One
- `/logout` — Logout from Angel One
- `/search_scrip` — Search for a scrip
	- Body: `{ "exchange": "NSE", "tradingSymbol": "RELIANCE" }`
- `/set_mode` — Set trading mode
	- Body: `{ "new_mode": "PAPER" }`
- `/place_order` — Place an order
	- Body: `{ "exchange": "NSE", "tradingsymbol": "RELIANCE", "transactiontype": "BUY", "quantity": 10, "ordertype": "MARKET", "price": null }`
- `/ltp` — Get last traded price
	- Body: `{ "exchange": "NSE", "tradingsymbol": "RELIANCE" }`
- `/candles` — Get candle data
	- Body: `{ "exchange": "NSE", "tradingsymbol": "RELIANCE", "interval": "ONE_MINUTE", "from_date": "2025-09-13 09:15", "to_date": "2025-09-13 15:30" }`

**GET Endpoints**

- `/ping` — Health check
- `/mode` — Get current trading mode
- `/list_orders` — List all paper orders
- `/list_positions` — List all paper positions

All endpoints return JSON responses. For POST endpoints, send a JSON body as shown in the examples above.

#### Notes
- Make sure FastAPI and Uvicorn are installed in your environment:
	```sh
	pip install fastapi uvicorn
	# or
	uv pip install fastapi uvicorn
	```
- Both servers must run on different ports.
- You can use `.env` files or export environment variables for port configuration.
# Angel One MCP Server

This project provides a server and client implementation for interacting with Angel One’s SmartAPI, supporting automated trading, data retrieval, and tool orchestration.

## Features

- Connects to Angel One SmartAPI using secure credentials
- Supports login, session management, and token refresh
- Place live and paper orders
- Retrieve market data (LTP, candles, scrip search)
- Extensible tool interface for remote and local operations

## Setup

1. **Clone the repository**
	 ```sh
	 git clone <repo-url>
	 cd angel-one-mcp
	 ```

2. **Create and activate a Python virtual environment**
	 ```sh
	 python3 -m venv .venv
	 source .venv/bin/activate
	 ```

3. **Install dependencies**
	 ```sh
	 uv pip install --system --requirements angel-mcp-server/pyproject.toml
	 ```

4. **Configure environment variables**
	 - Copy `.env.example` to `.env` and fill in your Angel One API credentials:
		 ```
		 ANGEL_ONE_API_KEY=your_api_key
		 ANGEL_ONE_CLIENT_CODE=your_client_code
		 ANGEL_ONE_PASSWORD=your_password
		 ANGEL_ONE_TOTP_SECRET=your_totp_secret
		 ```

## Usage


- **Run the MCP server**
	```sh
	python angel-mcp-server/server.py
	```


**Run MCP Inspector (to test available MCP tools)**
	1. Make sure the MCP server is running.
	2. Open a new terminal in the root folder of your project and run:
		```sh
		npx @modelcontextprotocol/inspector
		```
	3. Connect to your running MCP server and explore/test available tools interactively.

---

**Running with MCP Inspector**

You can test this MCP server using the MCP Inspector (a GUI for Model Context Protocol servers).

Install MCP Inspector:

```sh
brew install --cask mcp-inspector   # macOS
```
or download from the releases page.

Open MCP Inspector and configure:

- **Transport Type:** STDIO
- **Command:** path to your uv binary (find it with `which uv`), e.g. `/Users/<you>/.local/bin/uv`
- **Arguments:**
	run python <path-directory-to-server.py>/server.py
- **Environment Variables:** Add any required (ANGEL_ONE_API_KEY, ANGEL_ONE_CLIENT_CODE, etc.)

Hit Restart → you should see the MCP server connect.
From the Tools tab, you can now call tools like angel_search_scrip, angel_ltp, place_order, etc.

- **Run remote client**
	```sh
	python angel-mcp-server/angel_remote.py
	```

- **Run local client**
	```sh
	python angel-mcp-server/angel_client.py
	```


## Project Structure & Script Descriptions

```
angel-mcp-server/
	server.py         # Main MCP server entry point; registers and runs tools
	angel_client.py   # AngelClient class for SmartAPI session and trading functions
	angel_remote.py   # Standalone remote client for orchestrating MCP server
	paper_engine.py   # Paper trading logic and simulation
	mcp.json          # MCP tool configuration
	pyproject.toml    # Python dependencies
	paper_store.json  # Local file for simulated (paper) trades and positions
	.env.example      # Example environment variables (template)
	README.md         # Project documentation
	...
```

## Supported Python Version

Tested with Python 3.12+

## .env File Security

Never commit your `.env` file with real credentials to version control. Use `.env.example` for sharing variable names only.




## Paper Trading & paper_store.json

### What is Paper Trading?
Paper trading allows you to simulate trading without risking real money. All orders and positions are tracked locally, and no actual trades are placed with Angel One. This is useful for testing strategies, learning the platform, or debugging your code.

### How It Works
- When the MCP server is in PAPER mode, all order and position operations are handled by the paper trading engine (`paper_engine.py`).
- Orders are stored in a local file (`paper_store.json`).
- You can view, place, and manage simulated orders and positions just like live trading, but with no financial risk.


### paper_store.json
This file keeps a record of all simulated orders and positions. It is automatically created and updated by the server.

#### Initial Setup
You can set the initial `paper_store.json` as:
```json
{
	"orders": [],
	"positions": {}
}
```
The server will populate it as you place paper trades.

#### Default Structure (after trading)
```json
{
	"orders": [
		{
			"orderid": "PAPER-<timestamp>",
			"mode": "PAPER",
			"exchange": "NSE",
			"tradingsymbol": "RELIANCE-EQ",
			"symboltoken": "2885",
			"transactiontype": "BUY",
			"ordertype": "MARKET",
			"quantity": 10,
			"price": 1395.0,
			"status": "FILLED",
			"timestamp": <unix_timestamp>
		}
		// ...more orders
	],
	"positions": {
		"NSE:RELIANCE-EQ:2885": {
			"qty": 0,
			"avgPrice": 1395.0
		}
		// ...more positions
	}
}
```

#### Fields
- `orders`: List of all simulated orders with details.
- `positions`: Dictionary of positions by key (`exchange:tradingsymbol:token`), showing quantity and average price.


Below are all available MCP tools, their arguments, and example usage:

### 1. ping
- **Description:** Health check.
- **Arguments:** None
- **Example:**
	```python
	ping()
	# returns: "pong"
	```

### 2. Yo
- **Description:** Simple test tool.
- **Arguments:** None
- **Example:**
	```python
	Yo()
	# returns: "honey"
	```

### 3. angel_login_status
- **Description:** Check login status.
- **Arguments:** None
- **Example:**
	```python
	angel_login_status()
	```

### 4. angel_login
- **Description:** Force login to Angel One.
- **Arguments:** None
- **Example:**
	```python
	angel_login()
	```

### 5. angel_logout
- **Description:** Logout from Angel One.
- **Arguments:** None
- **Example:**
	```python
	angel_logout()
	```

### 6. angel_search_scrip
- **Description:** Search for a scrip.
- **Arguments:**
	- `exchange` (str): e.g., "NSE"
	- `query` (str): e.g., "RELIANCE"
- **Example:**
	```python
	angel_search_scrip("NSE", "RELIANCE")
	```

### 7. angel_ltp
- **Description:** Get last traded price.
- **Arguments:**
	- `exchange` (str): e.g., "NSE"
	- `tradingsymbol` (str): e.g., "RELIANCE"
	- `token` (str): scrip token
- **Example:**
	```python
	angel_ltp("NSE", "RELIANCE-EQ", "2885")
	```

### 8. angel_candles
- **Description:** Get candle data.
- **Arguments:**
	- `exchange` (str): e.g., "NSE"
	- `token` (str): scrip token
	- `interval` (str): e.g., "ONE_MINUTE"
	- `from_dt` (str): e.g., "2025-09-13 09:15"
	- `to_dt` (str): e.g., "2025-09-13 15:30"
- **Example:**
	```python
	angel_candles("NSE", "2885", "ONE_MINUTE", "2025-09-13 09:15", "2025-09-13 15:30")
	```

### 9. angel_mode
- **Description:** Get current mode (PAPER or LIVE).
- **Arguments:** None
- **Example:**
	```python
	angel_mode()
	```

### 10. angel_set_mode
- **Description:** Set mode to PAPER or LIVE.
- **Arguments:**
	- `new_mode` (str): "PAPER" or "LIVE"
- **Example:**
	```python
	angel_set_mode("LIVE")
	```

### 11. place_order
- **Description:** Place an order (PAPER or LIVE).
- **Arguments:**
	- `exchange` (str): e.g., "NSE"
	- `tradingsymbol` (str): e.g., "RELIANCE"
	- `transactiontype` (str): "BUY" or "SELL"
	- `quantity` (int): e.g., 10
	- `ordertype` (str, optional): "MARKET" or "LIMIT"
	- `price` (float, optional): required for LIMIT orders
	- `token` (str, optional): scrip token
- **Example:**
	```python
	place_order("NSE", "RELIANCE", "BUY", 10, "MARKET")
	place_order("NSE", "RELIANCE", "SELL", 5, "LIMIT", 2500.0, "2885")
	```

### 12. list_orders
- **Description:** List all paper orders.
- **Arguments:** None
- **Example:**
	```python
	list_orders()
	```

### 13. list_positions
- **Description:** List all paper positions.
- **Arguments:** None
- **Example:**
	```python
	list_positions()
	```

- Ensure all environment variables are set.
- Use the correct Python interpreter in your IDE.
- Install missing packages with `uv pip install <package>`.

## License

MIT
