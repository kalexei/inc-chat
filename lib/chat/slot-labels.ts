import { SLOT_FIELDS } from "@/lib/chat-constants";

export type SlotField = (typeof SLOT_FIELDS)[number];

const LABELS: Record<SlotField, string> = {
  firstName: "firstName",
  lastName: "lastName",
  email: "email",
  phone: "phone",
  countryCode: "countryCode (opt)",
  preferredContactMethod: "preferredContact (opt)",
  nationality: "nationality (opt)",
  licenseType: "licenseType (opt)",
  package: "package (opt)",
  needUAEVisa: "needUAEVisa (opt)",
  totalNumberOfVisa: "totalVisas (opt)",
};

export function slotFieldLabel(field: SlotField): string {
  return LABELS[field];
}
