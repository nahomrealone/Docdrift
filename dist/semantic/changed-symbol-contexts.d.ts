import type { ChangedLine } from "../diff";
import { type SymbolContext } from "./symbol-context";
export interface ChangedSymbolContext {
    before?: SymbolContext;
    after?: SymbolContext;
}
export declare function pairSymbolContexts(before: SymbolContext[], after: SymbolContext[]): ChangedSymbolContext[];
export declare function extractChangedSymbolContexts(filename: string, changedLines: ChangedLine[], codeBefore: string, codeAfter: string): ChangedSymbolContext[];
//# sourceMappingURL=changed-symbol-contexts.d.ts.map