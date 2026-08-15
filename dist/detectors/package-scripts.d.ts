import type { ChangedLine } from "../diff";
export interface DocumentationFinding {
    type: "stale-package-script";
    documentationFile: string;
    scriptName: string;
    reference: string;
    message: string;
}
export declare function detectStalePackageScripts(changedLines: ChangedLine[], documentationFiles: string[]): DocumentationFinding[];
//# sourceMappingURL=package-scripts.d.ts.map