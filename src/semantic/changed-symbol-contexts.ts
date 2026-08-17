import type { ChangedLine } from "../diff";
import {
  findEnclosingSymbolContext,
  type SymbolContext,
} from "./symbol-context";

export interface ChangedSymbolContext {
  before?: SymbolContext;
  after?: SymbolContext;
}

function unique(contexts: SymbolContext[]): SymbolContext[] {
  const seen = new Set<string>();
  return contexts.filter((context) => {
    const key = `${context.name}:${context.startLine}:${context.endLine}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function pairSymbolContexts(
  before: SymbolContext[],
  after: SymbolContext[],
): ChangedSymbolContext[] {
  const beforeByName = new Map(before.map((context) => [context.name, context]));
  const afterByName = new Map(after.map((context) => [context.name, context]));
  const names = new Set([...beforeByName.keys(), ...afterByName.keys()]);
  return [...names].map((name) => {
    const beforeContext = beforeByName.get(name);
    const afterContext = afterByName.get(name);
    return {
      ...(beforeContext ? { before: beforeContext } : {}),
      ...(afterContext ? { after: afterContext } : {}),
    };
  });
}

export function extractChangedSymbolContexts(
  filename: string,
  changedLines: ChangedLine[],
  codeBefore: string,
  codeAfter: string,
): ChangedSymbolContext[] {
  const before: SymbolContext[] = [];
  const after: SymbolContext[] = [];
  for (const line of changedLines) {
    if (line.type === "removed" && line.oldLineNumber !== undefined) {
      const context = findEnclosingSymbolContext(
        codeBefore,
        filename,
        line.oldLineNumber,
      );
      if (context) before.push(context);
    }
    if (line.type === "added" && line.newLineNumber !== undefined) {
      const context = findEnclosingSymbolContext(
        codeAfter,
        filename,
        line.newLineNumber,
      );
      if (context) after.push(context);
    }
  }
  return pairSymbolContexts(unique(before), unique(after));
}
