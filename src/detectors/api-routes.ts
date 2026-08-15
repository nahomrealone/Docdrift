import * as fs from "node:fs";

import { getRouteKey, parseExpressRoutes } from "../parsers/express-routes";
import { readFileAtRef } from "../repository/git-file";
import type { DocumentationFinding } from "../types/finding";
import type { RouteDefinition } from "../types/route";

interface ChangedFile {
  filename: string;
}

const ROUTE_SOURCE_EXTENSIONS = [
  ".ts",
  ".tsx",
  ".js",
  ".jsx",
  ".mjs",
  ".cjs",
];

function isRouteSourceFile(filename: string): boolean {
  const normalized = filename.toLowerCase();

  return ROUTE_SOURCE_EXTENSIONS.some((extension) =>
    normalized.endsWith(extension),
  );
}

function documentationReferencesRoute(
  documentation: string,
  route: RouteDefinition,
): boolean {
  const escapedPath = route.path.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const pattern = new RegExp(
    `${route.method}\\s+\`?${escapedPath}\`?`,
    "i",
  );

  return pattern.test(documentation);
}

export function detectStaleApiRoutes(
  changedFiles: ChangedFile[],
  baseSha: string,
  headSha: string,
  documentationFiles: string[],
): DocumentationFinding[] {
  const findings: DocumentationFinding[] = [];

  for (const file of changedFiles) {
    if (!isRouteSourceFile(file.filename)) {
      continue;
    }

    const baseContent = readFileAtRef(baseSha, file.filename);
    const headContent = readFileAtRef(headSha, file.filename);

    const oldRoutes = baseContent
      ? parseExpressRoutes(baseContent, file.filename)
      : [];

    const currentRoutes = headContent
      ? parseExpressRoutes(headContent, file.filename)
      : [];

    const currentRouteKeys = new Set(currentRoutes.map(getRouteKey));

    for (const oldRoute of oldRoutes) {
      const routeKey = getRouteKey(oldRoute);

      if (currentRouteKeys.has(routeKey)) {
        continue;
      }

      for (const documentationFile of documentationFiles) {
        if (!fs.existsSync(documentationFile)) {
          continue;
        }

        const documentation = fs.readFileSync(documentationFile, "utf8");

        if (!documentationReferencesRoute(documentation, oldRoute)) {
          continue;
        }

        findings.push({
          type: "stale-api-route",
          documentationFile,
          reference: routeKey,
          message:
            `${documentationFile} references "${routeKey}", but that API route ` +
            `no longer exists in ${file.filename}.`,
        });
      }
    }
  }

  return findings;
}
