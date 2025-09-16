export class FenceParser {
  // tolerant, CRLF-safe, case-insensitive
  static extractActionJSON(txt: string): string | null {
    const preferred = txt.match(/```action[^\n]*\r?\n([\s\S]*?)```/i);
    if (preferred) return preferred[1].trim();

    const blocks = [...txt.matchAll(/```(?:\w+)?[^\n]*\r?\n([\s\S]*?)```/gi)];
    for (const b of blocks) {
      const candidate = (b[1] || "").trim();
      try {
        const obj = JSON.parse(candidate);
        if (obj && typeof obj === "object" && "tool" in obj) return candidate;
      } catch { /* ignore */ }
    }
    return null;
  }

  static extractFinal(txt: string): string | null {
    const closed = txt.match(/```final[^\n]*\r?\n([\s\S]*?)```/i);
    if (closed) return closed[1].trim();
    const startOnly = txt.match(/```final[^\n]*\r?\n([\s\S]*)$/i);
    if (startOnly) return startOnly[1].trim();
    return null;
  }
}
