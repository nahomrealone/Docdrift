import * as core from "@actions/core";
import * as github from "@actions/github";

async function run() {
  try {
    core.info("🚀 DocDrift is running inside GitHub!");

    core.info(`Event: ${github.context.eventName}`);
    core.info(`Repository: ${github.context.repo.owner}/${github.context.repo.repo}`);
  } catch (error) {
    if (error instanceof Error) {
      core.setFailed(error.message);
    }
  }
}

run();
