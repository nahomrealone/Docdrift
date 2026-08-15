import type { ChangedLine } from "../diff";
import { type MarkdownSection } from "../documentation/sections";
import type { SemanticProvider } from "../semantic/provider";
import type { DocumentationFinding } from "../types/finding";
interface ChangedCodeFile {
    filename: string;
    changedLines: ChangedLine[];
}
export interface SemanticCandidate {
    filename: string;
    identifiers: string[];
    documentationFile: string;
    section: MarkdownSection;
}
export declare function truncate(value: string, limit: number): string;
export declare function discoverSemanticCandidates(enabled: boolean, changedCodeFiles: ChangedCodeFile[], documentationFiles: string[], headSha: string): SemanticCandidate[];
export declare function analyzeSemanticCandidates(candidates: SemanticCandidate[], provider: SemanticProvider, confidenceThreshold: number, baseSha: string, headSha: string): Promise<DocumentationFinding[]>;
export {};
//# sourceMappingURL=semantic.d.ts.map