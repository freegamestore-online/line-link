import { beforeEach, describe, expect, it } from "vitest";
import { loadRecords, mergeRecords, saveRecords } from "./records";
import { formatTime } from "./LineLinkTopbar";
import { starRating } from "./stars";

beforeEach(() => localStorage.clear());

describe("records", () => {
  it("starts empty for a puzzle never solved", () => {
    expect(loadRecords("Puzzle 1")).toEqual({ bestSeconds: null, fewestMoves: null, bestStars: null });
  });

  it("round-trips through localStorage per puzzle", () => {
    saveRecords("Puzzle 1", { bestSeconds: 42, fewestMoves: 17, bestStars: 2 });
    expect(loadRecords("Puzzle 1")).toEqual({ bestSeconds: 42, fewestMoves: 17, bestStars: 2 });
    expect(loadRecords("Puzzle 2")).toEqual({ bestSeconds: null, fewestMoves: null, bestStars: null });
  });

  it("ignores corrupt stored data", () => {
    localStorage.setItem("line-link:records:Puzzle 1", "{not json");
    expect(loadRecords("Puzzle 1")).toEqual({ bestSeconds: null, fewestMoves: null, bestStars: null });
  });

  it("keeps each field's own best when merging a solve", () => {
    const prev = { bestSeconds: 30, fewestMoves: 20, bestStars: 2 };
    expect(mergeRecords(prev, { seconds: 50, moves: 12, stars: 3 })).toEqual({
      bestSeconds: 30,
      fewestMoves: 12,
      bestStars: 3,
    });
    expect(mergeRecords({ bestSeconds: null, fewestMoves: null, bestStars: null }, { seconds: 9, moves: 8, stars: 1 })).toEqual({
      bestSeconds: 9,
      fewestMoves: 8,
      bestStars: 1,
    });
  });
});

describe("starRating", () => {
  it("gives three stars for an unhinted solve within par", () => {
    expect(starRating({ seconds: 75, hintsUsed: 0, size: 5 })).toBe(3);
  });

  it("gives two stars for any hint, or for a solve within twice par", () => {
    expect(starRating({ seconds: 10, hintsUsed: 1, size: 5 })).toBe(2);
    expect(starRating({ seconds: 76, hintsUsed: 0, size: 5 })).toBe(2);
    expect(starRating({ seconds: 150, hintsUsed: 0, size: 5 })).toBe(2);
  });

  it("gives one star otherwise", () => {
    expect(starRating({ seconds: 151, hintsUsed: 0, size: 5 })).toBe(1);
  });

  it("scales par with the grid", () => {
    expect(starRating({ seconds: 243, hintsUsed: 0, size: 9 })).toBe(3);
    expect(starRating({ seconds: 244, hintsUsed: 0, size: 9 })).toBe(2);
  });
});

describe("formatTime", () => {
  it("formats minutes and seconds, adding hours past an hour", () => {
    expect(formatTime(0)).toBe("0:00");
    expect(formatTime(65)).toBe("1:05");
    expect(formatTime(3725)).toBe("1:02:05");
  });
});
