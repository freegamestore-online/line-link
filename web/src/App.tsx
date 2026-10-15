import { useState } from "react";
import { GameShell, GameAuth } from "@freegamestore/games";
import { PACK } from "./game/pack";
import { LineLinkGame } from "./game/LineLinkGame";
import { LineLinkTopbar } from "./game/LineLinkTopbar";
import { useLevelSession } from "./game/useLevelSession";
import type { Level } from "./game/grid";

export default function App() {
  const [index, setIndex] = useState(0);
  const level = PACK[index];
  if (!level) return null;
  return (
    <Play
      key={level.name}
      level={level}
      onNext={index + 1 < PACK.length ? () => setIndex(index + 1) : undefined}
    />
  );
}

/** One puzzle attempt, with its HUD in the shell's topbar. */
function Play({ level, onNext }: { level: Level; onNext?: () => void }) {
  const session = useLevelSession(level);
  return (
    <GameShell topbar={<LineLinkTopbar session={session} />}>
      <GameAuth />
      <LineLinkGame session={session} onNext={onNext} />
    </GameShell>
  );
}
