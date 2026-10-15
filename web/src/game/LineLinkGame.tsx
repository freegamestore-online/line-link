import { GameButton } from "@freegamestore/games";
import { PuzzleGrid } from "./PuzzleGrid";
import { formatTime } from "./LineLinkTopbar";
import { HINT_LIMIT, type LevelSession, type SolveResult } from "./useLevelSession";
import type { Records } from "./records";

interface LineLinkGameProps {
  session: LevelSession;
  /** Offered on the win screen, when there is a next puzzle to go to. */
  onNext?: () => void;
}

/** One puzzle on screen: the board, a reset control, and the win screen once solved. */
export function LineLinkGame({ session, onNext }: LineLinkGameProps) {
  const { level, paths, solved, hint, result, records, begin, drag, end, reset } = session;

  return (
    <div className="flex flex-col landscape:flex-row items-center justify-center h-full gap-4 p-4">
      <div className="relative w-full landscape:w-auto flex justify-center">
        <PuzzleGrid level={level} paths={paths} onBegin={begin} onDrag={drag} onEnd={end} hint={hint} />
        {solved && result && <WinScreen result={result} records={records} onNext={onNext} />}
      </div>
      <div className="flex flex-col items-center gap-3 text-center">
        <GameButton variant="secondary" onClick={reset}>
          Reset
        </GameButton>
        <a href="https://freegamestore.online" className="text-xs underline" style={{ color: "var(--muted)" }}>
          More free games at freegamestore.online
        </a>
      </div>
    </div>
  );
}

/** Stars, time, moves and the saved best, laid over the board once it is solved. */
function WinScreen({ result, records, onNext }: { result: SolveResult; records: Records; onNext?: () => void }) {
  return (
    <div
      role="status"
      className="absolute inset-0 flex items-center justify-center p-3 rounded-[var(--radius)]"
      style={{ background: "var(--glass)" }}
    >
      <div
        className="flex flex-col items-center gap-2 p-4 text-center rounded-[var(--radius)] w-max max-w-full"
        style={{ background: "var(--paper)", border: "1px solid var(--line)" }}
      >
        <h2 className="text-2xl font-extrabold" style={{ fontFamily: "Fraunces, serif", color: "var(--accent)" }}>
          Solved!
        </h2>
        <p className="text-2xl tracking-widest" style={{ color: "var(--accent)" }}>
          <span className="sr-only">{result.stars} of 3 stars</span>
          <span aria-hidden="true">
            {"★".repeat(result.stars)}
            {"☆".repeat(3 - result.stars)}
          </span>
        </p>
        <p className="text-sm whitespace-nowrap">
          Time {formatTime(result.seconds)} · Moves {result.moves} · Hints {result.hintsUsed}/{HINT_LIMIT}
        </p>
        {records.bestSeconds !== null && records.fewestMoves !== null && (
          // Hidden in landscape, where the short screen leaves no room for it under the buttons.
          <p className="text-xs whitespace-nowrap landscape:hidden" style={{ color: "var(--muted)" }}>
            Best {formatTime(records.bestSeconds)} · fewest {records.fewestMoves} moves
          </p>
        )}
        {onNext && <GameButton onClick={onNext}>Next puzzle</GameButton>}
      </div>
    </div>
  );
}
