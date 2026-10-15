import { GameButton, GameTopbar } from "@freegamestore/games";
import type { LevelSession } from "./useLevelSession";

/** mm:ss, or h:mm:ss past an hour. */
export function formatTime(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = String(totalSeconds % 60).padStart(2, "0");
  return h > 0 ? `${h}:${String(m).padStart(2, "0")}:${s}` : `${m}:${s}`;
}

/** The HUD for one puzzle attempt: moves, time, hints left, and the hint action. */
export function LineLinkTopbar({ session }: { session: LevelSession }) {
  const { moves, seconds, hintsLeft, solved, showHint } = session;
  // Hints left sit in the button label: a third stat does not fit a 320px topbar beside the Hint button.
  return (
    <GameTopbar
      title="Line Link"
      stats={[
        { label: "Moves", value: moves },
        { label: "Time", value: formatTime(seconds) },
      ]}
      actions={
        <GameButton variant="secondary" size="sm" onClick={showHint} disabled={hintsLeft <= 0 || solved}>
          Hint ({hintsLeft})
        </GameButton>
      }
    />
  );
}
