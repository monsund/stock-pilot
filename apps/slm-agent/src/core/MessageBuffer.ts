import { ChatMessage } from "./types";

export function createMessageBuffer(initial: ChatMessage[] = []) {
  const msgs: ChatMessage[] = [...initial];
  return {
    push: (m: ChatMessage) => msgs.push(m),
    all: () => msgs,
    pushSystem: (content: string) => msgs.push({ role: "system", content }),
    pushUser: (content: string) => msgs.push({ role: "user", content }),
    pushAssistant: (content: string) => msgs.push({ role: "assistant", content })
  };
}
