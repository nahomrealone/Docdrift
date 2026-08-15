import type { HttpMethod, RouteDefinition } from "../types/route";

const CONTROLLER_PATTERN =
  /@Controller\s*\(\s*(?:(["'`])([^"'`]*)\1)?\s*\)/g;

const ROUTE_PATTERN =
  /@(Get|Post|Put|Patch|Delete|Options|Head)\s*\(\s*(?:(["'`])([^"'`]*)\2)?\s*\)/g;

function joinPaths(controllerPath: string, methodPath: string): string {
  const controller = controllerPath.replace(/^\/+|\/+$/g, "");
  const method = methodPath.replace(/^\/+|\/+$/g, "");
  const parts = [controller, method].filter(Boolean);

  if (parts.length === 0) {
    return "/";
  }

  return `/${parts.join("/")}`;
}

export function parseNestJsRoutes(
  content: string,
  filename: string,
): RouteDefinition[] {
  const routes: RouteDefinition[] = [];
  const controllers = [...content.matchAll(CONTROLLER_PATTERN)];

  for (let index = 0; index < controllers.length; index++) {
    const controller = controllers[index];

    if (!controller) {
      continue;
    }

    const controllerPath = controller[2] ?? "";

    if (controllerPath.includes("${")) {
      continue;
    }

    const sectionStart = (controller.index ?? 0) + controller[0].length;
    const sectionEnd = controllers[index + 1]?.index ?? content.length;
    const controllerSection = content.slice(sectionStart, sectionEnd);

    for (const routeMatch of controllerSection.matchAll(ROUTE_PATTERN)) {
      const methodName = routeMatch[1];
      const methodPath = routeMatch[3] ?? "";

      if (!methodName || methodPath.includes("${")) {
        continue;
      }

      const method = methodName.toUpperCase() as HttpMethod;

      routes.push({
        method,
        path: joinPaths(controllerPath, methodPath),
        file: filename,
        framework: "nestjs",
      });
    }
  }

  return routes;
}
