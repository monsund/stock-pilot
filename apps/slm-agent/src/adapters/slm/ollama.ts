
import OpenAI from 'openai';

export type ChatMessage = {
  role: 'system' | 'user' | 'assistant';
  content: string;
};

const USE_GROQ = !!process.env.GROQ_API_KEY;
const GROQ_MODEL =
  process.env.GROQ_MODEL_Llama ||
  'llama-3.1-8b-instant';

const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'llama3.1:8b';

/**
 * Chat with either Groq (OpenAI-compatible) or local Ollama,
 * returning the same shape: { content: string }.
 */
export async function chat(messages: ChatMessage[]): Promise<{ content: string }> {
  if (USE_GROQ) {
    const client = new OpenAI({
      apiKey: process.env.GROQ_API_KEY!,
      baseURL: 'https://api.groq.com/openai/v1',
    });

    const res = await client.chat.completions.create({
      model: GROQ_MODEL,
      messages,
      temperature: 0.3,
    });
    console.log('qaz----res--Groq', res);
    return { content: res.choices?.[0]?.message?.content ?? '' };
  }

  // Fallback: Ollama
  const { default: ollama } = await import('ollama');
  const res = await ollama.chat({
    model: OLLAMA_MODEL,
    messages,
    options: { temperature: 0.3 },
  });
  console.log('qaz----res--Ollama', res);
  return { content: res.message?.content ?? '' };
}
