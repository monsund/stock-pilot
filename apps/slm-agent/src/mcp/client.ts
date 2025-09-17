export async function callTool<TIn, TOut>(base: string, name: string, args: TIn): Promise<TOut> {
  const r = await fetch(new URL(`/tools/${name}`, base), {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(args ?? {})
  });
  const text = await r.text();
  let data: any;
  try { data = JSON.parse(text); } catch { data = text; }
  if (!r.ok) throw new Error((data && data.detail) || (data && data.error) || `Tool ${name} failed (${r.status})`);
  return data as TOut;
}
