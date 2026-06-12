/**
 * Single-elimination bracket math. Pure functions over a locked player order
 * and a results lookup (matchKey -> winnerId), so CRDT-merged results always
 * produce a consistent bracket on every device.
 */

export function matchKey(round: number, index: number): string {
  return `r${round}m${index}`;
}

export function bracketSize(playerCount: number): number {
  let size = 1;
  while (size < playerCount) size *= 2;
  return size;
}

export function roundCount(playerCount: number): number {
  return Math.log2(bracketSize(playerCount));
}

/**
 * Participant id for a slot in a round, or null if not yet decided / bye.
 * Round 0 slots come from the seeded player list (padded with byes);
 * later rounds from the winner of the feeding match.
 */
export function participant(
  playerIds: string[],
  results: (key: string) => string | undefined,
  round: number,
  slot: number,
): string | null {
  if (round === 0) {
    return playerIds[slot] ?? null;
  }
  const feederIndex = slot;
  return matchWinner(playerIds, results, round - 1, feederIndex);
}

/** Winner of a match: reported result, or the sole participant on a bye. */
export function matchWinner(
  playerIds: string[],
  results: (key: string) => string | undefined,
  round: number,
  index: number,
): string | null {
  const p1 = participant(playerIds, results, round, index * 2);
  const p2 = participant(playerIds, results, round, index * 2 + 1);
  if (p1 && !p2) return p1;
  if (p2 && !p1) return p2;
  if (!p1 || !p2) return null;
  const reported = results(matchKey(round, index));
  return reported === p1 || reported === p2 ? reported : null;
}

export interface MatchView {
  round: number;
  index: number;
  key: string;
  p1: string | null;
  p2: string | null;
  winner: string | null;
  /** True when both participants are known and no winner reported yet. */
  playable: boolean;
  /** True when one side is a bye (auto-advance, not shown as playable). */
  bye: boolean;
}

export function bracketRounds(
  playerIds: string[],
  results: (key: string) => string | undefined,
): MatchView[][] {
  const rounds: MatchView[][] = [];
  const totalRounds = roundCount(playerIds.length);
  for (let r = 0; r < totalRounds; r++) {
    const matches: MatchView[] = [];
    const matchCount = bracketSize(playerIds.length) / Math.pow(2, r + 1);
    for (let i = 0; i < matchCount; i++) {
      const p1 = participant(playerIds, results, r, i * 2);
      const p2 = participant(playerIds, results, r, i * 2 + 1);
      const winner = matchWinner(playerIds, results, r, i);
      const bye = (p1 === null) !== (p2 === null);
      matches.push({
        round: r,
        index: i,
        key: matchKey(r, i),
        p1,
        p2,
        winner,
        playable: !!p1 && !!p2 && !winner,
        bye,
      });
    }
    rounds.push(matches);
  }
  return rounds;
}

export function champion(
  playerIds: string[],
  results: (key: string) => string | undefined,
): string | null {
  const totalRounds = roundCount(playerIds.length);
  if (totalRounds === 0) return playerIds[0] ?? null;
  return matchWinner(playerIds, results, totalRounds - 1, 0);
}

export function roundLabel(round: number, totalRounds: number): string {
  const remaining = totalRounds - round;
  if (remaining === 1) return "Final";
  if (remaining === 2) return "Semifinals";
  if (remaining === 3) return "Quarterfinals";
  return `Round ${round + 1}`;
}
