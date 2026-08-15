export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE" | "OPTIONS" | "HEAD";
export interface RouteDefinition {
    method: HttpMethod;
    path: string;
    file: string;
    framework: "express" | "nestjs";
}
//# sourceMappingURL=route.d.ts.map