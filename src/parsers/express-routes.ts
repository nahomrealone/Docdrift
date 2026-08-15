import type { HttpMethod, RouteDefinition } from "../types/route";

const EXPRESS_ROUTE_PATTERN =
  /\b(app|router)\s*\.\s*(get|post|put|patch|delete|options|head)\s*\(\s*(["'`])([^"'`]+)\3\s*,/g;

export function parseExpressRoutes(
  content: string,
  filename: string,
): RouteDefinition[] {
  const routes: RouteDefinition[] = [];

  for (const match of content.matchAll(EXPRESS_ROUTE_PATTERN)) {
    const methodName = match[2];
    const path = match[4];

    if (!methodName || !path || path.includes("${")) {
      continue;
    }

    const method = methodName.toUpperCase() as HttpMethod;

    routes.push({
      method,
      path,
      file: filename,
      framework: "express",
    });
  }

  return routes;
}
