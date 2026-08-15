export interface MarkdownSection {
  heading: string;
  level: number;
  startLine: number;
  endLine: number;
  content: string;
}

export function parseMarkdownSections(markdown: string): MarkdownSection[] {
  const lines = markdown.split(/\r?\n/);
  const sections: MarkdownSection[] = [];
  let current: MarkdownSection | null = null;

  for (let index = 0; index < lines.length; index++) {
    const line = lines[index];

    if (line === undefined) {
      continue;
    }

    const heading = line.match(/^(#{1,6})\s+(.+?)\s*$/);
    const marker = heading?.[1];
    const text = heading?.[2];

    if (!marker || !text) {
      continue;
    }

    if (current) {
      current.endLine = index;
      current.content = lines
        .slice(current.startLine - 1, current.endLine)
        .join("\n");
      sections.push(current);
    }

    current = {
      heading: text.replace(/\s+#+\s*$/, ""),
      level: marker.length,
      startLine: index + 1,
      endLine: lines.length,
      content: "",
    };
  }

  if (current) {
    current.content = lines.slice(current.startLine - 1).join("\n");
    sections.push(current);
  }

  return sections;
}
