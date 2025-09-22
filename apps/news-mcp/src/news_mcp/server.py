from fastmcp import FastMCP
from pydantic import BaseModel, HttpUrl, Field, ValidationError
from typing import List, Optional
import feedparser
from dateutil import parser as dtparse
from urllib.parse import urlparse, parse_qs, unquote, quote_plus
from datetime import datetime, timedelta, timezone
import time, argparse, traceback

# ---- explicit HTTP app (stable) ----
from fastapi import FastAPI, Body, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

mcp = FastMCP(name="news-mcp")
http_app = FastAPI(title="news-mcp-http")
http_app.add_middleware(
    CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"]
)

# ---------- Contracts ----------
class NewsSearchInput(BaseModel):
    query: str = Field(min_length=1)
    lookback: str = "14d"
    locale: str = "en-IN"

class Article(BaseModel):
    id: str
    title: str
    url: HttpUrl
    source: Optional[str] = None
    publishedAt: str  # ISO UTC

# ---------- Helpers ----------
def _ceid(locale: str) -> str:
    lc = (locale or "").lower()
    if lc.startswith("en-in"): return "IN:en"
    if lc.startswith("en-us"): return "US:en"
    return "IN:en"

def _canonical_url(link: str) -> str:
    try:
        o = urlparse(link); q = parse_qs(o.query)
        if "url" in q and q["url"]:
            return unquote(q["url"][0])
    except Exception:
        pass
    return link

_CACHE: dict[str, tuple[float, List[Article]]] = {}
_TTL = 10 * 60  # seconds

def _cache_get(key: str) -> Optional[List[Article]]:
    t, v = _CACHE.get(key, (0.0, None))
    return v if v and (time.time() - t) < _TTL else None

def _cache_set(key: str, val: List[Article]) -> None:
    _CACHE[key] = (time.time(), val)

# ---------- Tool logic (shared) ----------
@mcp.tool(name="news.search")
def news_search(payload: NewsSearchInput) -> List[Article]:
    days = int(payload.lookback.rstrip("d")) if payload.lookback.endswith("d") else 14
    since = datetime.now(timezone.utc) - timedelta(days=days)

    cache_key = f"{payload.query}|{days}|{payload.locale}"
    hit = _cache_get(cache_key)
    if hit is not None:
        return hit

    ceid = _ceid(payload.locale)
    gl, hl = ceid.split(":")
    q = quote_plus(payload.query.strip())
    rss = f"https://news.google.com/rss/search?q={q}&hl={hl}&gl={gl}&ceid={ceid}"

    feed = feedparser.parse(rss)

    # Log and continue on parse issues instead of raising
    if getattr(feed, "bozo", False):
        print(f"[news-mcp] bozo_exception: {getattr(feed, 'bozo_exception', None)}", flush=True)

    seen = set()
    out: List[Article] = []

    for idx, it in enumerate(feed.entries or []):
        try:
            title = (it.get("title") or "").strip()
            link_raw = (it.get("link") or "").strip()
            if not title or not link_raw:
                continue

            link = _canonical_url(link_raw)
            # Ensure absolute http(s) URL; skip everything else
            if not (link.startswith("http://") or link.startswith("https://")):
                continue

            pub_raw = it.get("published") or it.get("updated") or ""
            try:
                published = dtparse.parse(pub_raw)
                if not published.tzinfo:
                    published = published.replace(tzinfo=timezone.utc)
                published = published.astimezone(timezone.utc)
            except Exception:
                # If we cannot parse a date, skip the item (keeps API stable)
                continue

            if published < since:
                continue

            source = None
            src = getattr(it, "source", None)
            if src is not None and getattr(src, "title", None):
                source = src.title

            key_item = f"{title}::{link}"
            if key_item in seen:
                continue
            seen.add(key_item)

            # Build the pydantic model inside try: if it fails, just skip this item
            art = Article(
                id=key_item.encode("utf-8").hex()[:24],
                title=title,
                url=link,
                source=source,
                publishedAt=published.isoformat()
            )
            out.append(art)

        except ValidationError as ve:
            print(f"[news-mcp] skip invalid article: {ve}", flush=True)
            continue
        except Exception as e:
            print(f"[news-mcp] item error: {e}\n{traceback.format_exc()}", flush=True)
            continue

    out = out[:12]
    _cache_set(cache_key, out)
    return out

# ---------- HTTP routes (with strong shape) ----------
@http_app.get("/health")
def health():
    return {"ok": True, "ts": datetime.now(timezone.utc).isoformat()}

@http_app.post("/tools/news.search", response_model=List[Article])
@http_app.post("/tools/news.search/", response_model=List[Article])
async def http_news_search(payload: NewsSearchInput = Body(...)):
    import json
    try:
        print(f"[news-mcp] news.search called with payload: {payload}", flush=True)
        tool_result = await news_search.run({"payload": payload.model_dump()})
        # Extract JSON string from first TextContent object
        if not tool_result.content or len(tool_result.content) == 0:
            return {"articles": []}
        articles_json = tool_result.content[0].text
        articles = json.loads(articles_json)
        print(f"[news-mcp] news.search returning articles {articles}", flush=True)
        print(f"[news-mcp] news.search returning length: {len(articles)} articles", flush=True)
        return articles
    except Exception as e:
        print(f"[news-mcp] fatal error: {e}\n{traceback.format_exc()}", flush=True)
        raise HTTPException(status_code=500, detail=f"news.search failed: {e}")

# ---------- Entrypoint ----------
def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--host", default="0.0.0.0")
    parser.add_argument("--port", type=int, default=5101)
    args = parser.parse_args()
    uvicorn.run(http_app, host=args.host, port=args.port, log_level="info")

if __name__ == "__main__":
    main()
