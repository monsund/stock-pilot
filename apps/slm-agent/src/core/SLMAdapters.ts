import { SLMAdapter, ChatMessage } from "./types";
import { chat as ollamaChat } from "../adapters/slm/ollama.js"; // existing adapter

export const OllamaAdapter: SLMAdapter = {
  async chat(messages: ChatMessage[]) {
    return ollamaChat(messages);
  }
};
