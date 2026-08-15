export interface MarkdownSection {
    heading: string;
    level: number;
    startLine: number;
    endLine: number;
    content: string;
}
export declare function parseMarkdownSections(markdown: string): MarkdownSection[];
//# sourceMappingURL=sections.d.ts.map