import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Cell } from "./grid";
import { STARTER } from "./levels";
import { LineLinkGame } from "./LineLinkGame";
import { PuzzleGrid } from "./PuzzleGrid";

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

beforeEach(() => {
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
    render(<LineLinkGame level={level} />);
    const svg = screen.getByRole("img");
    expect(screen.queryByText("Solved!")).toBeNull();

    for (const path of solution) drawPath(svg, path);

    expect(screen.getByText("Solved!")).toBeTruthy();
  });

  it("refuses a drag that would cross a finished path", () => {
    const { container } = render(<LineLinkGame level={level} />);
    const svg = screen.getByRole("img");
    // Red (column 0) is drawn in full. Blue starts at (0,1) and tries to step onto red's (0,0).
    drawPath(svg, solution[0] ?? []);
    expect(container.querySelectorAll("polyline")).toHaveLength(1);
    drawPath(svg, [[0, 1], [0, 0]]);
    expect(container.querySelectorAll("polyline")).toHaveLength(1);
  });

  it("clears the board on Reset", () => {
    render(<LineLinkGame level={level} />);
    const svg = screen.getByRole("img");
    for (const path of solution) drawPath(svg, path);
    expect(screen.getByText("Solved!")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Reset" }));
    expect(screen.queryByText("Solved!")).toBeNull();
  });
});
