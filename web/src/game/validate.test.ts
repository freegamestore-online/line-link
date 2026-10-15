import { describe, expect, it } from "vitest";
import { PACK } from "./pack";
import { validatePack, validatePuzzle } from "./validate";
import { STARTER } from "./levels";
import type { Level } from "./grid";

describe("validatePuzzle rejects puzzles with more than one solution", () => {
  it("flags the 5×5 starter, which has several solutions", () => {
    expect(validatePuzzle(STARTER.level)).toEqual(["has more than one solution"]);
  });

  it("does not report a multiple-solution problem for a unique puzzle", () => {
    expect(validatePuzzle(PACK[0]!)).toEqual([]);
  });
});

describe("validatePuzzle rejects unplayable puzzles", () => {
  it("reports no solution when the dots cannot cover the board", () => {
    const lone: Level = { name: "lone", size: 5, pairs: [{ id: "a", color: "red", a: [0, 0], b: [0, 1] }] };
    expect(validatePuzzle(lone)).toEqual(["has no solution"]);
  });

  it("rejects a board outside the 5–9 size range", () => {
    const small: Level = { name: "small", size: 4, pairs: [{ id: "a", color: "red", a: [0, 0], b: [0, 1] }] };
    expect(validatePuzzle(small)).toEqual(["size 4 is outside 5–9"]);
  });

  it("rejects a dot off the board", () => {
    const off: Level = { name: "off", size: 5, pairs: [{ id: "a", color: "red", a: [0, 0], b: [5, 0] }] };
    expect(validatePuzzle(off)).toEqual(["pair a has a dot off the board at 5,0"]);
  });

  it("rejects two dots on one cell", () => {
    const shared: Level = {
      name: "shared",
      size: 5,
      pairs: [
        { id: "a", color: "red", a: [0, 0], b: [0, 1] },
        { id: "b", color: "blue", a: [0, 1], b: [0, 2] },
      ],
    };
    expect(validatePuzzle(shared)).toEqual(["two dots share the cell 0,1"]);
  });
});

describe("the bundled pack", () => {
  it("has at least 20 levels, each 5×5 to 9×9", () => {
    expect(PACK.length).toBeGreaterThanOrEqual(20);
    for (const level of PACK) {
      expect(level.size).toBeGreaterThanOrEqual(5);
      expect(level.size).toBeLessThanOrEqual(9);
    }
  });

  it("has exactly one solution per puzzle", () => {
    expect(validatePack(PACK)).toEqual([]);
  });

  it("is caught by the pack validator when one puzzle gains a second solution", () => {
    const failing = validatePack([PACK[0]!, STARTER.level]);
    expect(failing).toEqual([{ name: STARTER.level.name, problems: ["has more than one solution"] }]);
  });
});
