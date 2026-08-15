import type { GitHub } from "@actions/github/lib/utils";

import type { DocumentationFinding } from "../detectors/package-scripts";

const COMMENT_MARKER = "<!-- docdrift-report -->";

export async function publishDocDriftComment(
  octokit: InstanceType<typeof GitHub>,
  owner: string,
  repo: string,
  pullNumber: number,
  findings: DocumentationFinding[],
) {
  let body = `${COMMENT_MARKER}\n## 📚 DocDrift Report\n\n`;

  if (findings.length === 0) {
    body += "✅ No documentation drift detected.";
  } else {
    body += `⚠️ Found **${findings.length} documentation issue(s)**.\n\n`;

    for (const finding of findings) {
      body += `### ${finding.documentationFile}\n`;
      body += `- **Problem:** ${finding.message}\n`;
      body += `- **Stale reference:** \`${finding.reference}\`\n\n`;
    }
  }

  await octokit.rest.issues.createComment({
    owner,
    repo,
    issue_number: pullNumber,
    body,
  });
}
