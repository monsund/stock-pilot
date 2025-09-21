import { z } from "zod";
import { ActionSchema } from "../schemas/actions.js";
import { SLMAdapter, ChatMessage, AgentRunResult } from "../core/types.js";
import { createMessageBuffer } from "../core/MessageBuffer.js";
import { FenceParser } from "../core/FenceParser.js";
import { buildToolRegistry } from "../tools/registry.js";
import { SYSTEM_PROMPT, REACT_INSTRUCTIONS_AND_FEWSHOT } from "../prompts/index.js";
import { logger as baseLogger } from "../util/logger.js";

type AgentOpts = {
  slm: SLMAdapter;
  maxSteps?: number;
  postNewsNudge?: boolean;
  logger?: typeof baseLogger;
  systemPrompt?: string;
  reactInstructions?: string;
};
export class StockNewsAgent {
  private slm: SLMAdapter;
  private maxSteps: number;
  private postNewsNudge: boolean;
  private log: typeof baseLogger;
  private tools = buildToolRegistry();
  private systemPrompt: string;
  private reactInstructions: string;

  constructor(opts: AgentOpts) {
  this.slm = opts.slm;
    this.maxSteps = opts.maxSteps ?? 6;
    this.postNewsNudge = opts.postNewsNudge ?? true;
    this.log = (opts.logger as any) || baseLogger;
    this.systemPrompt = opts.systemPrompt ?? SYSTEM_PROMPT;
    this.reactInstructions = opts.reactInstructions ?? REACT_INSTRUCTIONS_AND_FEWSHOT;
  }

  private preview(messages: ChatMessage[]) {
    const truncate = (s: string, n = 280) => (s?.length > n ? s.slice(0, n) + "…" : s);
    return messages.map((m, i) => ({ i, role: m.role, len: m.content.length, head: truncate(m.content) }));
  }

  async run(query: string): Promise<AgentRunResult> {
    const runId = Math.random().toString(36).slice(2, 8) + "-" + Date.now().toString(36);
    const log = (this.log as any).child ? (this.log as any).child({ runId }) : this.log;

    const buf = createMessageBuffer([
      { role: "system", content: this.systemPrompt },
      { role: "user",   content: `Stock query: ${query}` },
      { role: "user",   content: this.reactInstructions },
    ]);

    log.info({ event: "run.start", query, messagesPreview: this.preview(buf.all()) }, "Agent run started");

    for (let step = 0; step < this.maxSteps; step++) {
      log.info({ event: "step.start", step }, "Agent step start");

      // Call SLM
      const t0 = Date.now();
      let content = "";
      try {
        ({ content } = await this.slm.chat(buf.all()));
      } catch (err) {
        log.error({ event: "slm.error", step, err }, "SLM call failed");
        return { final: "SLM call failed. Try again.", trace: buf.all() };
      }
      const latency = Date.now() - t0;
      log.info({ event: "slm.response", step, latency_ms: latency, contentLen: content?.length ?? 0 }, "SLM response");
      buf.pushAssistant(content);

      // Parse fences
      const finalText = FenceParser.extractFinal(content);
      const actionJson = FenceParser.extractActionJSON(content);

      log.info({
        event: "parse.blocks",
        step,
        hasFinal: !!finalText,
        hasAction: !!actionJson,
        actionFence: /```action/i.test(content) ? "action" : (actionJson ? "fallback-json" : "none"),
      }, "Parsed fences");

      if (finalText) {
        log.info({ event: "final.detected", step, preview: finalText.slice(0, 600) }, "Final detected");
        log.info({ event: "run.end", status: "success", steps: step + 1 }, "Run finished");
        return { final: finalText, trace: buf.all() };
      }

      if (!actionJson) {
        log.info({ event: "nudge.no_action", step }, "No action; nudging");
        buf.pushUser(
          "Reply with ONLY ONE fenced block (no extra text).\n" +
          "For tool calls use exactly:\n" +
          "```action\n{\"tool\":\"<symbol.resolve|news.search|time.now>\",\"args\":{}}\n```"
        );
        continue;
      }

      // Validate Action
      let parsed: z.infer<typeof ActionSchema>;
      try {
        parsed = ActionSchema.parse(JSON.parse(actionJson));
        log.info({ event: "parse.action_json.ok", step, tool: parsed.tool }, "Action parsed");
      } catch (e: any) {
        log.error({ event: "parse.action_json.error", step, error: e?.message }, "Invalid action JSON");
        buf.pushUser(
          "Invalid action JSON. Try again with a single ```action\n" +
          "{\"tool\":\"<symbol.resolve|news.search|time.now>\",\"args\":{}}\n```"
        );
        continue;
      }

      // Execute tool
      const tool = this.tools[parsed.tool];
      if (!tool) {
        log.error({ event: "tool.unknown", step, tool: parsed.tool }, "Unknown tool");
        buf.pushUser(`Unknown tool: ${parsed.tool}. Use one of symbol.resolve, news.search, time.now.`);
        continue;
      }

      log.info({ event: "tool.call", step, tool: parsed.tool }, "Calling tool");
      try {
        const tTool = Date.now();
        const observation = await tool.execute(parsed.args);
        const dtTool = Date.now() - tTool;

        const obs = JSON.stringify(observation);
        log.info({ event: "tool.success", step, tool: parsed.tool, latency_ms: dtTool, obsBytes: obs.length }, "Tool ok");

        buf.pushUser('```observation\n' + obs.slice(0, 15000) + '\n```');

        // Optional: request final right after news.search
        if (this.postNewsNudge && parsed.tool === "news.search") {
          buf.pushUser('Proceed to your conclusion now. Reply with a single ```final block (no extra text).');
          log.info({ event: "nudge.final_request", step }, "Requested final after news.search");
        }

      } catch (err: any) {
        log.error({ event: "tool.error", step, tool: parsed.tool, error: err?.message || "tool error" }, "Tool error");
        buf.pushUser('```observation\n{"error":"' + (err?.message || "tool error").replaceAll('"', '\\"') + '"}\n```');
      }

      log.info({ event: "step.complete", step }, "Step completed");
    }

    log.warn({ event: "run.end", status: "tool_limit", steps: this.maxSteps }, "Could not complete within tool-call limit");
  return { final: "Could not complete within tool-call limit.", trace: createMessageBuffer().all() };
  }
}
