/**
 * Shared fairness rotation (used by carpool, gamenight): whose turn is it,
 * given a history of who-did-it events. Fewest events wins; ties go to whoever
 * did it longest ago (never counts as longest ago, ordered by join time).
 */

export interface RotationMember {
  id: string;
  joinedAt: number;
}

export interface RotationEvent {
  memberId: string;
  at: number;
}

export function eventCounts(
  members: RotationMember[],
  events: RotationEvent[],
): Map<string, number> {
  const counts = new Map(members.map((m) => [m.id, 0]));
  for (const event of events) {
    if (counts.has(event.memberId)) {
      counts.set(event.memberId, (counts.get(event.memberId) ?? 0) + 1);
    }
  }
  return counts;
}

export function nextUp<M extends RotationMember>(
  members: M[],
  events: RotationEvent[],
): M | null {
  if (members.length === 0) return null;
  const counts = eventCounts(members, events);
  const lastAt = new Map<string, number>();
  for (const event of events) {
    if (!counts.has(event.memberId)) continue;
    lastAt.set(event.memberId, Math.max(lastAt.get(event.memberId) ?? 0, event.at));
  }
  return [...members].sort((a, b) => {
    const countDiff = (counts.get(a.id) ?? 0) - (counts.get(b.id) ?? 0);
    if (countDiff !== 0) return countDiff;
    const lastDiff = (lastAt.get(a.id) ?? 0) - (lastAt.get(b.id) ?? 0);
    if (lastDiff !== 0) return lastDiff;
    return a.joinedAt - b.joinedAt;
  })[0];
}
