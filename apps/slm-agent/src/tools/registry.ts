import { Tool } from "./Tool.js";
import { SymbolResolveTool } from "./SymbolResolveTool.js";
import { TimeNowTool } from "./TimeNowTool.js";
import { callTool } from "../mcp/client.js";

class MCPNewsSearchTool implements Tool<any, any> {
  name = "news.search";
  normalizeArgs(args: any): any {
    // Implement argument normalization logic if needed, or just return args
    return args;
  }

  async execute(args: any) {
    const base = process.env.NEWS_MCP_BASE || "http://localhost:5101";
    return await callTool(base, "news.search", args);
  }
}

// Wrap your existing functions with Tool classes
export function buildToolRegistry() {
  const tools: Record<string, Tool> = {};
  tools["symbol.resolve"] = new SymbolResolveTool();
  tools["news.search"] = new MCPNewsSearchTool(); // Now handled by Google News MCP
  tools["time.now"] = new TimeNowTool();
  return tools;
}
