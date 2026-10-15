import { GameShell, GameTopbar, GameAuth } from "@freegamestore/games";
import { STARTER } from "./game/levels";
import { LineLinkGame } from "./game/LineLinkGame";

export default function App() {
  const level = STARTER.level;
  return (
    <GameShell topbar={<GameTopbar title="Line Link" score={0} />}>
      <GameAuth />
      <LineLinkGame key={level.name} level={level} />
    </GameShell>
  );
}
