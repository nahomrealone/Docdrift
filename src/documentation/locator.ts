import type { DocumentationLocation } from "../types/documentation";

interface Heading {
  level: number;
  text: string;
}

function parseHeading(line: string): Heading | null {
  const match = line.match(/^(#{1,6})\s+(.+?)\s*$/);
  const marker = match?.[1];
  const text = match?.[2];

  if (!marker || !text) {
    return null;
  }

  return {
    level: marker.length,
    text: text.replace(/\s+#+\s*$/, ""),
  };
}

export function locateReference(
  documentation: string,
  reference: string,
): DocumentationLocation[] {
  const lines = documentation.split(/\r?\n/);
  const locations: DocumentationLocation[] = [];
  const headingStack: Array<string | undefined> = [];

  for (let index = 0; index < lines.length; index++) {
    const line = lines[index];

    if (line === undefined) {
      continue;
    }

    const heading = parseHeading(line);

    if (heading) {
      headingStack[heading.level - 1] = heading.text;
      headingStack.length = heading.level;
      continue;
    }

    if (!line.includes(reference)) {
      continue;
    }

    locations.push({
      line: index + 1,
      section: headingStack.filter(
        (heading): heading is string => Boolean(heading),
      ),
    });
  }

  return locations;
}
