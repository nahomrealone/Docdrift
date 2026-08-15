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
