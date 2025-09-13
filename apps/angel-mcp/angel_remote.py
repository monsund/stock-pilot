# angel_remote.py
import os, asyncio, shlex
import nest_asyncio
from typing import Any, Dict, List, Optional
from mcp import ClientSession, StdioServerParameters
from mcp.client.stdio import stdio_client

# Preferred: run the 3P server as a module from its src folder via bash -c
ANGEL_REMOTE_CMD = os.getenv("ANGEL_REMOTE_CMD")        # e.g. /bin/bash
ANGEL_REMOTE_ARGS = os.getenv("ANGEL_REMOTE_ARGS", "")  # e.g. -c cd "/path/src" && "/path/uv" run python -m angel_one_mcp.server

# Fallback: uv + path/to/server.py (only if module launch not used)
UV = os.getenv("ANGEL_REMOTE_UV", "/Users/monsoon/.local/bin/uv")
REMOTE_FILE = os.getenv("ANGEL_REMOTE_SERVER")  # absolute path to server.py (optional if using CMD/ARGS)
EXTRA = os.getenv("ANGEL_REMOTE_EXTRA", "")
TIMEOUT = float(os.getenv("ANGEL_REMOTE_TIMEOUT", "60"))

def _params() -> StdioServerParameters:
    if ANGEL_REMOTE_CMD:
        return StdioServerParameters(command=ANGEL_REMOTE_CMD, args=shlex.split(ANGEL_REMOTE_ARGS))
    if not REMOTE_FILE:
        raise RuntimeError("Set ANGEL_REMOTE_CMD/ANGEL_REMOTE_ARGS, or ANGEL_REMOTE_SERVER")
    args = ["run", "python", REMOTE_FILE]
    if EXTRA.strip():
        args.extend(shlex.split(EXTRA))
    return StdioServerParameters(command=UV, args=args)

async def _with_session(coro):
    try:
        async with stdio_client(_params()) as (read, write):
            async with ClientSession(read, write) as session:
                await asyncio.wait_for(session.initialize(), timeout=TIMEOUT)
                return await asyncio.wait_for(coro(session), timeout=TIMEOUT)
    except Exception as e:
        import traceback
        print("[angel_remote] Exception in _with_session:", e)
        traceback.print_exc()
        raise

def list_tools() -> List[str]:
    async def run(sess: ClientSession):
        try:
            return await sess.list_tools()
        except Exception as e:
            import traceback
            print("[angel_remote] Exception in list_tools:", e)
            traceback.print_exc()
            raise
    try:
        loop = asyncio.get_running_loop()
        nest_asyncio.apply()
        res = loop.run_until_complete(_with_session(run))
    except RuntimeError:
        res = asyncio.run(_with_session(run))
    return [t.name for t in res.tools]

def call(tool: str, args: Dict[str, Any]):
    async def run(sess: ClientSession):
        try:
            return await sess.call_tool(tool, args)
        except Exception as e:
            import traceback
            print(f"[angel_remote] Exception in call({tool}):", e)
            traceback.print_exc()
            raise
    try:
        loop = asyncio.get_running_loop()
        nest_asyncio.apply()
        res = loop.run_until_complete(_with_session(run))
    except RuntimeError:
        res = asyncio.run(_with_session(run))
    out: List[Any] = []
    for item in getattr(res, "content", []) or []:
        t = getattr(item, "type", None)
        if t == "text": out.append(item.text)
        elif hasattr(item, "data"): out.append(item.data)
        else: out.append(str(item))
    return {"tool": tool, "result": out}

def find_tool_like(*subs: str) -> Optional[str]:
    names = list_tools()
    for name in names:
        low = name.lower()
        if all(s.lower() in low for s in subs):
            return name
    return None
