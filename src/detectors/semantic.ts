import * as fs from "node:fs";

import type { ChangedLine } from "../diff";
import {
  parseMarkdownSections,
  type MarkdownSection,
} from "../documentation/sections";
import { findCandidateSections } from "../semantic/candidates";
import { extractChangedIdentifiers } from "../semantic/identifiers";

interface ChangedCodeFile {
  filename: string;
  changedLines: ChangedLine[];
}

export interface SemanticCandidate {
  filename: string;
  identifiers: string[];
  documentationFile: string;
  section: MarkdownSection;
}

export function discoverSemanticCandidates(
  enabled: boolean,
  changedCodeFiles: ChangedCodeFile[],
  documentationFiles: string[],
): SemanticCandidate[] {
  if (!enabled) {
    return [];
  }

  const candidates: SemanticCandidate[] = [];
  const documentationSections = new Map<string, MarkdownSection[]>();

  for (const documentationFile of documentationFiles) {
    if (!fs.existsSync(documentationFile)) {
      continue;
    }

    const markdown = fs.readFileSync(documentationFile, "utf8");
    documentationSections.set(
      documentationFile,
      parseMarkdownSections(markdown),
    );
  }

  for (const file of changedCodeFiles) {
    const identifiers = extractChangedIdentifiers(file.changedLines);

    if (identifiers.length === 0) {
      continue;
    }

    for (const [documentationFile, sections] of documentationSections) {
      const matchingSections = findCandidateSections(sections, identifiers);

      for (const section of matchingSections) {
        candidates.push({
          filename: file.filename,
          identifiers,
          documentationFile,
          section,
        });
      }
    }
  }

  return candidates;
}
