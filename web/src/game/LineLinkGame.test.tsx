import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Cell } from "./grid";
import { STARTER } from "./levels";
import { LineLinkGame } from "./LineLinkGame";
import { LineLinkTopbar } from "./LineLinkTopbar";
import { PuzzleGrid } from "./PuzzleGrid";
import { HINT_LIMIT, useLevelSession } from "./useLevelSession";

const CELL = 100; // a 5×5 board drawn 500px wide, so each cell is 100px
const SIZE = 5;
const { level, solution } = STARTER;

/** Centre of a cell in viewport pixels, matching the mocked bounding box. */
const at = ([row, col]: Cell) => ({ clientX: (col + 0.5) * CELL, clientY: (row + 0.5) * CELL });

function drawPath(svg: Element, [first, ...rest]: readonly Cell[]) {
  if (!first) return;
  fireEvent.pointerDown(svg, { ...at(first), pointerId: 1 });
  for (const cell of rest) fireEvent.pointerMove(svg, { ...at(cell), pointerId: 1 });
  fireEvent.pointerUp(svg, { pointerId: 1 });
}

/** The HUD and the board together, as App mounts them, for one puzzle attempt. */
function Game({ onNext }: { onNext?: () => void }) {
  const session = useLevelSession(level);
  return (
    <>
      <LineLinkTopbar session={session} />
      <LineLinkGame session={session} onNext={onNext} />
    </>
  );
}

const stat = (label: string) => screen.getByText(label).parentElement?.textContent ?? "";

beforeEach(() => {
  localStorage.clear();
  // jsdom has no layout; give the board a fixed box so pixel positions map to cells.
  vi.spyOn(SVGElement.prototype, "getBoundingClientRect").mockReturnValue({
    left: 0, top: 0, width: SIZE * CELL, height: SIZE * CELL, right: SIZE * CELL, bottom: SIZE * CELL, x: 0, y: 0, toJSON: () => ({}),
  } as DOMRect);
  // jsdom lacks pointer capture; the board only needs it to exist.
  Element.prototype.setPointerCapture ??= () => {};
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("PuzzleGrid", () => {
  it("draws one dot per endpoint and a labelled board", () => {
    render(<PuzzleGrid level={level} paths={{}} onBegin={() => {}} onDrag={() => {}} onEnd={() => {}} />);
    expect(screen.getByRole("img", { name: /Starter 5×5/ })).toBeTruthy();
    expect(screen.getAllByTestId("dot")).toHaveLength(level.pairs.length * 2);
  });

  it("reports the cell under the pointer on press, move and release", () => {
    const onBegin = vi.fn();
    const onDrag = vi.fn();
    const onEnd = vi.fn();
    render(<PuzzleGrid level={level} paths={{}} onBegin={onBegin} onDrag={onDrag} onEnd={onEnd} />);
    const svg = screen.getByRole("img");
    drawPath(svg, [[0, 0], [1, 0]]);
    expect(onBegin).toHaveBeenCalledWith([0, 0]);
    expect(onDrag).toHaveBeenNthCalledWith(1, [1, 0]);
    expect(onEnd).toHaveBeenCalled();
  });

  it("ignores pointer positions outside the board", () => {
    const onBegin = vi.fn();
    render(<PuzzleGrid level={level} paths={{}} onBegin={onBegin} onDrag={() => {}} onEnd={() => {}} />);
    fireEvent.pointerDown(screen.getByRole("img"), { clientX: -10, clientY: 50, pointerId: 1 });
    expect(onBegin).not.toHaveBeenCalled();
  });
});

describe("LineLinkGame", () => {
  it("shows the solved message once every pair is joined and every cell is filled", () => {
    render(<Game />);
    const svg = screen.getByRole("img");
    expect(screen.queryByText("Solved!")).toBeNull();

    for (const path of solution) drawPath(svg, path);

    expect(screen.getByText("Solved!")).toBeTruthy();
  });

  it("refuses a drag that would cross a finished path", () => {
    const { container } = render(<Game />);
    const svg = screen.getByRole("img");
    // Red (column 0) is drawn in full. Blue starts at (0,1) and tries to step onto red's (0,0).
    drawPath(svg, solution[0] ?? []);
    expect(container.querySelectorAll("polyline")).toHaveLength(1);
    drawPath(svg, [[0, 1], [0, 0]]);
    expect(container.querySelectorAll("polyline")).toHaveLength(1);
  });

  it("clears the board on Reset", () => {
    render(<Game />);
    const svg = screen.getByRole("img");
    for (const path of solution) drawPath(svg, path);
    expect(screen.getByText("Solved!")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Reset" }));
    expect(screen.queryByText("Solved!")).toBeNull();
  });

  it("counts a move for every segment the paths gain", () => {
    render(<Game />);
    const svg = screen.getByRole("img");
    expect(stat("Moves")).toContain("0");
    drawPath(svg, solution[0] ?? []);
    expect(stat("Moves")).toContain(String((solution[0]?.length ?? 1) - 1));
  });

  it("starts the clock on the first move and stops it when solved", () => {
    vi.useFakeTimers();
    try {
      render(<Game />);
      const svg = screen.getByRole("img");
      expect(stat("Time")).toContain("0:00");
      act(() => vi.advanceTimersByTime(5000));
      expect(stat("Time")).toContain("0:00");

      drawPath(svg, solution[0] ?? []);
      act(() => vi.advanceTimersByTime(65_000));
      expect(stat("Time")).toContain("1:05");

      for (const path of solution.slice(1)) drawPath(svg, path);
      expect(screen.getByText("Solved!")).toBeTruthy();
      act(() => vi.advanceTimersByTime(60_000));
      expect(stat("Time")).toContain("1:05");
    } finally {
      vi.useRealTimers();
    }
  });

  it("saves the best time and fewest moves for the puzzle when solved", () => {
    render(<Game />);
    const svg = screen.getByRole("img");
    for (const path of solution) drawPath(svg, path);
    const saved = JSON.parse(localStorage.getItem(`line-link:records:${level.name}`) ?? "{}");
    expect(saved.fewestMoves).toBeGreaterThan(0);
    expect(saved.bestSeconds).toBe(0);
    expect(screen.getByText(/Best 0:00 · fewest/)).toBeTruthy();
  });

  it("keeps the earlier record when a later solve is no better", () => {
    localStorage.setItem(
      `line-link:records:${level.name}`,
      JSON.stringify({ bestSeconds: 0, fewestMoves: 1, bestStars: 3 }),
    );
    render(<Game />);
    const svg = screen.getByRole("img");
    for (const path of solution) drawPath(svg, path);
    expect(JSON.parse(localStorage.getItem(`line-link:records:${level.name}`) ?? "{}")).toEqual({
      bestSeconds: 0,
      fewestMoves: 1,
      bestStars: 3,
    });
  });

  it(`highlights one solution step per hint and stops after ${HINT_LIMIT}`, () => {
    const { container } = render(<Game />);
    const hint = screen.getByRole("button", { name: /^Hint/ });
    for (let i = 0; i < HINT_LIMIT; i++) fireEvent.click(hint);
    expect(container.querySelectorAll('[data-testid="hint"]')).toHaveLength(1);
    expect(hint.textContent).toBe("Hint (0)");
    expect((hint as HTMLButtonElement).disabled).toBe(true);
  });

  it("highlights a step the board does not already draw", () => {
    const { container } = render(<Game />);
    const svg = screen.getByRole("img");
    drawPath(svg, solution[0] ?? []);
    fireEvent.click(screen.getByRole("button", { name: /^Hint/ }));
    const line = container.querySelector('[data-testid="hint"]');
    expect(line).toBeTruthy();
    // Column 0 is already drawn, so the first hint must come from another path.
    expect(line?.getAttribute("x1")).not.toBe("0.5");
  });

  it("keeps hints used across Reset but clears moves and the highlight", () => {
    const { container } = render(<Game />);
    const svg = screen.getByRole("img");
    drawPath(svg, solution[0] ?? []);
    fireEvent.click(screen.getByRole("button", { name: /^Hint/ }));
    fireEvent.click(screen.getByRole("button", { name: "Reset" }));
    expect(stat("Moves")).toContain("0");
    expect(screen.getByRole("button", { name: `Hint (${HINT_LIMIT - 1})` })).toBeTruthy();
    expect(container.querySelector('[data-testid="hint"]')).toBeNull();
  });

  it("shows a win screen with stars, time and moves once solved", () => {
    vi.useFakeTimers();
    try {
      render(<Game />);
      const svg = screen.getByRole("img");
      drawPath(svg, solution[0] ?? []);
      act(() => vi.advanceTimersByTime(10_000));
      for (const path of solution.slice(1)) drawPath(svg, path);
      expect(screen.getByRole("status").textContent).toContain("Solved!");
      // 5×5 par is 75s and no hints were used, so a 10s solve earns three stars.
      expect(screen.getByText("3 of 3 stars")).toBeTruthy();
      expect(screen.getByText(/Time 0:10 · Moves \d+ · Hints 0\/3/)).toBeTruthy();
    } finally {
      vi.useRealTimers();
    }
  });

  it("drops two stars for a solve that used a hint", () => {
    vi.useFakeTimers();
    try {
      render(<Game />);
      fireEvent.click(screen.getByRole("button", { name: /^Hint/ }));
      const svg = screen.getByRole("img");
      for (const path of solution) drawPath(svg, path);
      expect(screen.getByText("2 of 3 stars")).toBeTruthy();
    } finally {
      vi.useRealTimers();
    }
  });
});
