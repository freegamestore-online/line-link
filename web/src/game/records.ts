/** Best result per puzzle. Null until the puzzle has been solved once. */
export interface Records {
  bestSeconds: number | null;
  fewestMoves: number | null;
}

export interface Result {
  seconds: number;
  moves: number;
}

const EMPTY: Records = { bestSeconds: null, fewestMoves: null };

const key = (levelName: string) => `line-link:records:${levelName}`;

const numberOrNull = (value: unknown): number | null => (typeof value === "number" ? value : null);

export function loadRecords(levelName: string): Records {
  try {
    const raw = localStorage.getItem(key(levelName));
    if (!raw) return EMPTY;
    const stored = JSON.parse(raw) as Partial<Record<keyof Records, unknown>>;
    return { bestSeconds: numberOrNull(stored.bestSeconds), fewestMoves: numberOrNull(stored.fewestMoves) };
  } catch {
    return EMPTY;
  }
}

export function saveRecords(levelName: string, records: Records): void {
  localStorage.setItem(key(levelName), JSON.stringify(records));
}

const lower = (a: number | null, b: number): number => (a === null ? b : Math.min(a, b));

/** Fold one solve into the records: each field keeps its own best. */
export function mergeRecords(prev: Records, result: Result): Records {
  return {
    bestSeconds: lower(prev.bestSeconds, result.seconds),
    fewestMoves: lower(prev.fewestMoves, result.moves),
  };
}
