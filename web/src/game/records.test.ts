import { beforeEach, describe, expect, it } from "vitest";
import { loadRecords, mergeRecords, saveRecords } from "./records";
import { formatTime } from "./LineLinkTopbar";

beforeEach(() => localStorage.clear());

describe("records", () => {
  it("starts empty for a puzzle never solved", () => {
    expect(loadRecords("Puzzle 1")).toEqual({ bestSeconds: null, fewestMoves: null });
  });

  it("round-trips through localStorage per puzzle", () => {
    saveRecords("Puzzle 1", { bestSeconds: 42, fewestMoves: 17 });
    expect(loadRecords("Puzzle 1")).toEqual({ bestSeconds: 42, fewestMoves: 17 });
    expect(loadRecords("Puzzle 2")).toEqual({ bestSeconds: null, fewestMoves: null });
  });

  it("ignores corrupt stored data", () => {
    localStorage.setItem("line-link:records:Puzzle 1", "{not json");
    expect(loadRecords("Puzzle 1")).toEqual({ bestSeconds: null, fewestMoves: null });
  });

  it("keeps each field's own best when merging a solve", () => {
    const prev = { bestSeconds: 30, fewestMoves: 20 };
    expect(mergeRecords(prev, { seconds: 50, moves: 12 })).toEqual({ bestSeconds: 30, fewestMoves: 12 });
    expect(mergeRecords({ bestSeconds: null, fewestMoves: null }, { seconds: 9, moves: 8 })).toEqual({
      bestSeconds: 9,
      fewestMoves: 8,
    });
  });
});

describe("formatTime", () => {
  it("formats minutes and seconds, adding hours past an hour", () => {
    expect(formatTime(0)).toBe("0:00");
    expect(formatTime(65)).toBe("1:05");
    expect(formatTime(3725)).toBe("1:02:05");
  });
});
