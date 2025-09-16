import { Tool } from "./Tool.js";
import { SymbolResolveTool } from "./SymbolResolveTool.js";
import { NewsSearchTool } from "./NewsSearchTool.js";
import { TimeNowTool } from "./TimeNowTool.js";

// Wrap your existing functions with Tool classes
export function buildToolRegistry() {
  const tools: Record<string, Tool> = {};
  tools["symbol.resolve"] = new SymbolResolveTool();
  tools["news.search"] = new NewsSearchTool();
  tools["time.now"] = new TimeNowTool();
  return tools;
}
