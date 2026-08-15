export type DocDriftMode = "report" | "enforce";
export interface DetectorConfig {
    packageScripts: boolean;
    envVars: boolean;
    apiRoutes: boolean;
}
export interface DocDriftConfig {
    version: 1;
    mode: DocDriftMode;
    detectors: DetectorConfig;
}
//# sourceMappingURL=config.d.ts.map