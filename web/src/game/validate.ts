import { sameCell, type Cell, type Level } from "./grid";
import { findSolutions } from "./solver";

export const MIN_SIZE = 5;
export const MAX_SIZE = 9;

const inside = (size: number, [r, c]: Cell) => r >= 0 && c >= 0 && r < size && c < size;

/**
 * Problems that stop a puzzle from being playable: a bad board, or not exactly
 * one solution. An empty list means the puzzle is fine.
 */
export function validatePuzzle(level: Level): string[] {
  const problems: string[] = [];
  if (!Number.isInteger(level.size) || level.size < MIN_SIZE || level.size > MAX_SIZE) {
    problems.push(`size ${level.size} is outside ${MIN_SIZE}–${MAX_SIZE}`);
  }

  const ids = new Set<string>();
  const used = new Set<string>();
  for (const pair of level.pairs) {
    if (ids.has(pair.id)) problems.push(`pair id ${pair.id} is used twice`);
    ids.add(pair.id);
    if (sameCell(pair.a, pair.b)) problems.push(`pair ${pair.id} has both dots on one cell`);
    for (const cell of [pair.a, pair.b]) {
      if (!inside(level.size, cell)) {
        problems.push(`pair ${pair.id} has a dot off the board at ${cell}`);
      } else if (used.has(`${cell[0]},${cell[1]}`)) {
        problems.push(`two dots share the cell ${cell}`);
      }
      used.add(`${cell[0]},${cell[1]}`);
    }
  }
  // The solver assumes a well-formed board, so stop here if the board is broken.
  if (problems.length > 0) return problems;

  const solutions = findSolutions(level, 2).length;
  if (solutions === 0) problems.push("has no solution");
  if (solutions > 1) problems.push("has more than one solution");
  return problems;
}

/** The levels that fail validation, with their problems. */
export function validatePack(levels: readonly Level[]): { name: string; problems: string[] }[] {
  return levels
    .map((level) => ({ name: level.name, problems: validatePuzzle(level) }))
    .filter((result) => result.problems.length > 0);
}
