import type { ChangedLine } from "../diff";

const IDENTIFIER_PATTERN = /\b[A-Za-z_$][A-Za-z0-9_$]*\b/g;

const IGNORED_IDENTIFIERS = new Set([
  "const",
  "let",
  "var",
  "function",
  "return",
  "async",
  "await",
  "export",
  "import",
  "from",
  "if",
  "else",
  "true",
  "false",
  "null",
  "undefined",
  "string",
  "number",
  "boolean",
]);

export function extractChangedIdentifiers(lines: ChangedLine[]): string[] {
  const identifiers = new Set<string>();

  for (const line of lines) {
    const matches = line.content.match(IDENTIFIER_PATTERN);

    if (!matches) {
      continue;
    }

    for (const identifier of matches) {
      if (identifier.length < 3 || IGNORED_IDENTIFIERS.has(identifier)) {
        continue;
      }

      identifiers.add(identifier);
    }
  }

  return [...identifiers];
}
