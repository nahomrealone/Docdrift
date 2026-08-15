import type { DocDriftConfig } from "../types/config";
import type { SemanticProvider } from "./provider";
import { GeminiProvider } from "./providers/gemini";

interface ProviderFactoryOptions {
  config: DocDriftConfig;
  geminiApiKey?: string;
}

export function createSemanticProvider(
  options: ProviderFactoryOptions,
): SemanticProvider | null {
  if (!options.config.detectors.semantic) {
    return null;
  }

  if (options.config.semantic.provider === "gemini") {
    if (!options.geminiApiKey) {
      return null;
    }

    return new GeminiProvider({
      apiKey: options.geminiApiKey,
      model: options.config.semantic.model,
    });
  }

  return null;
}
