import type { GitHub } from "@actions/github/lib/utils";
import type { DocumentationFinding } from "../types/finding";
interface ReportContext {
    serverUrl: string;
    headSha: string;
}
export declare function publishDocDriftComment(octokit: InstanceType<typeof GitHub>, owner: string, repo: string, pullNumber: number, findings: DocumentationFinding[], context: ReportContext): Promise<void>;
export {};
//# sourceMappingURL=comment.d.ts.map