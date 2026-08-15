export interface ChangedLine {
    type: "added" | "removed";
    content: string;
}
export declare function extractChangedLines(patch: string | undefined): ChangedLine[];
