import { execFileSync } from "node:child_process";

import { classifyFile, type FileCategory } from "../classify";

export function listTrackedFiles(category?: FileCategory): string[] {
  const output = execFileSync("git", ["ls-files"], {
    encoding: "utf8",
  });

  const files = output.split(/\r?\n/).filter(Boolean);

  if (!category) {
    return files;
  }

  return files.filter((file) => classifyFile(file) === category);
}
