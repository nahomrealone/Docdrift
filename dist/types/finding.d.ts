import type { DocumentationLocation } from "./documentation";
export type FindingType = "stale-package-script" | "stale-env-var" | "stale-api-route" | "semantic-drift";
export interface DocumentationFinding {
    type: FindingType;
    documentationFile: string;
    reference: string;
    message: string;
    suggestion?: string;
    confidence?: number;
    locations?: DocumentationLocation[];
}
//# sourceMappingURL=finding.d.ts.map