import type { GitHub } from "@actions/github/lib/utils";

import type { DocumentationFinding } from "../types/finding";
import { buildGitHubFileLineUrl } from "./file-link";

const COMMENT_MARKER = "<!-- docdrift-report -->";

interface ReportContext {
  serverUrl: string;
  headSha: string;
}

function buildReport(
  findings: DocumentationFinding[],
  owner: string,
  repo: string,
  context: ReportContext,
): string {
  let body = `${COMMENT_MARKER}\n## 📚 DocDrift Report\n\n`;

  if (findings.length === 0) {
    body += "✅ No documentation drift detected.";
    return body;
  }

  body += `⚠️ Found **${findings.length} documentation issue(s)**.\n\n`;

  for (const finding of findings) {
    body += `### ${finding.documentationFile}\n`;
    body += `- **Problem:** ${finding.message}\n`;
    body += `- **Stale reference:** \`${finding.reference}\`\n`;

    if (finding.locations && finding.locations.length > 0) {
      for (const location of finding.locations) {
        const lineUrl = buildGitHubFileLineUrl({
          serverUrl: context.serverUrl,
          owner,
          repo,
          sha: context.headSha,
          filename: finding.documentationFile,
          line: location.line,
        });

        body +=
          `- **Location:** ` +
          `[${finding.documentationFile}:${location.line}](${lineUrl})\n`;

        if (location.section.length > 0) {
          body += `- **Section:** ${location.section.join(" → ")}\n`;
        }
      }
    }

    if (finding.suggestion) {
      body += `- **Possible replacement:** \`${finding.suggestion}\`\n`;
    }

    if (finding.confidence !== undefined) {
      body += `- **Confidence:** ${Math.round(finding.confidence * 100)}%\n`;
    }

    body += "\n";
  }

  return body;
}

export async function publishDocDriftComment(
  octokit: InstanceType<typeof GitHub>,
  owner: string,
  repo: string,
  pullNumber: number,
  findings: DocumentationFinding[],
  context: ReportContext,
) {
  const body = buildReport(findings, owner, repo, context);

  const comments = await octokit.paginate(octokit.rest.issues.listComments, {
    owner,
    repo,
    issue_number: pullNumber,
    per_page: 100,
  });

  const existingComment = comments.find(
    (comment) =>
      typeof comment.body === "string" &&
      comment.body.includes(COMMENT_MARKER),
  );

  if (existingComment) {
    await octokit.rest.issues.updateComment({
      owner,
      repo,
      comment_id: existingComment.id,
      body,
    });

    return;
  }

  await octokit.rest.issues.createComment({
    owner,
    repo,
    issue_number: pullNumber,
    body,
  });
}
