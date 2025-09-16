import { Tool } from "./Tool";

export class TimeNowTool implements Tool<Record<string, never>, any> {
  name = "time.now" as const;
  normalizeArgs(_: {}) { return {}; }
  async execute(_: {}) {
    return { now: new Date().toISOString() };
  }
}
