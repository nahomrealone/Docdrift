export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE" | "OPTIONS" | "HEAD";
export interface RouteDefinition {
    method: HttpMethod;
    path: string;
    file: string;
    framework: "express";
}
//# sourceMappingURL=route.d.ts.map