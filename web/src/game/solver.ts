import { isSolved, type Cell, type Level, type Paths } from "./grid";

const STEPS: readonly (readonly [number, number])[] = [
  [-1, 0],
  [1, 0],
  [0, -1],
  [0, 1],
];

/**
 * Find up to `limit` complete solutions of `level` by backtracking.
 *
 * Pairs are routed one at a time, shortest first. After every step, each free
 * cell must still be reachable from an endpoint that is not yet routed, or from
 * the head of the path being drawn. A free cell that is not an endpoint also
 * needs two places to route through. Both checks prune dead ends early.
 * Solutions are keyed by pair id.
 */
export function findSolutions(level: Level, limit = 2): Paths[] {
  const { size } = level;
  const cells = size * size;
  const index = ([r, c]: Cell) => r * size + c;

  const order = [...level.pairs].sort((x, y) => span(x.a, x.b) - span(y.a, y.b));
  const count = order.length;
  const aIdx = Int16Array.from(order, (p) => index(p.a));
  const bIdx = Int16Array.from(order, (p) => index(p.b));

  // owner[i]: slot of the pair routed through cell i, or -1 while it is free.
  const owner = new Int16Array(cells).fill(-1);
  // endpointOf[i]: slot of the pair whose endpoint sits on cell i, or -1.
  const endpointOf = new Int16Array(cells).fill(-1);
  for (let k = 0; k < count; k++) {
    endpointOf[aIdx[k]!] = k;
    endpointOf[bIdx[k]!] = k;
  }

  const routes: Cell[][] = order.map(() => []);
  const results: Paths[] = [];
  const seen = new Uint8Array(cells);
  const queue = new Int16Array(cells);

  /**
   * Flood fill from the free endpoints of slots `from` onward, plus `head` when
   * it is not -1. Every free cell must be reached, and every free non-endpoint
   * must have room for a path through it.
   */
  function stillSolvable(from: number, head: number): boolean {
    seen.fill(0);
    let read = 0;
    let tail = 0;
    const push = (i: number) => {
      if (seen[i]) return;
      seen[i] = 1;
      queue[tail++] = i;
    };
    if (head !== -1) push(head);
    for (let k = from; k < count; k++) {
      if (owner[aIdx[k]!] === -1) push(aIdx[k]!);
      if (owner[bIdx[k]!] === -1) push(bIdx[k]!);
    }
    while (read < tail) {
      const i = queue[read++]!;
      const r = Math.floor(i / size);
      const c = i % size;
      for (const [dr, dc] of STEPS) {
        const nr = r + dr;
        const nc = c + dc;
        if (nr < 0 || nc < 0 || nr >= size || nc >= size) continue;
        const j = nr * size + nc;
        if (seen[j] || owner[j] !== -1) continue;
        push(j);
      }
    }
    for (let i = 0; i < cells; i++) {
      if (owner[i] !== -1) continue;
      if (!seen[i]) return false;
      if (endpointOf[i] === -1 && routable(i, head) < 2) return false;
    }
    return true;
  }

  /** Neighbours a path could step through: free cells, plus the head it steps from. */
  function routable(i: number, head: number): number {
    const r = Math.floor(i / size);
    const c = i % size;
    let n = 0;
    for (const [dr, dc] of STEPS) {
      const nr = r + dr;
      const nc = c + dc;
      if (nr < 0 || nc < 0 || nr >= size || nc >= size) continue;
      const j = nr * size + nc;
      if (owner[j] === -1 || j === head) n++;
    }
    return n;
  }

  /** Extend slot `k`'s path from `head` by one free step, recursing on each choice. */
  function extend(k: number, head: Cell) {
    const route = routes[k]!;
    const [hr, hc] = head;
    for (const [dr, dc] of STEPS) {
      if (results.length >= limit) return;
      const nr = hr + dr;
      const nc = hc + dc;
      if (nr < 0 || nc < 0 || nr >= size || nc >= size) continue;
      const j = nr * size + nc;
      if (owner[j] !== -1) continue;
      const e = endpointOf[j];
      if (e !== -1 && e !== k) continue;

      owner[j] = k;
      route.push([nr, nc]);
      if (j === bIdx[k]) {
        if (stillSolvable(k + 1, -1)) routePair(k + 1);
      } else if (stillSolvable(k, j)) {
        extend(k, [nr, nc]);
      }
      route.pop();
      owner[j] = -1;
    }
  }

  function routePair(k: number) {
    if (results.length >= limit) return;
    if (k === count) {
      const paths: Record<string, Cell[]> = {};
      order.forEach((p, slot) => {
        paths[p.id] = (routes[slot] ?? []).map((c): Cell => [c[0], c[1]]);
      });
      if (isSolved(level, paths)) results.push(paths);
      return;
    }
    const start = order[k]!.a;
    owner[aIdx[k]!] = k;
    routes[k]!.push(start);
    extend(k, start);
    routes[k]!.pop();
    owner[aIdx[k]!] = -1;
  }

  routePair(0);
  return results;
}

function span(a: Cell, b: Cell): number {
  return Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]);
}
