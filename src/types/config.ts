export type DocDriftMode = "report" | "enforce";

export interface DetectorConfig {
  packageScripts: boolean;
  envVars: boolean;
  apiRoutes: boolean;
}

export interface DocumentationPathConfig {
  include: string[];
  exclude: string[];
}

export interface PathConfig {
  documentation: DocumentationPathConfig;
  ignore: string[];
}

export interface DocDriftConfig {
  version: 1;
  mode: DocDriftMode;
  detectors: DetectorConfig;
  paths: PathConfig;
}
