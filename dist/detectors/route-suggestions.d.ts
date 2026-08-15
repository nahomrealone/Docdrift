import type { RouteDefinition } from "../types/route";
interface RouteSuggestion {
    route: RouteDefinition;
    confidence: number;
}
export declare function findRouteReplacement(removedRoute: RouteDefinition, addedRoutes: RouteDefinition[]): RouteSuggestion | null;
export declare function describeRoute(route: RouteDefinition): string;
export {};
//# sourceMappingURL=route-suggestions.d.ts.map