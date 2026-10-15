import { useEffect, useState } from "react";

/**
 * Whole seconds from `startedAt` to `stoppedAt`, or to now while still running.
 * A null `startedAt` means the clock has not started, so it reads 0.
 */
export function useElapsed(startedAt: number | null, stoppedAt: number | null): number {
  const [now, setNow] = useState(() => Date.now());
  const running = startedAt !== null && stoppedAt === null;

  useEffect(() => {
    if (!running) return;
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [running]);

  if (startedAt === null) return 0;
  return Math.max(0, Math.floor(((stoppedAt ?? now) - startedAt) / 1000));
}
