export type FindingType =
  | "stale-package-script"
  | "stale-env-var"
  | "stale-api-route";

export interface DocumentationFinding {
  type: FindingType;
  documentationFile: string;
  reference: string;
  message: string;
  suggestion?: string;
  confidence?: number;
}
