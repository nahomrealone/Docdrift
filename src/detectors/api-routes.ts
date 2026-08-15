import * as fs from "node:fs";

import { locateReference } from "../documentation/locator";
import { getRouteKey, parseApiRoutes } from "../parsers/api-routes";
import { listFilesAtRef, readFileAtRef } from "../repository/git-file";
import type { DocumentationFinding } from "../types/finding";
import type { RouteDefinition } from "../types/route";
import { describeRoute, findRouteReplacement } from "./route-suggestions";

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

function buildRouteInventory(ref: string): RouteDefinition[] {
  const routes: RouteDefinition[] = [];
  const files = listFilesAtRef(ref).filter(isRouteSourceFile);

  for (const filename of files) {
    const content = readFileAtRef(ref, filename);

    if (!content) {
      continue;
    }

    routes.push(...parseApiRoutes(content, filename));
  }

  return routes;
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

  if (!changedFiles.some((file) => isRouteSourceFile(file.filename))) {
    return findings;
  }

  const oldRoutes = buildRouteInventory(baseSha);
  const currentRoutes = buildRouteInventory(headSha);
  const oldRouteKeys = new Set(oldRoutes.map(getRouteKey));
  const currentRouteKeys = new Set(currentRoutes.map(getRouteKey));
  const addedRoutes = currentRoutes.filter(
    (route) => !oldRouteKeys.has(getRouteKey(route)),
  );
  const oldRoutesByKey = new Map<string, RouteDefinition>();

  for (const route of oldRoutes) {
    const key = getRouteKey(route);

    if (!oldRoutesByKey.has(key)) {
      oldRoutesByKey.set(key, route);
    }
  }

  for (const [routeKey, oldRoute] of oldRoutesByKey) {
    if (currentRouteKeys.has(routeKey)) {
      continue;
    }

    const replacement = findRouteReplacement(oldRoute, addedRoutes);

    for (const documentationFile of documentationFiles) {
      if (!fs.existsSync(documentationFile)) {
        continue;
      }

      const documentation = fs.readFileSync(documentationFile, "utf8");

      if (!documentationReferencesRoute(documentation, oldRoute)) {
        continue;
      }

      const locations = locateReference(documentation, routeKey);

      if (locations.length === 0) {
        continue;
      }

      findings.push({
        type: "stale-api-route",
        documentationFile,
        reference: routeKey,
        message:
          `${documentationFile} references "${routeKey}", but that API route ` +
          "no longer exists in the current codebase.",
        locations,
        ...(replacement
          ? {
              suggestion: describeRoute(replacement.route),
              confidence: replacement.confidence,
            }
          : {}),
      });
    }
  }

  return findings;
}
