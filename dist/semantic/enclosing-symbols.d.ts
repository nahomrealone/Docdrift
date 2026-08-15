import type { ChangedLine } from "../diff";
export declare function findEnclosingSymbol(content: string, filename: string, lineNumber: number): string | null;
export declare function extractEnclosingSymbols(changedLines: ChangedLine[], filename: string, baseContent: string, headContent: string): string[];
export declare function splitIdentifier(identifier: string): string;
//# sourceMappingURL=enclosing-symbols.d.ts.map