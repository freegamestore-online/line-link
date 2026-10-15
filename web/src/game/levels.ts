import type { Cell, Level, Pair } from "./grid";

const PALETTE = ["#ef4444", "#3b82f6", "#22c55e", "#eab308", "#a855f7", "#f97316", "#14b8a6"];

/**
 * Build a level from its solution. Each solution path is one pair: its first
 * and last cells become the dots, so every level is solvable by construction.
 */
export function levelFromSolution(name: string, size: number, solution: readonly (readonly Cell[])[]): Level {
  const pairs: Pair[] = solution.map((cells, i) => {
    const a = cells[0];
    const b = cells.at(-1);
    if (!a || !b) throw new Error(`${name}: solution path ${i} is empty`);
    return { id: `p${i}`, color: PALETTE[i % PALETTE.length] ?? "#000000", a, b };
  });
  return { name, size, pairs };
}

const columns = (size: number): Cell[][] =>
  Array.from({ length: size }, (_, col) => Array.from({ length: size }, (_, row): Cell => [row, col]));

const STARTER_5 = [
  [[0, 0], [1, 0], [2, 0], [3, 0], [4, 0]],
  [[0, 1], [1, 1], [2, 1], [3, 1], [4, 1]],
  [[0, 2], [0, 3], [1, 3], [1, 2], [2, 2], [2, 3], [3, 3], [3, 2], [4, 2], [4, 3]],
  [[0, 4], [1, 4], [2, 4], [3, 4], [4, 4]],
] as Cell[][];

/** A level with the solution it was built from. The solution covers every cell exactly once. */
export interface LevelSource {
  level: Level;
  solution: Cell[][];
}

export const STARTER: LevelSource = { level: levelFromSolution("Starter 5×5", 5, STARTER_5), solution: STARTER_5 };
export const COLUMNS_7: LevelSource = { level: levelFromSolution("Columns 7×7", 7, columns(7)), solution: columns(7) };

export const LEVEL_SOURCES: LevelSource[] = [STARTER, COLUMNS_7];
export const LEVELS: Level[] = LEVEL_SOURCES.map((s) => s.level);
