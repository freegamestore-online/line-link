import { describe, expect, it } from "vitest";
import { findSolutions } from "./solver";
import { isSolved, type Cell, type Level } from "./grid";
import { STARTER } from "./levels";

/** Reference enumerator with no pruning: route each pair by plain DFS and count full covers. */
function countByBruteForce(level: Level): number {
  const n = level.size;
  const key = (c: Cell) => `${c[0]},${c[1]}`;
  const ends = new Set(level.pairs.flatMap((p) => [key(p.a), key(p.b)]));
  const taken = new Set<string>();
  let count = 0;

  function route(k: number) {
    if (k === level.pairs.length) {
      if (taken.size === n * n) count++;
      return;
    }
    const pair = level.pairs[k]!;
    taken.add(key(pair.a));
    const dfs = (head: Cell) => {
      for (const [dr, dc] of [[-1, 0], [1, 0], [0, -1], [0, 1]] as const) {
        const next: Cell = [head[0] + dr, head[1] + dc];
        if (next[0] < 0 || next[1] < 0 || next[0] >= n || next[1] >= n) continue;
        const nk = key(next);
        if (taken.has(nk) || (ends.has(nk) && nk !== key(pair.b))) continue;
        taken.add(nk);
        if (nk === key(pair.b)) route(k + 1);
        else dfs(next);
        taken.delete(nk);
      }
    };
    dfs(pair.a);
    taken.delete(key(pair.a));
  }

  route(0);
  return count;
}

/** Deterministic pseudo-random numbers, so the cross-check is repeatable. */
function seeded(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

describe("findSolutions", () => {
  it("finds the known solution of a level", () => {
    const solutions = findSolutions(STARTER.level, 1);
    expect(solutions).toHaveLength(1);
    expect(isSolved(STARTER.level, solutions[0]!)).toBe(true);
  });

  it("returns every solution up to the limit", () => {
    const all = countByBruteForce(STARTER.level);
    expect(all).toBeGreaterThan(2);
    expect(findSolutions(STARTER.level, 1000)).toHaveLength(all);
    expect(findSolutions(STARTER.level, 2)).toHaveLength(2);
  });

  it("agrees with brute-force enumeration on random small puzzles", () => {
    const rnd = seeded(7);
    let solvable = 0;
    for (let iter = 0; iter < 150; iter++) {
      const n = 3 + Math.floor(rnd() * 2);
      const cells: Cell[] = [];
      for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) cells.push([r, c]);
      cells.sort(() => rnd() - 0.5);
      const k = 2 + Math.floor(rnd() * 2);
      const level: Level = {
        name: `random ${iter}`,
        size: n,
        pairs: Array.from({ length: k }, (_, i) => ({ id: `p${i}`, color: "#000", a: cells[2 * i]!, b: cells[2 * i + 1]! })),
      };
      const expected = countByBruteForce(level);
      expect(findSolutions(level, 1000), level.name).toHaveLength(expected);
      if (expected > 0) solvable++;
    }
    // The comparison only means something if some puzzles have solutions.
    expect(solvable).toBeGreaterThan(10);
  });
});
