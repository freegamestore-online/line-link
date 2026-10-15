/** A grid cell as [row, col], both zero-based. */
export type Cell = readonly [row: number, col: number];

/** A coloured dot pair. A path of that colour must join `a` to `b`. */
export interface Pair {
  id: string;
  color: string;
  a: Cell;
  b: Cell;
}

export interface Level {
  name: string;
  size: number;
  pairs: readonly Pair[];
}

/** Path cells per pair id, in drawing order from one endpoint to the other. */
export type Paths = Readonly<Record<string, readonly Cell[]>>;

export interface DragStart {
  pairId: string;
  paths: Paths;
}

export const sameCell = (x: Cell, y: Cell): boolean => x[0] === y[0] && x[1] === y[1];

const adjacent = (x: Cell, y: Cell): boolean => Math.abs(x[0] - y[0]) + Math.abs(x[1] - y[1]) === 1;

const inBounds = (size: number, [row, col]: Cell): boolean =>
  row >= 0 && col >= 0 && row < size && col < size;

export const cellKey = ([row, col]: Cell): string => `${row},${col}`;

/** The pair whose endpoint sits on `cell`, if any. */
export function endpointPair(level: Level, cell: Cell): Pair | undefined {
  return level.pairs.find((p) => sameCell(p.a, cell) || sameCell(p.b, cell));
}

/** The id of the path that currently occupies `cell`, if any. */
export function ownerOf(paths: Paths, cell: Cell): string | undefined {
  return Object.keys(paths).find((id) => paths[id]?.some((c) => sameCell(c, cell)));
}

/** True when the pair's path runs from one endpoint to the other. */
export function isComplete(level: Level, paths: Paths, pairId: string): boolean {
  const pair = level.pairs.find((p) => p.id === pairId);
  const path = paths[pairId];
  const first = path?.[0];
  const last = path?.at(-1);
  if (!pair || !first || !last || path.length < 2) return false;
  return (
    (sameCell(first, pair.a) && sameCell(last, pair.b)) ||
    (sameCell(first, pair.b) && sameCell(last, pair.a))
  );
}

/**
 * Begin drawing at `cell`. From an endpoint, the pair's path restarts there.
 * From a cell already on a path, that path is cut back to end at `cell`, so
 * the player can keep drawing from the middle. Returns null on empty cells.
 */
export function startDrag(level: Level, paths: Paths, cell: Cell): DragStart | null {
  const endpoint = endpointPair(level, cell);
  if (endpoint) {
    return { pairId: endpoint.id, paths: { ...paths, [endpoint.id]: [cell] } };
  }
  const pairId = ownerOf(paths, cell);
  const path = pairId ? paths[pairId] : undefined;
  const index = path?.findIndex((c) => sameCell(c, cell)) ?? -1;
  if (!pairId || !path || index === -1) return null;
  return { pairId, paths: { ...paths, [pairId]: path.slice(0, index + 1) } };
}

/**
 * Move the head of `pairId`'s path onto `cell` if that is one legal step:
 * - stepping onto the path's own earlier cell cuts the path back to it (backtrack);
 * - a cell held by any other path, or another pair's endpoint, is refused (no crossing);
 * - a finished path is fixed until the player backtracks out of it;
 * - reaching this pair's other endpoint finishes the path.
 * Anything else returns `paths` unchanged.
 */
export function extendDrag(level: Level, paths: Paths, pairId: string, cell: Cell): Paths {
  const path = paths[pairId];
  const head = path?.at(-1);
  if (!path || !head || !inBounds(level.size, cell)) return paths;
  if (!adjacent(head, cell)) return paths;

  const own = path.findIndex((c) => sameCell(c, cell));
  if (own !== -1) return { ...paths, [pairId]: path.slice(0, own + 1) };

  if (isComplete(level, paths, pairId)) return paths;
  if (ownerOf(paths, cell)) return paths;

  const endpoint = endpointPair(level, cell);
  if (endpoint && endpoint.id !== pairId) return paths;

  return { ...paths, [pairId]: [...path, cell] };
}

/**
 * Drag toward `target` one step at a time (rows first, then columns), so a
 * pointer that jumps several cells between events still draws every cell it
 * crosses. Stops at the first refused step.
 */
export function dragTo(level: Level, paths: Paths, pairId: string, target: Cell): Paths {
  let next = paths;
  const limit = level.size * level.size * 4;
  for (let step = 0; step < limit; step++) {
    const head = next[pairId]?.at(-1);
    if (!head) break;
    const [hr, hc] = head;
    if (sameCell(head, target)) break;
    const toward: Cell = hr !== target[0] ? [hr + Math.sign(target[0] - hr), hc] : [hr, hc + Math.sign(target[1] - hc)];
    const after = extendDrag(level, next, pairId, toward);
    if (after === next) break;
    next = after;
  }
  return next;
}

/** Every pair is joined and every cell of the grid is covered. */
export function isSolved(level: Level, paths: Paths): boolean {
  if (!level.pairs.every((p) => isComplete(level, paths, p.id))) return false;
  const covered = new Set<string>();
  for (const path of Object.values(paths)) {
    for (const cell of path) covered.add(cellKey(cell));
  }
  return covered.size === level.size * level.size;
}

/**
 * The grid cell under a viewport point, given the element's bounding box.
 * Returns null outside the grid.
 */
export function cellAt(
  size: number,
  rect: { left: number; top: number; width: number; height: number },
  x: number,
  y: number,
): Cell | null {
  if (rect.width <= 0 || rect.height <= 0) return null;
  const col = Math.floor(((x - rect.left) / rect.width) * size);
  const row = Math.floor(((y - rect.top) / rect.height) * size);
  const cell: Cell = [row, col];
  return inBounds(size, cell) ? cell : null;
}
