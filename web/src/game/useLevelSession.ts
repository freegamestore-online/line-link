import { useCallback, useEffect, useRef, useState } from "react";
import { missingSegment, segmentCount, type Cell, type Level, type Paths } from "./grid";
import { loadRecords, mergeRecords, saveRecords, type Records } from "./records";
import { findSolutions } from "./solver";
import { usePuzzle } from "./usePuzzle";
import { useElapsed } from "../hooks/useElapsed";

export const HINT_LIMIT = 3;

/**
 * One puzzle attempt: the board plus its move count, timer, hints and the
 * best result saved for this puzzle. A move is a segment the paths gain, so
 * cutting a path back is free and drawing it again counts once more.
 * The clock starts on the first move and stops when the puzzle is solved.
 * Reset starts a new attempt but does not refund hints.
 */
export function useLevelSession(level: Level) {
  const { paths, solved, begin: beginCell, drag, end, reset: resetBoard } = usePuzzle(level);

  const [moves, setMoves] = useState(0);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [stoppedAt, setStoppedAt] = useState<number | null>(null);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [hint, setHint] = useState<readonly [Cell, Cell] | null>(null);
  const [records, setRecords] = useState<Records>(() => loadRecords(level.name));

  const segments = segmentCount(paths);
  const counted = useRef(0);
  const solution = useRef<Paths | null | undefined>(undefined);

  useEffect(() => {
    const gained = segments - counted.current;
    counted.current = segments;
    if (gained <= 0) return;
    setMoves((m) => m + gained);
    setStartedAt((s) => s ?? Date.now());
  }, [segments]);

  const seconds = useElapsed(startedAt, stoppedAt);

  useEffect(() => {
    if (!solved || startedAt === null) return;
    const now = Date.now();
    setStoppedAt(now);
    const next = mergeRecords(records, { seconds: Math.floor((now - startedAt) / 1000), moves });
    setRecords(next);
    saveRecords(level.name, next);
    // Runs once per solve; the other values are read at that moment.
  }, [solved]);

  const begin = useCallback(
    (cell: Cell) => {
      setHint(null);
      beginCell(cell);
    },
    [beginCell],
  );

  const reset = useCallback(() => {
    resetBoard();
    counted.current = 0;
    setMoves(0);
    setStartedAt(null);
    setStoppedAt(null);
    setHint(null);
  }, [resetBoard]);

  const hintsLeft = HINT_LIMIT - hintsUsed;

  /** Highlight one step of the solution the board does not draw yet. */
  const showHint = useCallback(() => {
    if (hintsLeft <= 0 || solved) return;
    solution.current ??= findSolutions(level, 1)[0] ?? null;
    if (!solution.current) return;
    const step = missingSegment(solution.current, paths);
    if (!step) return;
    setHintsUsed((h) => h + 1);
    setHint(step);
  }, [hintsLeft, solved, level, paths]);

  return {
    level,
    paths,
    solved,
    moves,
    seconds,
    hint,
    hintsLeft,
    records,
    begin,
    drag,
    end,
    reset,
    showHint,
  };
}

export type LevelSession = ReturnType<typeof useLevelSession>;
