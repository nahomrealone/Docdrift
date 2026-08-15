import type { GitHub } from "@actions/github/lib/utils";
import type { DocumentationFinding } from "../detectors/package-scripts";
export declare function publishDocDriftComment(octokit: InstanceType<typeof GitHub>, owner: string, repo: string, pullNumber: number, findings: DocumentationFinding[]): Promise<void>;
//# sourceMappingURL=comment.d.ts.map