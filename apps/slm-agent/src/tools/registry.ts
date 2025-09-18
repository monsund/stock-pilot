
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

// MCP proxy tool generator
function makeMCPTool(toolName: string, baseEnvVar: string = "ANGEL_MCP_BASE", defaultBase: string = "http://localhost:6277") {
  return class implements Tool<any, any> {
    name = toolName;
    normalizeArgs(args: any) { return args; }
    async execute(args: any) {
      const base = process.env[baseEnvVar] || defaultBase;
      return await callTool(base, toolName, args);
    }
  };
}

// Wrap your existing functions with Tool classes
export function buildToolRegistry() {
  const tools: Record<string, Tool> = {};
  tools["symbol.resolve"] = new SymbolResolveTool();
  tools["news.search"] = new MCPNewsSearchTool(); // Google News MCP
  tools["time.now"] = new TimeNowTool();

  // Angel MCP tools
  tools["angel.login_status"] = new (makeMCPTool("angel_login_status"))();
  tools["angel.login"] = new (makeMCPTool("angel_login"))();
  tools["angel.logout"] = new (makeMCPTool("angel_logout"))();
  tools["angel.search_scrip"] = new (makeMCPTool("angel_search_scrip"))();
  tools["angel.ltp"] = new (makeMCPTool("angel_ltp"))();
  tools["angel.candles"] = new (makeMCPTool("angel_candles"))();
  tools["angel.mode"] = new (makeMCPTool("angel_mode"))();
  tools["angel.set_mode"] = new (makeMCPTool("angel_set_mode"))();
  tools["angel.place_order"] = new (makeMCPTool("place_order"))();
  tools["angel.list_orders"] = new (makeMCPTool("list_orders"))();
  tools["angel.list_positions"] = new (makeMCPTool("list_positions"))();
  return tools;
}
