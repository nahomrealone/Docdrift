import { minimatch } from "minimatch";

import type { PathConfig } from "../types/config";

function normalizePath(filename: string): string {
  return filename.replace(/\\/g, "/");
}

function matchesAny(filename: string, patterns: string[]): boolean {
  const normalized = normalizePath(filename);

  return patterns.some((pattern) =>
    minimatch(normalized, pattern, {
      dot: true,
    }),
  );
}

export function isIgnoredPath(filename: string, paths: PathConfig): boolean {
  return matchesAny(filename, paths.ignore);
}

export function isDocumentationPath(
  filename: string,
  paths: PathConfig,
): boolean {
  if (isIgnoredPath(filename, paths)) {
    return false;
  }

  const included = matchesAny(filename, paths.documentation.include);

  if (!included) {
    return false;
  }

  const excluded = matchesAny(filename, paths.documentation.exclude);

  return !excluded;
}
