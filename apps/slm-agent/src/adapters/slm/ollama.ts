import ollama from 'ollama';

const MODEL = {
  LLAMA3_8B: 'llama3.1:8b',
}

export async function chat(messages: {role:'system'|'user'|'assistant', content: string}[]) {
  const res = await ollama.chat({
    model: MODEL.LLAMA3_8B,
    messages,
    options: { temperature: 0.3 }
  });
  return { content: res.message.content };
}
