import ts from "typescript";

import type { ChangedLine } from "../diff";

function getScriptKind(filename: string): ts.ScriptKind {
  if (filename.endsWith(".tsx")) return ts.ScriptKind.TSX;
  if (filename.endsWith(".jsx")) return ts.ScriptKind.JSX;
  if (filename.endsWith(".js")) return ts.ScriptKind.JS;
  return ts.ScriptKind.TS;
}

function declarationName(node: ts.Node): string | null {
  if (
    ts.isFunctionDeclaration(node) ||
    ts.isClassDeclaration(node) ||
    ts.isInterfaceDeclaration(node) ||
    ts.isTypeAliasDeclaration(node) ||
    ts.isEnumDeclaration(node) ||
    ts.isMethodDeclaration(node)
  ) {
    const name = node.name;

    if (name && (ts.isIdentifier(name) || ts.isStringLiteral(name))) {
      return name.text;
    }
  }

  if (
    ts.isVariableDeclaration(node) &&
    ts.isIdentifier(node.name) &&
    node.initializer &&
    (ts.isArrowFunction(node.initializer) ||
      ts.isFunctionExpression(node.initializer))
  ) {
    return node.name.text;
  }

  return null;
}

export function findEnclosingSymbol(
  content: string,
  filename: string,
  lineNumber: number,
): string | null {
  const sourceFile = ts.createSourceFile(
    filename,
    content,
    ts.ScriptTarget.Latest,
    true,
    getScriptKind(filename),
  );
  const lastLine =
    sourceFile.getLineAndCharacterOfPosition(sourceFile.end).line + 1;

  if (lineNumber < 1 || lineNumber > lastLine) {
    return null;
  }

  const position = sourceFile.getPositionOfLineAndCharacter(lineNumber - 1, 0);
  let bestName: string | null = null;
  let bestSize = Number.POSITIVE_INFINITY;

  function visit(node: ts.Node) {
    if (position < node.getFullStart() || position > node.getEnd()) {
      return;
    }

    const name = declarationName(node);

    if (name) {
      const size = node.getEnd() - node.getFullStart();
      if (size < bestSize) {
        bestName = name;
        bestSize = size;
      }
    }

    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
  return bestName;
}

export function extractEnclosingSymbols(
  changedLines: ChangedLine[],
  filename: string,
  baseContent: string,
  headContent: string,
): string[] {
  const symbols = new Set<string>();

  for (const line of changedLines) {
    const symbol =
      line.type === "added" && line.newLineNumber !== undefined
        ? findEnclosingSymbol(headContent, filename, line.newLineNumber)
        : line.type === "removed" && line.oldLineNumber !== undefined
          ? findEnclosingSymbol(baseContent, filename, line.oldLineNumber)
          : null;

    if (symbol) {
      symbols.add(symbol);
    }
  }

  return [...symbols];
}

export function splitIdentifier(identifier: string): string {
  return identifier
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .toLowerCase();
}
