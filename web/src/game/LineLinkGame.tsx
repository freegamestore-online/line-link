import { GameButton } from "@freegamestore/games";
import { PuzzleGrid } from "./PuzzleGrid";
import { formatTime } from "./LineLinkTopbar";
import type { LevelSession } from "./useLevelSession";

interface LineLinkGameProps {
  session: LevelSession;
  /** Shown once the puzzle is solved, when there is a next puzzle to go to. */
  onNext?: () => void;
}

/** One puzzle on screen: the board, a reset control, and the solved message. */
export function LineLinkGame({ session, onNext }: LineLinkGameProps) {
  const { level, paths, solved, hint, records, begin, drag, end, reset } = session;

  return (
    <div className="flex flex-col items-center justify-center h-full gap-4 p-4">
      <PuzzleGrid level={level} paths={paths} onBegin={begin} onDrag={drag} onEnd={end} hint={hint} />
      <div aria-live="polite" className="text-center">
        <p className="font-semibold" style={{ color: "var(--accent)" }}>
          {solved ? "Solved!" : " "}
        </p>
        {records.bestSeconds !== null && records.fewestMoves !== null && (
          <p className="text-sm">
            Best {formatTime(records.bestSeconds)} · fewest {records.fewestMoves} moves
          </p>
        )}
      </div>
      <div className="flex gap-3">
        <GameButton variant="secondary" onClick={reset}>
          Reset
        </GameButton>
        {solved && onNext && <GameButton onClick={onNext}>Next puzzle</GameButton>}
      </div>
    </div>
  );
}
