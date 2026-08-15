import type { DocDriftConfig } from "../types/config";
import type { SemanticProvider } from "./provider";
interface ProviderFactoryOptions {
    config: DocDriftConfig;
    geminiApiKey?: string;
}
export declare function createSemanticProvider(options: ProviderFactoryOptions): SemanticProvider | null;
export {};
//# sourceMappingURL=provider-factory.d.ts.map