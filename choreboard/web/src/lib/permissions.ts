import { ChoreStore } from "./store";
import { KidPermissions, Role } from "./types";

/** Defaults for every kid unless a per-member override says otherwise. */
export const DEFAULT_KID_PERMISSIONS: KidPermissions = {
  seeChoreRewards: true,
  seeOwnBalance: true,
  seePendingBalance: true,
  seeWeekEarnings: true,
  seeSiblingBalances: false,
  canMarkDone: true,
  canProposeChores: true,
  seeActivityHistory: true,
};

export function mergePermissions(
  base: KidPermissions,
  patch?: Partial<KidPermissions>,
): KidPermissions {
  return { ...base, ...patch };
}

/** Effective permissions for a member (parents always get full access in UI). */
export function getEffectivePermissions(
  store: ChoreStore,
  memberId: string,
): KidPermissions & { isParent: boolean } {
  const member = store.getMember(memberId);
  if (!member || member.role === "parent") {
    return { ...DEFAULT_KID_PERMISSIONS, isParent: true };
  }
  const defaults = store.getKidDefaults();
  const override = store.getKidOverride(memberId);
  return { ...mergePermissions(defaults, override), isParent: false };
}

export const PERMISSION_LABELS: Record<keyof KidPermissions, string> = {
  seeChoreRewards: "See reward amount on each chore (e.g. $0.50)",
  seeOwnBalance: "See their total money owed",
  seePendingBalance: "See amount waiting for parent approval",
  seeWeekEarnings: "See how much they earned this week",
  seeSiblingBalances: "See other kids' balances",
  canMarkDone: "Mark chores as done",
  canProposeChores: "Suggest new chores",
  seeActivityHistory: "See their recent activity list",
};
