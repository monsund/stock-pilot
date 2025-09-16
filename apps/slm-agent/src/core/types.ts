export type Role = "system" | "user" | "assistant";

export type ChatMessage = {
  role: Role;
  content: string;
};

export interface SLMAdapter {
  chat(messages: ChatMessage[]): Promise<{ content: string }>;
}

export type ActionCall = {
  tool: "symbol.resolve" | "news.search" | "time.now";
  args: Record<string, any>;
};

export type AgentRunResult = {
  final: string;
  trace: ChatMessage[];
};
