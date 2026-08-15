import * as core from "@actions/core";
import * as github from "@actions/github";
import { classifyFile } from "./classify";
import { extractChangedLines } from "./diff";

async function run() {
  try {
    core.info("🚀 DocDrift is running inside GitHub!");

    const token = core.getInput("github-token", {
      required: true,
    });

    const octokit = github.getOctokit(token);

    const { owner, repo } = github.context.repo;

    const pullRequest = github.context.payload.pull_request;

    if (!pullRequest) {
      throw new Error("DocDrift must run on a pull request.");
    }

    const pullNumber = pullRequest.number;

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
  } catch (error) {
    if (error instanceof Error) {
      core.setFailed(error.message);
    }
  }
}

run();
