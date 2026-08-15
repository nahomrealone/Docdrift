export type FindingType = "stale-package-script" | "stale-env-var";
export interface DocumentationFinding {
    type: FindingType;
    documentationFile: string;
    reference: string;
    message: string;
}
//# sourceMappingURL=finding.d.ts.map