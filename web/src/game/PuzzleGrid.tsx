import type { PointerEvent } from "react";
import { cellAt, type Cell, type Level, type Paths } from "./grid";

interface PuzzleGridProps {
  level: Level;
  paths: Paths;
  onBegin: (cell: Cell) => void;
  onDrag: (cell: Cell) => void;
  onEnd: () => void;
}

const PATH_WIDTH = 0.42;
const DOT_RADIUS = 0.3;

/**
 * The puzzle board as an SVG, one unit per cell. Pointer positions are mapped
 * to cells from the SVG's bounding box, so the board scales with its container.
 */
export function PuzzleGrid({ level, paths, onBegin, onDrag, onEnd }: PuzzleGridProps) {
  const { size } = level;
  const cellOf = (e: PointerEvent<SVGSVGElement>): Cell | null =>
    cellAt(size, e.currentTarget.getBoundingClientRect(), e.clientX, e.clientY);

  return (
    <svg
      viewBox={`0 0 ${size} ${size}`}
      role="img"
      aria-label={`${level.name}: ${size} by ${size} grid`}
      className="w-full max-w-[min(90vw,70svh)] aspect-square select-none"
      style={{ touchAction: "none" }}
      onPointerDown={(e) => {
        const cell = cellOf(e);
        if (!cell) return;
        e.currentTarget.setPointerCapture(e.pointerId);
        onBegin(cell);
      }}
      onPointerMove={(e) => {
        const cell = cellOf(e);
        if (cell) onDrag(cell);
      }}
      onPointerUp={onEnd}
      onPointerCancel={onEnd}
    >
      <rect width={size} height={size} fill="var(--panel)" />
      {Array.from({ length: size - 1 }, (_, i) => (
        <g key={i} stroke="var(--line)" strokeWidth={0.04}>
          <line x1={i + 1} y1={0} x2={i + 1} y2={size} />
          <line x1={0} y1={i + 1} x2={size} y2={i + 1} />
        </g>
      ))}
      {level.pairs.map((pair) => {
        const path = paths[pair.id] ?? [];
        return (
          <g key={pair.id}>
            {path.length > 1 && (
              <polyline
                points={path.map(([r, c]) => `${c + 0.5},${r + 0.5}`).join(" ")}
                fill="none"
                stroke={pair.color}
                strokeWidth={PATH_WIDTH}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}
            {[pair.a, pair.b].map(([r, c], i) => (
              <circle key={i} cx={c + 0.5} cy={r + 0.5} r={DOT_RADIUS} fill={pair.color} data-testid="dot" />
            ))}
          </g>
        );
      })}
    </svg>
  );
}
