import { getRouteKey } from "../parsers/api-routes";
import type { RouteDefinition } from "../types/route";

interface RouteSuggestion {
  route: RouteDefinition;
  confidence: number;
}

function getSegments(path: string): string[] {
  return path.split("/").filter(Boolean);
}

function isDynamicSegment(segment: string): boolean {
  return (
    segment.startsWith(":") || segment.startsWith("{") || segment === "*"
  );
}

function dynamicShapeScore(firstPath: string, secondPath: string): number {
  const first = getSegments(firstPath);
  const second = getSegments(secondPath);

  if (first.length !== second.length || first.length === 0) {
    return 0;
  }

  let matches = 0;

  for (let index = 0; index < first.length; index++) {
    const firstSegment = first[index];
    const secondSegment = second[index];

    if (
      firstSegment !== undefined &&
      secondSegment !== undefined &&
      isDynamicSegment(firstSegment) === isDynamicSegment(secondSegment)
    ) {
      matches++;
    }
  }

  return matches / first.length;
}

function levenshtein(first: string, second: string): number {
  const matrix: number[][] = Array.from(
    { length: first.length + 1 },
    () => new Array<number>(second.length + 1).fill(0),
  );

  for (let index = 0; index <= first.length; index++) {
    matrix[index]![0] = index;
  }

  for (let index = 0; index <= second.length; index++) {
    matrix[0]![index] = index;
  }

  for (let firstIndex = 1; firstIndex <= first.length; firstIndex++) {
    for (let secondIndex = 1; secondIndex <= second.length; secondIndex++) {
      const cost =
        first[firstIndex - 1] === second[secondIndex - 1] ? 0 : 1;

      matrix[firstIndex]![secondIndex] = Math.min(
        matrix[firstIndex - 1]![secondIndex]! + 1,
        matrix[firstIndex]![secondIndex - 1]! + 1,
        matrix[firstIndex - 1]![secondIndex - 1]! + cost,
      );
    }
  }

  return matrix[first.length]![second.length]!;
}

function stringSimilarity(first: string, second: string): number {
  const longest = Math.max(first.length, second.length);

  if (longest === 0) {
    return 1;
  }

  return 1 - levenshtein(first, second) / longest;
}

function scoreCandidate(
  removed: RouteDefinition,
  candidate: RouteDefinition,
): number {
  if (removed.method !== candidate.method) {
    return 0;
  }

  const oldSegments = getSegments(removed.path);
  const newSegments = getSegments(candidate.path);
  let score = 0.45;

  if (oldSegments.length === newSegments.length) {
    score += 0.2;
  }

  score += dynamicShapeScore(removed.path, candidate.path) * 0.2;
  score += stringSimilarity(removed.path, candidate.path) * 0.15;

  return Math.min(score, 1);
}

export function findRouteReplacement(
  removedRoute: RouteDefinition,
  addedRoutes: RouteDefinition[],
): RouteSuggestion | null {
  const candidates = addedRoutes
    .map((route) => ({
      route,
      confidence: scoreCandidate(removedRoute, route),
    }))
    .filter((candidate) => candidate.confidence >= 0.72)
    .sort((first, second) => second.confidence - first.confidence);

  const best = candidates[0];
  const second = candidates[1];

  if (!best) {
    return null;
  }

  if (second && best.confidence - second.confidence < 0.08) {
    return null;
  }

  return best;
}

export function describeRoute(route: RouteDefinition): string {
  return getRouteKey(route);
}
