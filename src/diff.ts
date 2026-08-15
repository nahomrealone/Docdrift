export interface ChangedLine {
  type: "added" | "removed";
  content: string;
  oldLineNumber?: number;
  newLineNumber?: number;
}

export function extractChangedLines(
  patch: string | undefined,
): ChangedLine[] {
  if (!patch) {
    return [];
  }

  const changedLines: ChangedLine[] = [];
  let oldLine = 0;
  let newLine = 0;

  for (const line of patch.split("\n")) {
    const hunk = line.match(/^@@ -(\d+)(?:,\d+)? \+(\d+)(?:,\d+)? @@/);

    if (hunk) {
      oldLine = Number(hunk[1]);
      newLine = Number(hunk[2]);
      continue;
    }

    if (
      line.startsWith("+++") ||
      line.startsWith("---") ||
      line.startsWith("\\ No newline")
    ) {
      continue;
    }

    if (line.startsWith("+")) {
      changedLines.push({
        type: "added",
        content: line.slice(1),
        newLineNumber: newLine,
      });
      newLine++;
      continue;
    }

    if (line.startsWith("-")) {
      changedLines.push({
        type: "removed",
        content: line.slice(1),
        oldLineNumber: oldLine,
      });
      oldLine++;
      continue;
    }

    oldLine++;
    newLine++;
  }

  return changedLines;
}
