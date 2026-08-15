import * as fs from "node:fs";

import type { ChangedLine } from "../diff";

export interface DocumentationFinding {
  type: "stale-package-script";
  documentationFile: string;
  scriptName: string;
  reference: string;
  message: string;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function extractRemovedScriptNames(changedLines: ChangedLine[]): string[] {
  const removedScripts: string[] = [];

  for (const line of changedLines) {
    if (line.type !== "removed") {
      continue;
    }

    const match = line.content.match(
      /^\s*"([^"]+)"\s*:\s*"[^"]*"\s*,?\s*$/,
    );

    if (!match) {
      continue;
    }

    const scriptName = match[1];

    if (!scriptName) {
      continue;
    }

    removedScripts.push(scriptName);
  }

  return removedScripts;
}

export function detectStalePackageScripts(
  changedLines: ChangedLine[],
  documentationFiles: string[],
): DocumentationFinding[] {
  const findings: DocumentationFinding[] = [];

  if (!fs.existsSync("package.json")) {
    return findings;
  }

  const packageJson = JSON.parse(fs.readFileSync("package.json", "utf8"));

  const currentScripts: Record<string, string> = packageJson.scripts ?? {};

  const removedScripts = extractRemovedScriptNames(changedLines);

  for (const scriptName of removedScripts) {
    if (scriptName in currentScripts) {
      continue;
    }

    const reference = `npm run ${scriptName}`;

    for (const documentationFile of documentationFiles) {
      if (!fs.existsSync(documentationFile)) {
        continue;
      }

      const documentation = fs.readFileSync(documentationFile, "utf8");

      const referencePattern = new RegExp(
        `(^|[^A-Za-z0-9:_-])${escapeRegExp(reference)}(?![A-Za-z0-9:_-])`,
        "m",
      );

      if (!referencePattern.test(documentation)) {
        continue;
      }

      findings.push({
        type: "stale-package-script",
        documentationFile,
        scriptName,
        reference,
        message:
          `${documentationFile} references "${reference}", ` +
          `but package.json no longer defines the "${scriptName}" script.`,
      });
    }
  }

  return findings;
}
