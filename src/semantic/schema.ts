import { z } from "zod";

export const SemanticDriftResultSchema = z.object({
  stale: z.boolean(),
  confidence: z.number().min(0).max(1),
  reason: z.string(),
  staleText: z.string().optional(),
  suggestedText: z.string().optional(),
});

export type SemanticDriftResult = z.infer<typeof SemanticDriftResultSchema>;
