export type FileCategory = "code" | "documentation" | "ignored";

const ignoredDirectories = [
  "dist/",
  "node_modules/",
  ".next/",
  "build/",
  "coverage/",
];

const ignoredFiles = [
  "package-lock.json",
  "yarn.lock",
  "pnpm-lock.yaml",
  "bun.lock",
  "bun.lockb",
];

const codeExtensions = [
  ".ts",
  ".tsx",
  ".js",
  ".jsx",
  ".mjs",
  ".cjs",
  ".json",
  ".yml",
  ".yaml",
  ".py",
  ".java",
  ".go",
  ".rs",
  ".cs",
  ".c",
  ".cpp",
  ".h",
];

export function classifyFile(filename: string): FileCategory {
  const normalized = filename.toLowerCase();

  if (
    ignoredDirectories.some((directory) => normalized.startsWith(directory))
  ) {
    return "ignored";
  }

  if (ignoredFiles.some((ignoredFile) => normalized === ignoredFile)) {
    return "ignored";
  }

  if (normalized.endsWith(".md") || normalized.endsWith(".mdx")) {
    return "documentation";
  }

  if (codeExtensions.some((extension) => normalized.endsWith(extension))) {
    return "code";
  }

  return "ignored";
}
