import ts from "typescript";

export interface SymbolContext {
  name: string;
  kind: string;
  startLine: number;
  endLine: number;
  content: string;
}

function getScriptKind(filename: string): ts.ScriptKind {
  if (filename.endsWith(".tsx")) return ts.ScriptKind.TSX;
  if (filename.endsWith(".jsx")) return ts.ScriptKind.JSX;
  if (/\.(?:js|mjs|cjs)$/.test(filename)) return ts.ScriptKind.JS;
  return ts.ScriptKind.TS;
}

function describeDeclaration(
  node: ts.Node,
): { name: string; kind: string } | null {
  if (ts.isFunctionDeclaration(node) && node.name) {
    return { name: node.name.text, kind: "function" };
  }
  if (ts.isMethodDeclaration(node) && node.name) {
    return { name: node.name.getText(), kind: "method" };
  }
  if (ts.isClassDeclaration(node) && node.name) {
    return { name: node.name.text, kind: "class" };
  }
  if (ts.isInterfaceDeclaration(node)) {
    return { name: node.name.text, kind: "interface" };
  }
  if (ts.isTypeAliasDeclaration(node)) {
    return { name: node.name.text, kind: "type" };
  }
  if (ts.isEnumDeclaration(node)) {
    return { name: node.name.text, kind: "enum" };
  }
  if (
    ts.isVariableDeclaration(node) &&
    ts.isIdentifier(node.name) &&
    node.initializer &&
    (ts.isArrowFunction(node.initializer) ||
      ts.isFunctionExpression(node.initializer))
  ) {
    return { name: node.name.text, kind: "function" };
  }
  if (
    ts.isPropertyDeclaration(node) &&
    node.name &&
    node.initializer &&
    (ts.isArrowFunction(node.initializer) ||
      ts.isFunctionExpression(node.initializer))
  ) {
    return { name: node.name.getText(), kind: "method" };
  }
  return null;
}

export function findEnclosingSymbolContext(
  content: string,
  filename: string,
  lineNumber: number,
): SymbolContext | null {
  if (lineNumber < 1) return null;
  const sourceFile = ts.createSourceFile(
    filename,
    content,
    ts.ScriptTarget.Latest,
    true,
    getScriptKind(filename),
  );
  const lastLine =
    sourceFile.getLineAndCharacterOfPosition(sourceFile.getEnd()).line + 1;
  if (lineNumber > lastLine) return null;
  const position = sourceFile.getPositionOfLineAndCharacter(lineNumber - 1, 0);
  let bestName: string | null = null;
  let bestKind: string | null = null;
  let bestStart = 0;
  let bestEnd = 0;
  let bestSize = Number.POSITIVE_INFINITY;

  function visit(node: ts.Node) {
    if (position < node.getFullStart() || position > node.getEnd()) return;
    const description = describeDeclaration(node);
    const size = node.getEnd() - node.getStart(sourceFile);
    if (description && size < bestSize) {
      bestName = description.name;
      bestKind = description.kind;
      bestStart = node.getStart(sourceFile);
      bestEnd = node.getEnd();
      bestSize = size;
    }
    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
  if (!bestName || !bestKind) return null;
  return {
    name: bestName,
    kind: bestKind,
    startLine: sourceFile.getLineAndCharacterOfPosition(bestStart).line + 1,
    endLine: sourceFile.getLineAndCharacterOfPosition(bestEnd).line + 1,
    content: content.slice(bestStart, bestEnd),
  };
}
