import type { RouteDefinition } from "../types/route";
import { parseExpressRoutes } from "./express-routes";
import { parseNestJsRoutes } from "./nestjs-routes";

export function parseApiRoutes(
  content: string,
  filename: string,
): RouteDefinition[] {
  return [
    ...parseExpressRoutes(content, filename),
    ...parseNestJsRoutes(content, filename),
  ];
}

export function getRouteKey(route: RouteDefinition): string {
  return `${route.method} ${route.path}`;
}
