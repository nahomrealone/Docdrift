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

  const raw = fs.readFileSync(configPath, "utf8");
  const parsed = parse(raw) ?? {};

  if (parsed.version !== undefined && parsed.version !== 1) {
    throw new Error(`Unsupported DocDrift config version: ${parsed.version}`);
  }

  if (parsed.mode !== undefined && !isMode(parsed.mode)) {
    throw new Error(`Invalid DocDrift mode: ${parsed.mode}`);
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
    },
  };
}
