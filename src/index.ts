import * as core from "@actions/core";
import * as github from "@actions/github";
import { classifyFile } from "./classify";
import { DEFAULT_CONFIG } from "./config/defaults";
import { parseConfig } from "./config/load";
import { detectStaleApiRoutes } from "./detectors/api-routes";
import { detectStaleEnvironmentVariables } from "./detectors/env-vars";
import { detectStalePackageScripts } from "./detectors/package-scripts";
import {
  analyzeSemanticCandidates,
  discoverSemanticCandidates,
} from "./detectors/semantic";
import { extractChangedLines } from "./diff";
import { publishDocDriftComment } from "./github/comment";
import { isDocumentationPath, isIgnoredPath } from "./paths/matcher";
import { listFilesAtRef, readFileAtRef } from "./repository/git-file";
import { createSemanticProvider } from "./semantic/provider-factory";
import type { DocumentationFinding } from "./types/finding";

function findingFingerprint(finding: DocumentationFinding): string {
  const line = finding.locations?.[0]?.line ?? 0;

  return [finding.documentationFile, line, finding.reference].join(":");
}

async function run() {
  try {
    core.info("🚀 DocDrift is running inside GitHub!");

    const token = core.getInput("github-token", {
      required: true,
    });

    const configPath = core.getInput("config-path") || ".docdrift.yml";
    const geminiApiKey = core.getInput("gemini-api-key");

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

    const configContent = readFileAtRef(baseSha, configPath);
    const config = configContent ? parseConfig(configContent) : DEFAULT_CONFIG;
    const semanticProvider = createSemanticProvider({
      config,
      ...(geminiApiKey ? { geminiApiKey } : {}),
    });

    core.info(`DocDrift mode: ${config.mode}`);

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

    const analyzableCodeFiles = codeFiles.filter(
      (file) => !isIgnoredPath(file.filename, config.paths),
    );

    const headFiles = listFilesAtRef(headSha);

    const currentCodeFiles = headFiles.filter(
      (filename) =>
        classifyFile(filename) === "code" &&
        !isIgnoredPath(filename, config.paths),
    );

    const trackedDocumentationFiles = headFiles.filter(
      (filename) =>
        classifyFile(filename) === "documentation" &&
        isDocumentationPath(filename, config.paths),
    );

    const changedCodeForAnalysis = analyzableCodeFiles.map((file) => ({
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
      const configIgnored = isIgnoredPath(file.filename, config.paths);
      const displayedCategory = configIgnored ? "ignored" : category;

      core.info("");
      core.info(`📄 ${file.filename} [${displayedCategory.toUpperCase()}]`);

      if (category === "ignored" || configIgnored) {
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

    const deterministicFindings: DocumentationFinding[] = [];

    if (config.detectors.packageScripts && packageJsonFile) {
      const packageChanges = extractChangedLines(packageJsonFile.patch);

      const packageScriptFindings = detectStalePackageScripts(
        packageChanges,
        trackedDocumentationFiles,
      );

      deterministicFindings.push(...packageScriptFindings);
    }

    if (config.detectors.envVars) {
      const environmentFindings = detectStaleEnvironmentVariables(
        changedCodeForAnalysis,
        currentCodeFiles,
        trackedDocumentationFiles,
      );

      deterministicFindings.push(...environmentFindings);
    }

    if (config.detectors.apiRoutes) {
      const apiRouteFindings = detectStaleApiRoutes(
        analyzableCodeFiles,
        baseSha,
        headSha,
        trackedDocumentationFiles,
        config.paths,
      );

      deterministicFindings.push(...apiRouteFindings);
    }

    const semanticFindings: DocumentationFinding[] = [];

    if (config.detectors.semantic && !semanticProvider) {
      core.warning(
        "Semantic drift detection is enabled, but no Gemini API key is " +
          "available. Skipping semantic analysis.",
      );
    }

    if (config.detectors.semantic && semanticProvider) {
      const semanticCandidates = discoverSemanticCandidates(
        true,
        changedCodeForAnalysis,
        trackedDocumentationFiles,
        baseSha,
        headSha,
      );

      core.info("");
      core.info("🧠 Semantic candidates");

      if (semanticCandidates.length === 0) {
        core.info("No relevant documentation sections found.");
      }

      for (const candidate of semanticCandidates) {
        core.info("");
        core.info(`Changed: ${candidate.filename}`);
        core.info(`Identifiers: ${candidate.identifiers.join(", ")}`);
        core.info(
          `Matched: ${candidate.documentationFile} → ${candidate.section.heading} ` +
            `(lines ${candidate.section.startLine}-${candidate.section.endLine})`,
        );
      }

      const analyzedFindings = await analyzeSemanticCandidates(
        semanticCandidates,
        semanticProvider,
        config.semantic.confidenceThreshold,
        baseSha,
        headSha,
      );

      const existingFingerprints = new Set(
        deterministicFindings.map(findingFingerprint),
      );

      for (const finding of analyzedFindings) {
        const fingerprint = findingFingerprint(finding);

        if (existingFingerprints.has(fingerprint)) {
          continue;
        }

        semanticFindings.push(finding);
        existingFingerprints.add(fingerprint);
      }
    }

    const allFindings = [...deterministicFindings, ...semanticFindings];

    core.info("");
    core.info("🔎 Documentation Drift Analysis");

    if (allFindings.length === 0) {
      core.info("✅ No documentation drift detected.");
    } else {
      core.warning(`${allFindings.length} documentation issue(s) detected.`);

      for (const finding of allFindings) {
        core.warning("");
        core.warning(`⚠️ ${finding.documentationFile}`);
        core.warning(finding.message);
      }
    }

    await publishDocDriftComment(
      octokit,
      owner,
      repo,
      pullNumber,
      allFindings,
      {
        serverUrl,
        headSha,
      },
    );

    if (config.mode === "enforce" && deterministicFindings.length > 0) {
      core.setFailed(
        `DocDrift detected ${deterministicFindings.length} deterministic ` +
          "stale documentation issue(s).",
      );
    }
  } catch (error) {
    if (error instanceof Error) {
      core.setFailed(error.message);
    }
  }
}

run();
