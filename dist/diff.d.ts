export interface ChangedLine {
    type: "added" | "removed";
    content: string;
    oldLineNumber?: number;
    newLineNumber?: number;
}
export declare function extractChangedLines(patch: string | undefined): ChangedLine[];
