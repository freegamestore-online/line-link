import { GameButton } from "@freegamestore/games";
import type { Level } from "./grid";
import { PuzzleGrid } from "./PuzzleGrid";
import { usePuzzle } from "./usePuzzle";

interface LineLinkGameProps {
  level: Level;
  /** Shown once the puzzle is solved, when there is a next puzzle to go to. */
  onNext?: () => void;
}

/** One puzzle on screen: the board, a reset control, and the solved message. */
export function LineLinkGame({ level, onNext }: LineLinkGameProps) {
  const { paths, solved, begin, drag, end, reset } = usePuzzle(level);

  return (
    <div className="flex flex-col items-center justify-center h-full gap-4 p-4">
      <PuzzleGrid level={level} paths={paths} onBegin={begin} onDrag={drag} onEnd={end} />
      <p aria-live="polite" className="font-semibold" style={{ color: "var(--accent)" }}>
        {solved ? "Solved!" : " "}
      </p>
      <div className="flex gap-3">
        <GameButton variant="secondary" onClick={reset}>
          Reset
        </GameButton>
        {solved && onNext && <GameButton onClick={onNext}>Next puzzle</GameButton>}
      </div>
    </div>
  );
}
