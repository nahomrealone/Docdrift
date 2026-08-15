import type { PathConfig } from "../types/config";
import type { DocumentationFinding } from "../types/finding";
interface ChangedFile {
    filename: string;
}
export declare function detectStaleApiRoutes(changedFiles: ChangedFile[], baseSha: string, headSha: string, documentationFiles: string[], paths: PathConfig): DocumentationFinding[];
export {};
//# sourceMappingURL=api-routes.d.ts.map