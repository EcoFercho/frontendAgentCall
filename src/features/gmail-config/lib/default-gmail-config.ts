import { GmailConfig } from "@/shared/types";

export const defaultGmailConfig: GmailConfig = {
  baseEmail: "engine.ia.lab@gmail.com",
  appPassword: "",
  host: "imap.gmail.com",
  port: 993,
  secure: true,
  spamScoreLimit: 45,
  allowedDomains: [],
  allowedSenders: [],
  clientKeywords: [],
  incidentKeywords: [],
  blockedKeywords: []
};
