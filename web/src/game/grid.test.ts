import { describe, expect, it } from "vitest";
import {
  cellAt,
  cellKey,
  dragTo,
  endpointPair,
  extendDrag,
  isComplete,
  isSolved,
  missingSegment,
  ownerOf,
  segmentCount,
  startDrag,
  type Cell,
  type Level,
  type Paths,
} from "./grid";

// 3×3 grid. Red runs along the top row. Blue starts bottom-left, snakes around the
// middle and the right, and ends bottom-middle. Together they cover all nine cells.
const LEVEL: Level = {
  name: "test",
  size: 3,
  pairs: [
    { id: "red", color: "red", a: [0, 0], b: [0, 2] },
    { id: "blue", color: "blue", a: [2, 0], b: [2, 1] },
  ],
};

const RED: Cell[] = [[0, 0], [0, 1], [0, 2]];
const BLUE: Cell[] = [[2, 0], [1, 0], [1, 1], [1, 2], [2, 2], [2, 1]];
const SOLUTION: Paths = { red: RED, blue: BLUE };

/** Walk `pairId` through `cells` one step at a time, as the pointer would. */
function draw(level: Level, paths: Paths, pairId: string, cells: Cell[]): Paths {
  return cells.reduce((p, cell) => extendDrag(level, p, pairId, cell), paths);
}

describe("startDrag", () => {
  it("starts a fresh path from an endpoint", () => {
    expect(startDrag(LEVEL, {}, [0, 0])).toEqual({ pairId: "red", paths: { red: [[0, 0]] } });
  });

  it("restarts an existing path when pressed on its endpoint", () => {
    expect(startDrag(LEVEL, SOLUTION, [0, 2])?.paths.red).toEqual([[0, 2]]);
  });

  it("cuts a path back to the pressed cell when pressed mid-path", () => {
    const paths = { blue: [[2, 0], [1, 0], [1, 1], [1, 2]] } as Paths;
    expect(startDrag(LEVEL, paths, [1, 0])).toEqual({ pairId: "blue", paths: { blue: [[2, 0], [1, 0]] } });
  });

  it("returns null on an empty cell", () => {
    expect(startDrag(LEVEL, {}, [1, 1])).toBeNull();
  });
});

describe("extendDrag", () => {
  it("extends the head onto an adjacent empty cell", () => {
    expect(extendDrag(LEVEL, { red: [[0, 0]] }, "red", [0, 1]).red).toEqual([[0, 0], [0, 1]]);
  });

  it("ignores a cell that is not adjacent to the head", () => {
    const paths = { red: [[0, 0]] } as Paths;
    expect(extendDrag(LEVEL, paths, "red", [1, 1])).toBe(paths);
  });

  it("ignores cells outside the grid", () => {
    const paths = { red: [[0, 2]] } as Paths;
    expect(extendDrag(LEVEL, paths, "red", [0, 3])).toBe(paths);
  });

  it("refuses to cross another path", () => {
    // Red's head is (0,1); the step down to (1,1) is blue's cell, so it is refused.
    const blocked = { red: [[0, 1]], blue: [[2, 0], [1, 0], [1, 1]] } as Paths;
    expect(extendDrag(LEVEL, blocked, "red", [1, 1])).toBe(blocked);
  });

  it("refuses to enter another pair's endpoint", () => {
    // Red's head is (1,1); blue's endpoint (2,1) is directly below it.
    const paths = { red: [[1, 1]] } as Paths;
    expect(extendDrag(LEVEL, paths, "red", [2, 1])).toBe(paths);
  });

  it("may enter its own endpoint", () => {
    const paths = { red: [[0, 1]] } as Paths;
    expect(extendDrag(LEVEL, paths, "red", [0, 0])).toEqual({ red: [[0, 1], [0, 0]] });
  });

  it("finishes a path when it reaches its own other endpoint", () => {
    const paths = draw(LEVEL, { red: [[0, 0]] }, "red", [[0, 1], [0, 2]]);
    expect(paths.red).toEqual([[0, 0], [0, 1], [0, 2]]);
    expect(isComplete(LEVEL, paths, "red")).toBe(true);
  });

  it("does not extend a finished path past its endpoint", () => {
    const done = { red: [[0, 0], [0, 1], [0, 2]] } as Paths;
    expect(extendDrag(LEVEL, done, "red", [1, 2])).toBe(done);
  });

  it("backtracks when the previous cell is entered again", () => {
    const paths = draw(LEVEL, { blue: [[2, 0]] }, "blue", [[1, 0], [1, 1]]);
    expect(extendDrag(LEVEL, paths, "blue", [1, 0]).blue).toEqual([[2, 0], [1, 0]]);
  });

  it("backtracks out of a finished path", () => {
    expect(extendDrag(LEVEL, SOLUTION, "red", [0, 1]).red).toEqual([[0, 0], [0, 1]]);
  });

  it("cuts back to an earlier own cell, not only the previous one", () => {
    // A loop around a 2×2 square: the head at (1,0) touches the start (0,0), two steps back in the path.
    const loop: Level = { name: "loop", size: 3, pairs: [{ id: "x", color: "x", a: [0, 0], b: [2, 2] }] };
    const paths = { x: [[0, 0], [0, 1], [1, 1], [1, 0]] } as Paths;
    expect(extendDrag(loop, paths, "x", [0, 0]).x).toEqual([[0, 0]]);
  });
});

describe("dragTo", () => {
  it("fills every cell crossed when the pointer jumps several cells", () => {
    expect(dragTo(LEVEL, { red: [[0, 0]] }, "red", [0, 2]).red).toEqual([[0, 0], [0, 1], [0, 2]]);
  });

  it("stops at the first refused step", () => {
    // Red at (0,1) wants to go down to (1,1), which blue holds, so nothing changes.
    const blocked = { red: [[0, 1]], blue: [[2, 0], [1, 0], [1, 1]] } as Paths;
    expect(dragTo(LEVEL, blocked, "red", [2, 1]).red).toEqual([[0, 1]]);
  });

  it("stops when the path completes, even if the pointer keeps going", () => {
    // Blue reaches its endpoint (2,1) and cannot continue to (2,2) past it.
    expect(dragTo(LEVEL, { blue: [[2, 0]] }, "blue", [2, 2]).blue).toEqual([[2, 0], [2, 1]]);
  });

  it("does nothing for a pair with no path", () => {
    const paths: Paths = {};
    expect(dragTo(LEVEL, paths, "red", [0, 2])).toBe(paths);
  });
});

describe("isSolved", () => {
  it("accepts a path set that joins every pair and fills every cell", () => {
    expect(isSolved(LEVEL, SOLUTION)).toBe(true);
  });

  it("rejects an incomplete pair", () => {
    expect(isSolved(LEVEL, { red: RED, blue: [[2, 0], [1, 0]] })).toBe(false);
  });

  it("rejects a solution that leaves cells empty", () => {
    // Both pairs are joined, but only 5 of the 9 cells are covered.
    expect(isSolved(LEVEL, { red: [[0, 0], [0, 1], [0, 2]], blue: [[2, 0], [2, 1]] })).toBe(false);
  });
});

describe("helpers", () => {
  it("finds the pair owning an endpoint or a path cell", () => {
    expect(endpointPair(LEVEL, [2, 1])?.id).toBe("blue");
    expect(endpointPair(LEVEL, [1, 1])).toBeUndefined();
    expect(ownerOf(SOLUTION, [1, 1])).toBe("blue");
    expect(ownerOf({}, [1, 1])).toBeUndefined();
  });

  it("keys cells as row,col", () => {
    expect(cellKey([3, 4])).toBe("3,4");
  });

  it("maps a viewport point to a grid cell", () => {
    const rect = { left: 10, top: 20, width: 300, height: 300 };
    expect(cellAt(3, rect, 10, 20)).toEqual([0, 0]);
    expect(cellAt(3, rect, 10 + 250, 20 + 150)).toEqual([1, 2]);
    expect(cellAt(3, rect, 9, 20)).toBeNull();
    expect(cellAt(3, rect, 310, 20)).toBeNull();
    expect(cellAt(3, { ...rect, width: 0 }, 10, 20)).toBeNull();
  });
});

describe("segmentCount", () => {
  it("counts one segment per step between consecutive cells", () => {
    expect(segmentCount({})).toBe(0);
    expect(segmentCount({ a: [[0, 0]] })).toBe(0);
    expect(segmentCount({ a: [[0, 0], [0, 1], [0, 2]], b: [[1, 0], [1, 1]] })).toBe(3);
  });
});

describe("missingSegment", () => {
  const solution: Paths = { a: [[0, 0], [0, 1], [0, 2]] };

  it("returns the first solution step the board does not draw", () => {
    expect(missingSegment(solution, {})).toEqual([[0, 0], [0, 1]]);
    expect(missingSegment(solution, { a: [[0, 0], [0, 1]] })).toEqual([[0, 1], [0, 2]]);
  });

  it("accepts a step drawn in either direction", () => {
    expect(missingSegment(solution, { a: [[0, 2], [0, 1], [0, 0]] })).toBeNull();
  });

  it("returns null once the solution is fully drawn", () => {
    expect(missingSegment(solution, { a: [[0, 0], [0, 1], [0, 2]] })).toBeNull();
  });
});
