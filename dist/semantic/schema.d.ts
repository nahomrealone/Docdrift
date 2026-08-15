import { z } from "zod";
export declare const SemanticDriftResultSchema: z.ZodObject<{
    stale: z.ZodBoolean;
    confidence: z.ZodNumber;
    reason: z.ZodString;
    staleText: z.ZodOptional<z.ZodString>;
    suggestedText: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export type SemanticDriftResult = z.infer<typeof SemanticDriftResultSchema>;
//# sourceMappingURL=schema.d.ts.map