export const STORAGE_KEY = "sales-agent-sessions";
export const USER_ID_KEY = "sales-agent-user-id";
export const SESSION_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

export const SLOT_FIELDS = [
  "firstName",
  "lastName",
  "email",
  "phone",
  "countryCode",
  "preferredContactMethod",
  "nationality",
  "licenseType",
  "package",
  "needUAEVisa",
  "totalNumberOfVisa",
] as const;

export const TOOL_ICONS: Record<string, string> = {
  updateLeadSlots: "✏️ ",
  updateChatMetadata: "🏷️ ",
  searchProductKnowledge: "📚",
  submitLead: "🚀",
  updateLead: "🔄",
  extractConversationNotes: "📝",
};
