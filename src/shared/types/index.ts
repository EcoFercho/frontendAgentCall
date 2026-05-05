export type LoginResponse = {
  accessToken: string;
  user: AdminUser;
};

export type AdminUser = {
  id: string;
  email: string;
  role: "ADMIN";
};

export type GmailConfig = {
  id?: string;
  baseEmail: string;
  appPassword?: string;
  host: string;
  port: number;
  secure: boolean;
  spamScoreLimit: number;
  allowedDomains: string[];
  allowedSenders: string[];
  clientKeywords: string[];
  incidentKeywords: string[];
  blockedKeywords: string[];
  lastConnectionAt?: string;
  lastSyncAt?: string;
};

export type LlmProviderType = "LOCAL" | "API";
export type RemoteLlmProviderName = "" | "OPENAI" | "ANTHROPIC" | "GOOGLE";
export type LlmModelOption = {
  id: string;
  label: string;
};

export type LlmConfig = {
  id?: string;
  activeProvider: LlmProviderType;
  localBaseUrl: string;
  localGeneratePath: string;
  localModel: string;
  localTimeoutMs: number;
  apiProviderName: RemoteLlmProviderName;
  apiBaseUrl: string;
  apiGeneratePath: string;
  apiModel: string;
  referenceMarkdown: string;
  apiKey?: string;
  apiKeyConfigured?: boolean;
  apiTimeoutMs: number;
  updatedAt?: string;
};

export type ApprovedMessage = {
  id: string;
  fromName?: string | null;
  fromEmail: string;
  subject?: string | null;
  snippet?: string | null;
  bodyText?: string | null;
  receivedAt: string;
  status: "APPROVED" | "IRRELEVANT" | "SPAM" | "RECEIVED";
  classificationReason?: string | null;
  classificationConfidence?: number;
  matchedRules?: string[];
  detectedClientName?: string | null;
  incidentSummary?: string | null;
  incidentSummaryModel?: string | null;
  incidentSummaryGeneratedAt?: string | null;
};

export type MessageSummary = {
  classifiedCount: number;
  approvedCount: number;
  dashboardLimit: number;
};

export type ShiftUser = {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  shiftDate: string;
  shiftStart: string;
  shiftEnd: string;
  isMaster: boolean;
  priority: number;
};
