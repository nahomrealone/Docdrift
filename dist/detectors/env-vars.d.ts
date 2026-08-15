import type { ChangedLine } from "../diff";
import type { DocumentationFinding } from "../types/finding";
interface ChangedCodeFile {
    filename: string;
    changedLines: ChangedLine[];
}
export declare function detectStaleEnvironmentVariables(changedCodeFiles: ChangedCodeFile[], currentCodeFiles: string[], documentationFiles: string[]): DocumentationFinding[];
export {};
//# sourceMappingURL=env-vars.d.ts.map