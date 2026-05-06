import { apiRequest } from "@/shared/api/http-client";
import { LlmConfig, LlmModelOption, RemoteLlmProviderName } from "@/shared/types";

export function getLlmConfig(token: string) {
  return apiRequest<LlmConfig>("/llm/config", "GET", undefined, token);
}

export function saveLlmConfig(config: LlmConfig, token: string) {
  return apiRequest<LlmConfig>(
    "/llm/config",
    "POST",
    {
      activeProvider: config.activeProvider,
      localBaseUrl: config.localBaseUrl,
      localGeneratePath: config.localGeneratePath,
      localModel: config.localModel,
      localTimeoutMs: config.localTimeoutMs,
      apiProviderName: config.apiProviderName || undefined,
      apiBaseUrl: config.apiBaseUrl || undefined,
      apiGeneratePath: config.apiGeneratePath || undefined,
      apiModel: config.apiModel || undefined,
      referenceMarkdown: config.referenceMarkdown,
      apiKey: config.apiKey || undefined,
      apiTimeoutMs: config.apiTimeoutMs
    },
    token
  );
}

export function listLlmModels(
  payload:
    | {
        providerType: "LOCAL";
        localBaseUrl?: string;
      }
    | {
        providerType: "API";
        providerName: Exclude<RemoteLlmProviderName, "">;
        apiKey?: string;
      },
  token: string
) {
  return apiRequest<LlmModelOption[]>("/llm/models", "POST", payload, token, { timeoutMs: 20000 });
}
