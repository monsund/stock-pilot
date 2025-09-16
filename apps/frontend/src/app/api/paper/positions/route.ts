import axios from "axios";

const base = process.env.NEXT_PUBLIC_AGENT_BASE || "http://localhost:4000";

export async function GET() {
  try {
    const { data, status } = await axios.get(`${base}/paper/positions`, {
      validateStatus: () => true,
    });
    return new Response(JSON.stringify(data), {
      status,
      headers: { "content-type": "application/json" },
    });
  } catch (e: unknown) {
    const errorMessage = e instanceof Error ? e.message : "Internal error";
    return new Response(JSON.stringify({ error: errorMessage }), { status: 500 });
  }
}
