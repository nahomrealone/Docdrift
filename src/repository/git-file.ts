import { execFileSync } from "node:child_process";

export function readFileAtRef(ref: string, filename: string): string | null {
  try {
    return execFileSync("git", ["show", `${ref}:${filename}`], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    });
  } catch {
    return null;
  }
}

export function listFilesAtRef(ref: string): string[] {
  try {
    const output = execFileSync(
      "git",
      ["ls-tree", "-r", "--name-only", ref],
      {
        encoding: "utf8",
        stdio: ["ignore", "pipe", "ignore"],
      },
    );

    return output.split(/\r?\n/).filter(Boolean);
  } catch {
    return [];
  }
}
