import { useState } from "react";
import { GameShell, GameTopbar, GameAuth } from "@freegamestore/games";
import { PACK } from "./game/pack";
import { LineLinkGame } from "./game/LineLinkGame";

export default function App() {
  const [index, setIndex] = useState(0);
  const level = PACK[index];
  return (
    <GameShell topbar={<GameTopbar title="Line Link" score={0} />}>
      <GameAuth />
      {level && (
        <LineLinkGame
          key={level.name}
          level={level}
          onNext={index + 1 < PACK.length ? () => setIndex(index + 1) : undefined}
        />
      )}
    </GameShell>
  );
}
