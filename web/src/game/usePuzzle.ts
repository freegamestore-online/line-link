import { useCallback, useRef, useState } from "react";
import { dragTo, isSolved, startDrag, type Cell, type Level, type Paths } from "./grid";

/**
 * Puzzle state for one level. Pointer handlers feed cells in: `begin` on
 * press, `drag` on every move while held, `end` on release.
 */
export function usePuzzle(level: Level) {
  const [paths, setPaths] = useState<Paths>({});
  const activePair = useRef<string | null>(null);

  const begin = useCallback(
    (cell: Cell) => {
      setPaths((prev) => {
        const start = startDrag(level, prev, cell);
        activePair.current = start?.pairId ?? null;
        return start ? start.paths : prev;
      });
    },
    [level],
  );

  const drag = useCallback(
    (cell: Cell) => {
      const pairId = activePair.current;
      if (!pairId) return;
      setPaths((prev) => dragTo(level, prev, pairId, cell));
    },
    [level],
  );

  const end = useCallback(() => {
    activePair.current = null;
  }, []);

  const reset = useCallback(() => {
    activePair.current = null;
    setPaths({});
  }, []);

  return { paths, solved: isSolved(level, paths), begin, drag, end, reset };
}
