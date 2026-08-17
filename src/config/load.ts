import * as fs from "node:fs";

import { parse } from "yaml";

import type { DocDriftConfig, DocDriftMode } from "../types/config";
import { DEFAULT_CONFIG } from "./defaults";

function isMode(value: unknown): value is DocDriftMode {
  return value === "report" || value === "enforce";
}

export function loadConfig(configPath: string): DocDriftConfig {
  if (!fs.existsSync(configPath)) {
    return DEFAULT_CONFIG;
  }

  return parseConfig(fs.readFileSync(configPath, "utf8"));
}

export function parseConfig(raw: string): DocDriftConfig {
  const parsed = parse(raw) ?? {};

  if (parsed.version !== undefined && parsed.version !== 1) {
    throw new Error(`Unsupported DocDrift config version: ${parsed.version}`);
  }

  if (parsed.mode !== undefined && !isMode(parsed.mode)) {
    throw new Error(`Invalid DocDrift mode: ${parsed.mode}`);
  }

  const confidence = parsed.semantic?.confidenceThreshold;
  const maxCalls = parsed.semantic?.maxCalls;

  if (
    confidence !== undefined &&
    (typeof confidence !== "number" || confidence < 0 || confidence > 1)
  ) {
    throw new Error(
      "semantic.confidenceThreshold must be between 0 and 1",
    );
  }

  if (
    maxCalls !== undefined &&
    (!Number.isInteger(maxCalls) || maxCalls < 1 || maxCalls > 50)
  ) {
    throw new Error(
      "semantic.maxCalls must be an integer between 1 and 50",
    );
  }

  if (
    parsed.semantic?.provider !== undefined &&
    parsed.semantic.provider !== "gemini"
  ) {
    throw new Error(
      `Unsupported semantic provider: ${parsed.semantic.provider}`,
    );
  }

  return {
    version: 1,
    mode: parsed.mode ?? DEFAULT_CONFIG.mode,
    detectors: {
      packageScripts:
        parsed.detectors?.packageScripts ??
        DEFAULT_CONFIG.detectors.packageScripts,
      envVars: parsed.detectors?.envVars ?? DEFAULT_CONFIG.detectors.envVars,
      apiRoutes:
        parsed.detectors?.apiRoutes ?? DEFAULT_CONFIG.detectors.apiRoutes,
      semantic:
        parsed.detectors?.semantic ?? DEFAULT_CONFIG.detectors.semantic,
    },
    paths: {
      documentation: {
        include:
          parsed.paths?.documentation?.include ??
          DEFAULT_CONFIG.paths.documentation.include,
        exclude:
          parsed.paths?.documentation?.exclude ??
          DEFAULT_CONFIG.paths.documentation.exclude,
      },
      ignore: parsed.paths?.ignore ?? DEFAULT_CONFIG.paths.ignore,
    },
    semantic: {
      confidenceThreshold:
        confidence ?? DEFAULT_CONFIG.semantic.confidenceThreshold,
      provider:
        parsed.semantic?.provider ?? DEFAULT_CONFIG.semantic.provider,
      model: parsed.semantic?.model ?? DEFAULT_CONFIG.semantic.model,
      maxCalls: maxCalls ?? DEFAULT_CONFIG.semantic.maxCalls,
    },
  };
}
