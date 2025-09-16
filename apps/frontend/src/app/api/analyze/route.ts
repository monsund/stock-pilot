import axios from "axios";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const query = body?.query;
    if (!query || typeof query !== "string") {
      return new Response(JSON.stringify({ error: "Body must include { query: string }" }), { status: 400 });
    }

    const base = process.env.NEXT_PUBLIC_AGENT_BASE || "http://localhost:4000";
    const { data, status } = await axios.post(`${base}/analyze`, { query }, {
      headers: { "content-type": "application/json" },
      validateStatus: () => true
    });

    return new Response(JSON.stringify(data), {
      status,
      headers: { "content-type": "application/json" }
    });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : "Internal error";
    return new Response(JSON.stringify({ error: errorMessage }), { status: 500 });
  }
}
