

import axios from "axios";

const AGENT_BASE = process.env.NEXT_PUBLIC_AGENT_BASE || "http://localhost:4000";

function jsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json" }
  });
}

function errorResponse(message: string, status = 400) {
  return jsonResponse({ error: message }, status);
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const query = body?.query;
    if (!query || typeof query !== "string") {
      return errorResponse("Body must include { query: string }", 400);
    }

    const { data, status } = await axios.post(`${AGENT_BASE}/analyze`, { query }, {
      headers: { "content-type": "application/json" },
      validateStatus: () => true
    });

    return jsonResponse(data, status);
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : "Internal error";
    return errorResponse(errorMessage, 500);
  }
}
