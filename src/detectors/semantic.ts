import type { ChangedLine } from "../diff";
import {
  parseMarkdownSections,
  type MarkdownSection,
} from "../documentation/sections";
import { readFileAtRef } from "../repository/git-file";
import { findCandidateSections } from "../semantic/candidates";
import { extractChangedSymbolContexts } from "../semantic/changed-symbol-contexts";
import {
  extractEnclosingSymbols,
  splitIdentifier,
} from "../semantic/enclosing-symbols";
import { extractChangedIdentifiers } from "../semantic/identifiers";
import type { SemanticProvider } from "../semantic/provider";
import { withTimeout } from "../semantic/timeout";
import type { DocumentationFinding } from "../types/finding";

const MAX_FALLBACK_CODE_CHARS = 6_000;
const MAX_SYMBOL_CHARS = 12_000;
const MAX_DOCUMENTATION_CHARS = 6_000;
const DEFAULT_TIMEOUT_MILLISECONDS = 30_000;

interface ChangedCodeFile {
  filename: string;
  changedLines: ChangedLine[];
}

export interface SemanticCandidate {
  filename: string;
  symbol?: string;
  codeBefore?: string;
  codeAfter?: string;
  identifiers: string[];
  documentationFile: string;
  section: MarkdownSection;
}

export interface SemanticAnalysisStats {
  candidateSections: number;
  uniqueCandidates: number;
  affectedSymbols: number;
  calls: number;
  findings: number;
  errors: number;
}

export interface SemanticAnalysisResult {
  findings: DocumentationFinding[];
  stats: SemanticAnalysisStats;
}

function candidateFingerprint(candidate: SemanticCandidate): string {
  return [
    candidate.filename,
    candidate.symbol ?? "file",
    candidate.documentationFile,
    candidate.section.startLine,
  ].join(":");
}

function safeSemanticErrorMessage(error: unknown): string {
  if (
    error instanceof Error &&
    error.message.startsWith("Semantic analysis timed out after ")
  ) {
    return error.message;
  }

  return "Provider request failed or returned an invalid response.";
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
  baseSha: string,
  headSha: string,
): SemanticCandidate[] {
  if (!enabled) {
    return [];
  }

  const candidates: SemanticCandidate[] = [];
  const documentationSections = new Map<string, MarkdownSection[]>();

  for (const documentationFile of documentationFiles) {
    const markdown = readFileAtRef(headSha, documentationFile);

    if (markdown === null) {
      continue;
    }

    documentationSections.set(
      documentationFile,
      parseMarkdownSections(markdown),
    );
  }

  for (const file of changedCodeFiles) {
    const codeBefore = readFileAtRef(baseSha, file.filename) ?? "";
    const codeAfter = readFileAtRef(headSha, file.filename) ?? "";
    const rawIdentifiers = extractChangedIdentifiers(file.changedLines);
    const enclosingSymbols = extractEnclosingSymbols(
      file.changedLines,
      file.filename,
      codeBefore,
      codeAfter,
    );
    const symbolContexts = extractChangedSymbolContexts(
      file.filename,
      file.changedLines,
      codeBefore,
      codeAfter,
    );
    const contexts = symbolContexts.length > 0 ? symbolContexts : [null];

    for (const symbolContext of contexts) {
      const symbolNames = symbolContext
        ? [symbolContext.before?.name, symbolContext.after?.name].filter(
            (name): name is string => Boolean(name),
          )
        : enclosingSymbols;
      const identifiers = [
        ...new Set(
          [...rawIdentifiers, ...symbolNames].flatMap((identifier) => [
            identifier,
            splitIdentifier(identifier),
          ]),
        ),
      ];

      if (identifiers.length === 0) {
        continue;
      }

      for (const [documentationFile, sections] of documentationSections) {
        const matchingSections = findCandidateSections(sections, identifiers);

        for (const section of matchingSections) {
          candidates.push({
            filename: file.filename,
            ...(symbolNames[0] ? { symbol: symbolNames[0] } : {}),
            ...(symbolContext?.before
              ? { codeBefore: symbolContext.before.content }
              : {}),
            ...(symbolContext?.after
              ? { codeAfter: symbolContext.after.content }
              : {}),
            identifiers,
            documentationFile,
            section,
          });
        }
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
  maxCalls: number,
  timeoutMilliseconds = DEFAULT_TIMEOUT_MILLISECONDS,
): Promise<SemanticAnalysisResult> {
  const findings: DocumentationFinding[] = [];
  const seen = new Set<string>();
  const uniqueCandidates = candidates.filter((candidate) => {
    const fingerprint = candidateFingerprint(candidate);

    if (seen.has(fingerprint)) {
      return false;
    }

    seen.add(fingerprint);
    return true;
  });
  const stats: SemanticAnalysisStats = {
    candidateSections: candidates.length,
    uniqueCandidates: uniqueCandidates.length,
    affectedSymbols: new Set(
      uniqueCandidates.flatMap((candidate) =>
        candidate.symbol ? [candidate.symbol] : [],
      ),
    ).size,
    calls: 0,
    findings: 0,
    errors: 0,
  };
  const sourceCache = new Map<
    string,
    { codeBefore: string; codeAfter: string }
  >();

  for (const candidate of uniqueCandidates) {
    if (stats.calls >= maxCalls) {
      core.warning(
        `Semantic analysis reached the configured limit of ${maxCalls} AI calls.`,
      );
      break;
    }

    let source = sourceCache.get(candidate.filename);

    if (!source) {
      const rawCodeBefore = readFileAtRef(baseSha, candidate.filename) ?? "";
      const rawCodeAfter = readFileAtRef(headSha, candidate.filename) ?? "";

      if (
        rawCodeBefore.length > MAX_FALLBACK_CODE_CHARS ||
        rawCodeAfter.length > MAX_FALLBACK_CODE_CHARS
      ) {
        core.debug(`Semantic input truncated for ${candidate.filename}`);
      }

      source = {
        codeBefore: truncate(rawCodeBefore, MAX_FALLBACK_CODE_CHARS),
        codeAfter: truncate(rawCodeAfter, MAX_FALLBACK_CODE_CHARS),
      };
      sourceCache.set(candidate.filename, source);
    }

    if (candidate.section.content.length > MAX_DOCUMENTATION_CHARS) {
      core.debug(
        `Semantic input truncated for ${candidate.documentationFile}`,
      );
    }

    stats.calls++;

    try {
      const result = await withTimeout(
        provider.analyze({
          filename: candidate.filename,
          codeBefore: truncate(
            candidate.codeBefore ?? source.codeBefore,
            MAX_SYMBOL_CHARS,
          ),
          codeAfter: truncate(
            candidate.codeAfter ?? source.codeAfter,
            MAX_SYMBOL_CHARS,
          ),
          documentationFile: candidate.documentationFile,
          documentationSection: truncate(
            candidate.section.content,
            MAX_DOCUMENTATION_CHARS,
          ),
          sectionHeading: candidate.section.heading,
        }),
        timeoutMilliseconds,
      );

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
    } catch (error) {
      stats.errors++;
      core.warning(
        `Semantic analysis skipped for ${candidate.documentationFile}: ` +
          safeSemanticErrorMessage(error),
      );
    }
  }

  stats.findings = findings.length;
  return { findings, stats };
}
import * as core from "@actions/core";
