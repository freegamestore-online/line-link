/**
 * Star rating for one solve. Par is three seconds per cell, so a 5×5 puzzle
 * has a 75-second par and a 9×9 has 243.
 *   3 stars: no hints and within par.
 *   2 stars: any hint, or within twice par.
 *   1 star:  otherwise.
 */
export const PAR_SECONDS_PER_CELL = 3;

export function starRating({ seconds, hintsUsed, size }: { seconds: number; hintsUsed: number; size: number }): 1 | 2 | 3 {
  const par = size * size * PAR_SECONDS_PER_CELL;
  if (hintsUsed === 0 && seconds <= par) return 3;
  if (hintsUsed > 0 || seconds <= 2 * par) return 2;
  return 1;
}
