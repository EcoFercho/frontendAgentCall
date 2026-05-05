import { apiRequest } from "@/shared/api/http-client";
import { ApprovedMessage, GmailConfig, MessageSummary } from "@/shared/types";

export function getMailConfig(token: string) {
  return apiRequest<GmailConfig | null>("/gmail/config", "GET", undefined, token);
}

export function getClassifiedMessages(token: string) {
  return apiRequest<ApprovedMessage[]>("/gmail/messages/classified", "GET", undefined, token, {
    timeoutMs: 20000
  });
}

export function getMessageSummary(token: string) {
  return apiRequest<MessageSummary>("/gmail/messages/summary", "GET", undefined, token);
}

export function testMailConnection(config: Partial<GmailConfig>, token: string) {
  return apiRequest<{ message: string }>("/gmail/config/test", "POST", config, token);
}

export function saveMailConfig(config: GmailConfig, token: string) {
  return apiRequest<GmailConfig>("/gmail/config", "POST", config, token);
}

export function syncMailbox(token: string) {
  return apiRequest<{ synced: number; approved: number; irrelevant: number; spam: number }>(
    "/gmail/sync",
    "POST",
    {},
    token,
    { timeoutMs: 25000 }
  );
}
