import axios from "axios";
const base = process.env.NEXT_PUBLIC_AGENT_BASE || "http://localhost:4000";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const exchange = searchParams.get("exchange");
  const symbol = searchParams.get("symbol");
  if (!exchange || !symbol) {
    return new Response(JSON.stringify({ error: "exchange & symbol required" }), { status: 400 });
  }
  const { data, status } = await axios.get(`${base}/market/ltp`, {
    params: { exchange, symbol }, validateStatus: () => true
  });
  return new Response(JSON.stringify(data), { status, headers: { "content-type": "application/json" } });
}
