import { callTool } from "../mcp/client.js";

async function test() {
  const result = await callTool('http://localhost:6277', 'ping', {});
}

test();