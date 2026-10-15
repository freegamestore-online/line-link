import { describe, expect, it } from "vitest";
import { LEVEL_SOURCES, LEVELS } from "./levels";
import { isSolved, type Paths } from "./grid";

describe("levels", () => {
  it("are sized within the 5×5 to 9×9 range the design calls for", () => {
    for (const level of LEVELS) {
      expect(level.size).toBeGreaterThanOrEqual(5);
      expect(level.size).toBeLessThanOrEqual(9);
    }
  });

  it.each(LEVEL_SOURCES.map((s) => [s.level.name, s] as const))("%s is solved by its own solution", (_name, { level, solution }) => {
    const paths: Paths = Object.fromEntries(level.pairs.map((pair, i) => [pair.id, solution[i] ?? []]));
    expect(isSolved(level, paths)).toBe(true);
  });

  it.each(LEVEL_SOURCES.map((s) => [s.level.name, s] as const))("%s has dots at its solution endpoints", (_name, { level, solution }) => {
    level.pairs.forEach((pair, i) => {
      const path = solution[i] ?? [];
      expect(pair.a).toEqual(path[0]);
      expect(pair.b).toEqual(path.at(-1));
    });
  });

  it.each(LEVELS.map((level) => [level.name, level] as const))("%s has distinct dot colours", (_name, level) => {
    const colours = level.pairs.map((p) => p.color);
    expect(new Set(colours).size).toBe(colours.length);
  });
});
