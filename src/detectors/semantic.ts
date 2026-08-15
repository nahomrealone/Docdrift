import * as fs from "node:fs";

import type { ChangedLine } from "../diff";
import {
  parseMarkdownSections,
  type MarkdownSection,
} from "../documentation/sections";
import { readFileAtRef } from "../repository/git-file";
import { findCandidateSections } from "../semantic/candidates";
import { extractChangedIdentifiers } from "../semantic/identifiers";
import type { SemanticProvider } from "../semantic/provider";
import type { DocumentationFinding } from "../types/finding";

const MAX_CODE_CHARS = 12_000;
const MAX_DOC_CHARS = 8_000;

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

export function truncate(value: string, limit: number): string {
  if (value.length <= limit) {
    return value;
  }

  return `${value.slice(0, limit)}\n...[truncated]`;
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

export async function analyzeSemanticCandidates(
  candidates: SemanticCandidate[],
  provider: SemanticProvider,
  confidenceThreshold: number,
  baseSha: string,
  headSha: string,
): Promise<DocumentationFinding[]> {
  const findings: DocumentationFinding[] = [];
  const sourceCache = new Map<
    string,
    { codeBefore: string; codeAfter: string }
  >();

  for (const candidate of candidates) {
    let source = sourceCache.get(candidate.filename);

    if (!source) {
      source = {
        codeBefore: truncate(
          readFileAtRef(baseSha, candidate.filename) ?? "",
          MAX_CODE_CHARS,
        ),
        codeAfter: truncate(
          readFileAtRef(headSha, candidate.filename) ?? "",
          MAX_CODE_CHARS,
        ),
      };
      sourceCache.set(candidate.filename, source);
    }

    const result = await provider.analyze({
      filename: candidate.filename,
      codeBefore: source.codeBefore,
      codeAfter: source.codeAfter,
      documentationFile: candidate.documentationFile,
      documentationSection: truncate(candidate.section.content, MAX_DOC_CHARS),
      sectionHeading: candidate.section.heading,
    });

    if (!result.stale || result.confidence < confidenceThreshold) {
      continue;
    }

    findings.push({
      type: "semantic-drift",
      documentationFile: candidate.documentationFile,
      reference: result.staleText ?? candidate.section.heading,
      message: result.reason,
      confidence: result.confidence,
      locations: [
        {
          line: candidate.section.startLine,
          section: [candidate.section.heading],
        },
      ],
      ...(result.suggestedText
        ? {
            suggestion: result.suggestedText,
          }
        : {}),
    });
  }

  return findings;
}
