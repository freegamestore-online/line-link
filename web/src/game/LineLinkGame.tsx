import { GameButton } from "@freegamestore/games";
import type { Level } from "./grid";
import { PuzzleGrid } from "./PuzzleGrid";
import { usePuzzle } from "./usePuzzle";

/** One level on screen: the board, a reset control, and the solved message. */
export function LineLinkGame({ level }: { level: Level }) {
  const { paths, solved, begin, drag, end, reset } = usePuzzle(level);

  return (
    <div className="flex flex-col items-center justify-center h-full gap-4 p-4">
      <PuzzleGrid level={level} paths={paths} onBegin={begin} onDrag={drag} onEnd={end} />
      <p aria-live="polite" className="font-semibold" style={{ color: "var(--accent)" }}>
        {solved ? "Solved!" : " "}
      </p>
      <GameButton variant="secondary" onClick={reset}>
        Reset
      </GameButton>
    </div>
  );
}
