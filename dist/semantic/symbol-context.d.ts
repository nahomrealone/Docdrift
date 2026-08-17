export interface SymbolContext {
    name: string;
    kind: string;
    startLine: number;
    endLine: number;
    content: string;
}
export declare function findEnclosingSymbolContext(content: string, filename: string, lineNumber: number): SymbolContext | null;
//# sourceMappingURL=symbol-context.d.ts.map