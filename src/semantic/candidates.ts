import type { MarkdownSection } from "../documentation/sections";

export function findCandidateSections(
  sections: MarkdownSection[],
  identifiers: string[],
): MarkdownSection[] {
  return sections.filter((section) => {
    const haystack = `${section.heading}\n${section.content}`.toLowerCase();

    return identifiers.some((identifier) =>
      haystack.includes(identifier.toLowerCase()),
    );
  });
}
