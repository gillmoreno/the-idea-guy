/**
 * Device-local free-generation counter ("spells"). v1 is honest-majority
 * enforcement — the proxy's per-IP and monthly-budget caps are the real
 * rails (docs_and_changelog/ROOM_AI.md). Persona-signed budgets and viral
 * refills come later.
 */

export const FREE_SPELLS = 15;

const STORAGE_KEY = "rooms.freeSpells.used";

function used(): number {
  if (typeof window === "undefined") return 0;
  const n = Number.parseInt(window.localStorage.getItem(STORAGE_KEY) ?? "0", 10);
  return Number.isFinite(n) && n > 0 ? n : 0;
}

export function spellsLeft(): number {
  return Math.max(0, FREE_SPELLS - used());
}

export function spendSpell(): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, String(used() + 1));
}
