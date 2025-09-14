import ollama from 'ollama';
import dotenv from 'dotenv';

dotenv.config();
// Allow overriding host if needed
if ((ollama as any).host == null && process.env.OLLAMA_HOST) {
  (ollama as any).host = process.env.OLLAMA_HOST;
}

export async function chat(messages: {role:'system'|'user'|'assistant', content: string}[]) {
  const res = await ollama.chat({
    model: process.env.MODEL || 'llama3.1:8b',
    messages,
    options: { temperature: 0.3 }
  });
  return { content: res.message.content };
}
