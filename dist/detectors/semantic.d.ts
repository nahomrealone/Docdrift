import type { ChangedLine } from "../diff";
import { type MarkdownSection } from "../documentation/sections";
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
export declare function discoverSemanticCandidates(enabled: boolean, changedCodeFiles: ChangedCodeFile[], documentationFiles: string[]): SemanticCandidate[];
export {};
//# sourceMappingURL=semantic.d.ts.map