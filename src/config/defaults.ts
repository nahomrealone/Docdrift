import type { DocDriftConfig } from "../types/config";

export const DEFAULT_CONFIG: DocDriftConfig = {
  version: 1,
  mode: "report",
  detectors: {
    packageScripts: true,
    envVars: true,
    apiRoutes: true,
  },
  paths: {
    documentation: {
      include: ["*.md", "*.mdx", "**/*.md", "**/*.mdx"],
      exclude: [],
    },
    ignore: [],
  },
};
