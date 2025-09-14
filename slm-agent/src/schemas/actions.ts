import { z } from "zod";

export const ActionSchema = z.object({
  tool: z.enum(["symbol.resolve", "news.search", "time.now"]),
  args: z.record(z.any()).default({})
});

export type ActionPayload = z.infer<typeof ActionSchema>;
