import json, os, time
from pathlib import Path
from typing import Dict, Any, List
from angel_client import AngelClient

client = AngelClient()

STORE = Path(os.getenv("PAPER_STORE_PATH", "paper_store.json"))

def _empty_store() -> Dict[str, Any]:
    # positions as a dict keyed by "EX:SYMBOL:TOKEN"
    return {"orders": [], "positions": {}}

def _normalize_schema(d: Dict[str, Any]) -> Dict[str, Any]:
    # Ensure required keys exist with correct types
    if not isinstance(d, dict):
        return _empty_store()
    d.setdefault("orders", [])
    d.setdefault("positions", {})
    if not isinstance(d["orders"], list):
        d["orders"] = []
    if not isinstance(d["positions"], dict):
        # migrate old list format -> dict
        d["positions"] = {}
    return d

def _load() -> Dict[str, Any]:
    if not STORE.exists():
        return _empty_store()
    try:
        data = json.loads(STORE.read_text() or "{}")
    except Exception:
        # corrupted / empty file → reset
        data = {}
    return _normalize_schema(data)

def _save(d: Dict[str, Any]) -> None:
    STORE.write_text(json.dumps(_normalize_schema(d), indent=2))

def list_orders() -> List[Dict[str, Any]]:
    return _load()["orders"]

def list_positions() -> Dict[str, Any]:
    return _load()["positions"]

def _apply_fill(positions: Dict[str, Any], key: str, side: str, qty: int, price: float):
    pos = positions.get(key) or {"qty": 0, "avgPrice": 0.0}
    if side.upper() == "BUY":
        new_qty = pos["qty"] + qty
        new_avg = ((pos["qty"] * pos["avgPrice"]) + (qty * price)) / max(new_qty, 1)
        pos.update({"qty": new_qty, "avgPrice": new_avg})
    else:
        pos.update({"qty": pos["qty"] - qty, "avgPrice": pos.get("avgPrice", 0.0)})
    positions[key] = pos

def _prefer_eq(hits: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    eq = [h for h in hits if str(h.get("tradingsymbol", "")).endswith("-EQ")]
    return eq or hits

def place_order_paper(
    exchange: str,
    tradingsymbol: str,
    quantity: int,
    transactiontype: str,
    ordertype: str = "MARKET",
    price: float | None = None,
    token: str | None = None,
) -> Dict[str, Any]:

    # Normalize user input
    exchange        = (exchange or "").strip().upper()
    tradingsymbol   = (tradingsymbol or "").strip().upper()
    transactiontype = (transactiontype or "BUY").strip().upper()
    ordertype       = (ordertype or "MARKET").strip().upper()
    quantity        = int(quantity or 1)
    price           = float(price) if price is not None else None
    token           = str(token).strip() if token else None

    data = _load()

    # Resolve token/series if needed (prefer -EQ)
    if token is None or not tradingsymbol:
        hits = client.search_scrip(exchange, tradingsymbol or "")
        hits = _prefer_eq(hits)
        if not hits:
            raise RuntimeError(f"No scrip found for {tradingsymbol or '(empty)'} on {exchange}")
        top = hits[0]
        tradingsymbol = str(top.get("tradingsymbol") or tradingsymbol)
        token = str(top.get("symboltoken") or top.get("token"))

    # Determine fill price
    if ordertype == "MARKET":
        l = client.ltp(exchange, tradingsymbol, token)
        # Angel LTP payloads vary; handle both "data": {"ltp": ...} and flat fields
        ltp_val = (
            l.get("data", {}).get("ltp")
            if isinstance(l.get("data"), dict)
            else l.get("ltp") or l.get("LTP")
        )
        if ltp_val is None:
            raise RuntimeError(f"Could not read LTP from response: {l}")
        p = float(ltp_val)
    else:
        if price is None:
            raise RuntimeError("LIMIT order requires 'price'")
        p = float(price)

    oid = f"PAPER-{int(time.time() * 1000)}"
    order = {
        "orderid": oid,
        "mode": "PAPER",
        "exchange": exchange,
        "tradingsymbol": tradingsymbol,
        "symboltoken": token,
        "transactiontype": transactiontype,
        "ordertype": ordertype,
        "quantity": quantity,
        "price": p,
        "status": "FILLED",
        "timestamp": int(time.time()),
    }

    # Persist
    data["orders"].append(order)
    key = f"{exchange}:{tradingsymbol}:{token}"
    _apply_fill(data["positions"], key, transactiontype, quantity, p)
    _save(data)
    return order
