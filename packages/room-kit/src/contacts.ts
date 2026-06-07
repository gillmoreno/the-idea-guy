import type { ContactRecord, ContactStatus } from "./types";

/** Both parties must be `mutual` before invites / chat-style messages flow. */
export function canExchangeMessages(contact: ContactRecord | undefined): boolean {
  return contact?.status === "mutual";
}

export function canSendFriendRequest(contact: ContactRecord | undefined): boolean {
  if (!contact) return true;
  return contact.status === "pending_out";
}

export function shouldSyncInbox(status: ContactStatus): boolean {
  return status === "pending_out" || status === "pending_in" || status === "mutual";
}

export function contactDisplayName(contact: ContactRecord): string {
  return contact.displayName.trim() || "Contact";
}
