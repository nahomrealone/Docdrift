import type { SemanticDriftResult } from "./schema";

export interface SemanticAnalysisInput {
  filename: string;
  codeBefore: string;
  codeAfter: string;
  documentationFile: string;
  documentationSection: string;
  sectionHeading?: string;
}

export interface SemanticProvider {
  analyze(input: SemanticAnalysisInput): Promise<SemanticDriftResult>;
}
