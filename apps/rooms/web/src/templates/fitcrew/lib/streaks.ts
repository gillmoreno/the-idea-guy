/** Local calendar day key `YYYY-MM-DD`. */
export function localDayKey(ts: number): string {
  const d = new Date(ts);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function parseDayKey(key: string): Date {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function previousDayKey(key: string): string {
  const d = parseDayKey(key);
  d.setDate(d.getDate() - 1);
  return localDayKey(d.getTime());
}

function isConsecutiveDay(a: string, b: string): boolean {
  return previousDayKey(b) === a;
}

export function startOfWeekMs(now = Date.now()): number {
  const d = new Date(now);
  const weekday = d.getDay();
  const mondayOffset = weekday === 0 ? 6 : weekday - 1;
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - mondayOffset);
  return d.getTime();
}

export function computeStreakStats(dayKeys: string[]): { current: number; best: number } {
  const unique = [...new Set(dayKeys)].sort();
  if (unique.length === 0) return { current: 0, best: 0 };

  let best = 1;
  let run = 1;
  for (let i = 1; i < unique.length; i++) {
    if (isConsecutiveDay(unique[i - 1], unique[i])) {
      run++;
      best = Math.max(best, run);
    } else {
      run = 1;
    }
  }

  const set = new Set(unique);
  const today = localDayKey(Date.now());
  const yesterday = previousDayKey(today);
  let anchor: string | null = null;
  if (set.has(today)) anchor = today;
  else if (set.has(yesterday)) anchor = yesterday;

  let current = 0;
  if (anchor) {
    current = 1;
    let cursor = anchor;
    while (set.has(previousDayKey(cursor))) {
      current++;
      cursor = previousDayKey(cursor);
    }
  }

  return { current, best: Math.max(best, current) };
}
