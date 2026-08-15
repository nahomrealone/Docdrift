import * as fs from "node:fs";

import type { ChangedLine } from "../diff";
import type { DocumentationFinding } from "../types/finding";

interface ChangedCodeFile {
  filename: string;
  changedLines: ChangedLine[];
}

const ENV_PATTERNS = [
  /process\.env\.([A-Z][A-Z0-9_]*)/g,
  /process\.env\[\s*["']([A-Z][A-Z0-9_]*)["']\s*\]/g,
  /import\.meta\.env\.([A-Z][A-Z0-9_]*)/g,
];

function extractEnvironmentVariables(content: string): string[] {
  const variables = new Set<string>();

  for (const pattern of ENV_PATTERNS) {
    for (const match of content.matchAll(pattern)) {
      const variableName = match[1];

      if (variableName) {
        variables.add(variableName);
      }
    }
  }

  return [...variables];
}

function repositoryStillUsesVariable(
  variableName: string,
  codeFiles: string[],
): boolean {
  for (const file of codeFiles) {
    if (!fs.existsSync(file)) {
      continue;
    }

    const content = fs.readFileSync(file, "utf8");
    const variables = extractEnvironmentVariables(content);

    if (variables.includes(variableName)) {
      return true;
    }
  }

  return false;
}

function documentationReferencesVariable(
  documentation: string,
  variableName: string,
): boolean {
  const escaped = variableName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const pattern = new RegExp(`\\b${escaped}\\b`);

  return pattern.test(documentation);
}

export function detectStaleEnvironmentVariables(
  changedCodeFiles: ChangedCodeFile[],
  currentCodeFiles: string[],
  documentationFiles: string[],
): DocumentationFinding[] {
  const findings: DocumentationFinding[] = [];
  const removedVariables = new Set<string>();

  for (const file of changedCodeFiles) {
    for (const line of file.changedLines) {
      if (line.type !== "removed") {
        continue;
      }

      const variables = extractEnvironmentVariables(line.content);

      for (const variable of variables) {
        removedVariables.add(variable);
      }
    }
  }

  for (const variableName of removedVariables) {
    if (repositoryStillUsesVariable(variableName, currentCodeFiles)) {
      continue;
    }

    for (const documentationFile of documentationFiles) {
      if (!fs.existsSync(documentationFile)) {
        continue;
      }

      const documentation = fs.readFileSync(documentationFile, "utf8");

      if (!documentationReferencesVariable(documentation, variableName)) {
        continue;
      }

      findings.push({
        type: "stale-env-var",
        documentationFile,
        reference: variableName,
        message:
          `${documentationFile} references "${variableName}", ` +
          "but the current code no longer references that environment variable.",
      });
    }
  }

  return findings;
}
