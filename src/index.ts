import * as core from "@actions/core";
import * as github from "@actions/github";
import { classifyFile } from "./classify";
import { loadConfig } from "./config/load";
import { detectStaleApiRoutes } from "./detectors/api-routes";
import { detectStaleEnvironmentVariables } from "./detectors/env-vars";
import { detectStalePackageScripts } from "./detectors/package-scripts";
import { extractChangedLines } from "./diff";
import { publishDocDriftComment } from "./github/comment";
import { listTrackedFiles } from "./repository/tracked-files";

async function run() {
  try {
    core.info("🚀 DocDrift is running inside GitHub!");

    const token = core.getInput("github-token", {
      required: true,
    });

    const configPath = core.getInput("config-path") || ".docdrift.yml";
    const config = loadConfig(configPath);

    core.info(`DocDrift mode: ${config.mode}`);

    const octokit = github.getOctokit(token);

    const { owner, repo } = github.context.repo;

    const pullRequest = github.context.payload.pull_request;

    if (!pullRequest) {
      throw new Error("DocDrift must run on a pull request.");
    }

    const pullNumber = pullRequest.number;
    const baseSha = pullRequest.base.sha;
    const headSha = pullRequest.head.sha;
    const serverUrl = github.context.serverUrl;

    core.info(`Repository: ${owner}/${repo}`);
    core.info(`Pull Request: #${pullNumber}`);

    const files = await octokit.paginate(octokit.rest.pulls.listFiles, {
      owner,
      repo,
      pull_number: pullNumber,
      per_page: 100,
    });

    core.info(`Changed files: ${files.length}`);

    const codeFiles = files.filter(
      (file) => classifyFile(file.filename) === "code",
    );

    const documentationFiles = files.filter(
      (file) => classifyFile(file.filename) === "documentation",
    );

    const ignoredFiles = files.filter(
      (file) => classifyFile(file.filename) === "ignored",
    );

    const currentCodeFiles = listTrackedFiles("code");
    const trackedDocumentationFiles = listTrackedFiles("documentation");

    const changedCodeForAnalysis = codeFiles.map((file) => ({
      filename: file.filename,
      changedLines: extractChangedLines(file.patch),
    }));

    core.info("");
    core.info("📊 DocDrift Classification");
    core.info(`Code files: ${codeFiles.length}`);
    core.info(`Documentation files: ${documentationFiles.length}`);
    core.info(`Ignored files: ${ignoredFiles.length}`);

    for (const file of files) {
      const category = classifyFile(file.filename);

      core.info("");
      core.info(`📄 ${file.filename} [${category.toUpperCase()}]`);

      if (category === "ignored") {
        core.info("Skipped.");
        continue;
      }

      const changedLines = extractChangedLines(file.patch);

      if (changedLines.length === 0) {
        core.info("No readable text changes.");
        continue;
      }

      for (const line of changedLines) {
        if (line.type === "added") {
          core.info(`+ ${line.content}`);
        }

        if (line.type === "removed") {
          core.info(`- ${line.content}`);
        }
      }
    }

    const packageJsonFile = files.find(
      (file) => file.filename === "package.json",
    );

    const findings = [];

    if (config.detectors.packageScripts && packageJsonFile) {
      const packageChanges = extractChangedLines(packageJsonFile.patch);

      const packageScriptFindings = detectStalePackageScripts(
        packageChanges,
        trackedDocumentationFiles,
      );

      findings.push(...packageScriptFindings);
    }

    if (config.detectors.envVars) {
      const environmentFindings = detectStaleEnvironmentVariables(
        changedCodeForAnalysis,
        currentCodeFiles,
        trackedDocumentationFiles,
      );

      findings.push(...environmentFindings);
    }

    if (config.detectors.apiRoutes) {
      const apiRouteFindings = detectStaleApiRoutes(
        codeFiles,
        baseSha,
        headSha,
        trackedDocumentationFiles,
      );

      findings.push(...apiRouteFindings);
    }

    core.info("");
    core.info("🔎 Documentation Drift Analysis");

    if (findings.length === 0) {
      core.info("✅ No documentation drift detected.");
    } else {
      core.warning(`${findings.length} documentation issue(s) detected.`);

      for (const finding of findings) {
        core.warning("");
        core.warning(`⚠️ ${finding.documentationFile}`);
        core.warning(finding.message);
      }
    }

    await publishDocDriftComment(octokit, owner, repo, pullNumber, findings, {
      serverUrl,
      headSha,
    });

    if (config.mode === "enforce" && findings.length > 0) {
      core.setFailed(
        `DocDrift detected ${findings.length} stale documentation issue(s).`,
      );
    }
  } catch (error) {
    if (error instanceof Error) {
      core.setFailed(error.message);
    }
  }
}

run();
