export interface ChangedLine {
  type: "added" | "removed";
  content: string;
}

export function extractChangedLines(
  patch: string | undefined,
): ChangedLine[] {
  if (!patch) {
    return [];
  }

  const changedLines: ChangedLine[] = [];

  for (const line of patch.split("\n")) {
    if (line.startsWith("+++") || line.startsWith("---")) {
      continue;
    }

    if (line.startsWith("+")) {
      changedLines.push({
        type: "added",
        content: line.slice(1),
      });
    }

    if (line.startsWith("-")) {
      changedLines.push({
        type: "removed",
        content: line.slice(1),
      });
    }
  }

  return changedLines;
}
