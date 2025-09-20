
# Refactored AngelClient class
import os
import threading
import logging
from typing import Optional, Dict, Any, List
import pyotp
from SmartApi.smartConnect import SmartConnect
import requests
from dotenv import load_dotenv

load_dotenv()

class AngelClient:
    def __init__(self) -> None:
        self._lock = threading.Lock()
        self._client: Optional[SmartConnect] = None
        self._session: Optional[Dict[str, Any]] = None
        self.log = logging.getLogger("angel_client")

    def _need(self, name: str) -> str:
        v = os.getenv(name)
        if not v:
            raise RuntimeError(f"Missing environment variable: {name}")
        return v

    def _api_key(self) -> str:
        return self._need("ANGEL_ONE_API_KEY")

    def _bearer(self) -> str:
        if not self._session or not (self._session.get("jwt") or self._session.get("access")):
            self._login()
        return self._session.get("jwt") or self._session.get("access")

    def _auth_header_value(self, token: str) -> str:
        return token if isinstance(token, str) and token.startswith("Bearer ") else f"Bearer {token}"

    def _headers(self, token: str) -> Dict[str, str]:
        # required by Angel One SmartAPI specification
        local_ip = os.getenv("ANGEL_CLIENT_LOCAL_IP")  or "127.0.0.1"
        public_ip= os.getenv("ANGEL_CLIENT_PUBLIC_IP") or "127.0.0.1"
        mac_addr = os.getenv("ANGEL_CLIENT_MAC")       or "00:00:00:00:00:00"

        return {
            "Authorization": self._auth_header_value(token),
            "Content-Type": "application/json",
            "Accept": "application/json",
            "User-Agent": "angel-mcp/1.0 (+python-requests)",
            "X-PrivateKey": self._api_key(),
            "X-UserType": "USER",
            "X-SourceID": "WEB",
            "X-ClientLocalIP":  local_ip,
            "X-ClientPublicIP": public_ip,
            "X-MACAddress":     mac_addr,
        }

    def _login(self) -> SmartConnect:
        api_key     = self._need("ANGEL_ONE_API_KEY")
        client_code = self._need("ANGEL_ONE_CLIENT_CODE")
        password    = self._need("ANGEL_ONE_PASSWORD")
        secret      = self._need("ANGEL_ONE_TOTP_SECRET")

        totp_now = pyotp.TOTP(secret).now()
        sc = SmartConnect(api_key=api_key)

        try:
            resp = sc.generateSession(client_code, password, totp_now)
        except Exception as e:
            self.log.error(f"SmartAPI generateSession crashed: {e}")
            raise RuntimeError(f"SmartAPI generateSession crashed: {e}") from e

        if not isinstance(resp, dict):
            self.log.error(f"Unexpected SmartAPI response type: {type(resp).__name__}: {resp!r}")
            raise RuntimeError(f"Unexpected SmartAPI response type: {type(resp).__name__}: {resp!r}")

        if not resp.get("status", False):
            msg  = resp.get("message") or resp.get("statusMessage") or "Unknown error"
            code = resp.get("errorcode") or resp.get("code") or "?"
            self.log.error(f"Login failed: {msg} (code={code})")
            raise RuntimeError(f"Login failed: {msg} (code={code})")

        data = resp.get("data") or {}
        raw_jwt = data.get("jwtToken") or data.get("jwt_token")
        jwt = raw_jwt.split(" ", 1)[1] if isinstance(raw_jwt, str) and raw_jwt.startswith("Bearer ") else raw_jwt
        access= data.get("refreshToken")
        feed  = data.get("feedToken")

        bearer = jwt or access
        if not bearer:
            self.log.error(f"Login response missing tokens: {resp!r}")
            raise RuntimeError(f"Login response missing tokens: {resp!r}")

        try:
            if access:
                sc.setAccessToken(access)
            elif jwt:
                sc.setAccessToken(jwt)
        except Exception:
            pass

        if feed:
            sc.setFeedToken(feed)

        self._client  = sc
        self._session = {
            "jwt": jwt,
            "access": access,
            "bearer": bearer,
            "feedToken": feed,
        }
        self.log.info("SmartAPI session established (jwt=%s, access=%s, feed=%s)", bool(jwt), bool(access), bool(feed))
        return sc

    def _ensure_auth(self, sc: SmartConnect) -> None:
        if self._session and self._session.get("bearer"):
            try: sc.setAccessToken(self._session["bearer"])
            except Exception: pass
        if self._session and self._session.get("feedToken"):
            try: sc.setFeedToken(self._session["feedToken"])
            except Exception: pass

    def _retry_if_invalid_token(self, func, *args, **kwargs):
        sc = self.get_client()
        self._ensure_auth(sc)
        resp = func(sc, *args, **kwargs)

        def _is_invalid(r):
            if isinstance(r, dict):
                msg = (r.get("message") or r.get("statusMessage") or "").lower()
                code = (r.get("errorCode") or r.get("errorcode") or r.get("code") or "").upper()
                return "invalid token" in msg or code in ("AG8001", "AG8002")
            return False

        if _is_invalid(resp):
            self.log.info("Token invalid; re-logging in and retrying once…")
            self.force_login()
            sc = self.get_client()
            self._ensure_auth(sc)
            resp = func(sc, *args, **kwargs)
        return resp

    def get_client(self) -> SmartConnect:
        with self._lock:
            return self._client if self._client is not None else self._login()

    def login_status(self) -> Dict[str, Any]:
        return {"logged_in": self._client is not None, "has_session": self._session is not None}

    def force_login(self) -> Dict[str, Any]:
        with self._lock:
            self._login()
            return {"ok": True, "feedToken": self._session.get("feedToken") if self._session else None}

    def logout(self) -> Dict[str, Any]:
        with self._lock:
            self._client = None
            self._session = None
            return {"ok": True}

    def search_scrip(self, exchange: str, query: str) -> List[Dict[str, Any]]:
        URL = "https://apiconnect.angelbroking.com/rest/secure/angelbroking/order/v1/searchScrip"
        ex = (exchange or "").upper()
        payload = {"exchange": ex, "searchscrip": query}

        def _post(tkn: str) -> Dict[str, Any]:
            hdrs = self._headers(tkn)
            masked = {**hdrs, "Authorization": "Bearer ***"}
            self.log.info("search_scrip POST %s %s headers=%s", ex, query, masked)
            r = requests.post(URL, headers=hdrs, json=payload, timeout=20)
            ctype = r.headers.get("content-type", "")
            if "application/json" not in ctype:
                snippet = (r.text or "")[:200].replace("\n", " ")
                self.log.error(f"search_scrip: non-JSON response (status={r.status_code}, ctype={ctype}, body~={snippet!r})")
                raise RuntimeError(f"search_scrip: non-JSON response (status={r.status_code}, ctype={ctype}, body~={snippet!r})")
            return r.json()

        token = self._bearer()
        resp = _post(token)
        
        def _ok(d: Dict[str, Any]) -> bool:
            ok = d.get("success")
            if ok is None: ok = d.get("status")
            return bool(ok)

        def _is_invalid(d: Dict[str, Any]) -> bool:
            msg  = (d.get("message") or d.get("statusMessage") or "").lower()
            code = (d.get("errorCode") or d.get("errorcode") or d.get("code") or "").upper()
            return "invalid token" in msg or code in ("AG8001", "AG8002")

        if not _ok(resp) and _is_invalid(resp):
            self.log.info("search_scrip: token invalid (AG8001/AG8002). Re-login and retry once.")
            self.force_login()
            token = self._bearer()
            resp = _post(token)
            print("[DEBUG] search_scrip response (after relogin):", resp)

        if not _ok(resp):
            msg  = resp.get("message") or resp.get("statusMessage") or "Unknown error"
            code = resp.get("errorCode") or resp.get("errorcode") or resp.get("code")
            self.log.error(f"search_scrip failed: {msg} (code={code})")
            raise RuntimeError(f"search_scrip failed: {msg} (code={code})")

        data = resp.get("data")
        if data in (None, ""): 
            return []
        if isinstance(data, list):
            return data
        self.log.error(f"search_scrip: unexpected response {resp!r}")
        raise RuntimeError(f"search_scrip: unexpected response {resp!r}")

    def ltp(self, exchange: str, tradingsymbol: str, token: str) -> Dict[str, Any]:
        # normalize inputs
        ex   = (exchange or "").upper().strip()
        tsym = (tradingsymbol or "").upper().strip()
        tok  = str(token).strip()

        def _do(sc): 
            return sc.ltpData(ex, tsym, tok)

        resp = self._retry_if_invalid_token(_do)

        if not isinstance(resp, dict):
            self.log.error(f"ltp: unexpected response {resp!r}")
            raise RuntimeError(f"ltp: unexpected response {resp!r}")

        if resp.get("status") is False or resp.get("success") is False:
            msg  = resp.get("message") or resp.get("statusMessage") or "Unknown error"
            code = resp.get("errorCode") or resp.get("errorcode") or resp.get("code")
            self.log.error(f"ltp failed: {msg} (code={code})")
            raise RuntimeError(f"ltp failed: {msg} (code={code})")

        return resp
    
    def candles(self, exchange: str, token: str, interval: str, from_dt: str, to_dt: str) -> Dict[str, Any]:
        params = {"exchange": exchange, "symboltoken": token, "interval": interval,
                  "fromdate": from_dt, "todate": to_dt}
        def _do(sc): return sc.getCandleData(params)
        resp = self._retry_if_invalid_token(_do)
        if not isinstance(resp, dict):
            self.log.error(f"candles: unexpected response {resp!r}")
            raise RuntimeError(f"candles: unexpected response {resp!r}")
        if resp.get("status") is False or resp.get("success") is False:
            msg  = resp.get("message") or resp.get("statusMessage") or "Unknown error"
            code = resp.get("errorCode") or resp.get("errorcode") or resp.get("code")
            raise RuntimeError(f"candles failed: {msg} (code={code})")
        return resp

    def place_order_live(self, params: Dict[str, Any]) -> Any:
        sc = self.get_client()
        return sc.placeOrder(params)
