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
export interface SemanticAnalysisStats {
    candidateSections: number;
    uniqueCandidates: number;
    calls: number;
    findings: number;
    errors: number;
}
export interface SemanticAnalysisResult {
    findings: DocumentationFinding[];
    stats: SemanticAnalysisStats;
}
export declare function truncate(value: string, limit: number): string;
export declare function discoverSemanticCandidates(enabled: boolean, changedCodeFiles: ChangedCodeFile[], documentationFiles: string[], baseSha: string, headSha: string): SemanticCandidate[];
export declare function analyzeSemanticCandidates(candidates: SemanticCandidate[], provider: SemanticProvider, confidenceThreshold: number, baseSha: string, headSha: string, maxCalls: number, timeoutMilliseconds?: number): Promise<SemanticAnalysisResult>;
export {};
//# sourceMappingURL=semantic.d.ts.map