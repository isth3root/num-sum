import React from "react";
import { type IrregularPuzzle } from "../utils/irregularPuzzle";

interface IrregularGridProps {
  puzzle: IrregularPuzzle;
  playerCells: Map<string, 0 | 1 | -1>;
  wrongCells: Set<string>;
  blinkingCells: Set<string>;
  onCellClick: (row: number, col: number, isEraser?: boolean) => void;
  longPressHandlers: (row: number, col: number) => {
    onPointerDown: () => void;
    onPointerUp: () => void;
    onPointerLeave: () => void;
  };
}

const IrregularGrid: React.FC<IrregularGridProps> = ({
  puzzle,
  playerCells,
  wrongCells,
  blinkingCells,
  onCellClick,
  longPressHandlers,
}) => {
  const { shape, cells, rowSums, colSums } = puzzle;
  const [rows, cols] = shape.boundingBox;

  const activeSet = new Set(cells.map(c => `${c.row},${c.col}`));

  const vw = typeof window !== "undefined" ? window.innerWidth : 600;
  const available = Math.min(vw - 40, 480);
  const maxDim = Math.max(rows, cols);
  const cs = Math.max(28, Math.min(56, Math.floor(available / (maxDim + 1.5))));
  const fs = Math.max(10, Math.min(16, cs * 0.38));
  const sfs = Math.max(9, Math.min(14, cs * 0.32));

  const sumStyle: React.CSSProperties = {
    width: cs,
    height: cs,
    flexShrink: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "var(--sum-bg)",
    color: "var(--sum-text)",
    borderRadius: 6,
    fontWeight: 700,
    fontSize: sfs,
    fontFamily: "'JetBrains Mono', monospace",
  };

  return (
    <div style={{ overflowX: "auto", display: "flex", justifyContent: "center" }}>
      <div style={{ display: "inline-block" }}>

        {/* Column sum header */}
        <div style={{ display: "flex", gap: 3, marginBottom: 3, paddingLeft: cs + 3 }}>
          {Array.from({ length: cols }, (_, c) => {
            const sum = colSums.get(c);
            return sum !== undefined
              ? <div key={c} style={sumStyle}>{sum}</div>
              : <div key={c} style={{ width: cs, height: cs, flexShrink: 0 }} />;
          })}
        </div>

        {/* Rows */}
        {Array.from({ length: rows }, (_, r) => {
          const rowSum = rowSums.get(r);
          return (
            <div key={r} style={{ display: "flex", gap: 3, marginBottom: 3 }}>

              {/* Row sum label */}
              {rowSum !== undefined
                ? <div style={sumStyle}>{rowSum}</div>
                : <div style={{ width: cs, height: cs, flexShrink: 0 }} />}

              {/* Cells */}
              {Array.from({ length: cols }, (_, c) => {
                const mapKey = `${r},${c}`;
                const isActive = activeSet.has(mapKey);

                // Empty slot — invisible, just takes space
                if (!isActive) {
                  return (
                    <div
                      key={c}
                      style={{ width: cs, height: cs, flexShrink: 0 }}
                    />
                  );
                }

                const cellData = cells.find(cell => cell.row === r && cell.col === c)!;
                const playerVal = playerCells.get(mapKey);
                const isFilled = playerVal === 1;
                const isErased = playerVal === 0;
                const isDone = isFilled || isErased;
                const isWrong = wrongCells.has(mapKey);
                const isBlinking = blinkingCells.has(mapKey);

                const lph = longPressHandlers(r, c);

                // Exact same style logic as standard GameGrid cells
                const bg = isWrong
                  ? "rgba(248,113,113,0.25)"
                  : isFilled
                  ? "var(--cell-filled)"
                  : "var(--cell-empty)";

                const borderColor = isWrong
                  ? "var(--error)"
                  : isFilled
                  ? "var(--border-accent)"
                  : "var(--cell-border)";

                const textColor = isFilled
                  ? "rgba(255,255,255,0.95)"
                  : isWrong
                  ? "var(--error)"
                  : "var(--text)";

                const boxShadow = isFilled
                  ? "0 2px 12px var(--accent-glow)"
                  : isBlinking
                  ? "0 0 16px var(--accent-glow)"
                  : "none";

                return (
                  <div
                    key={c}
                    onClick={e => {
                      e.preventDefault();
                      if (!isDone) onCellClick(r, c, false);
                    }}
                    onContextMenu={e => {
                      e.preventDefault();
                      if (!isDone) onCellClick(r, c, true);
                    }}
                    onPointerDown={lph.onPointerDown}
                    onPointerUp={lph.onPointerUp}
                    onPointerLeave={lph.onPointerLeave}
                    className={`cell ${isWrong ? "wrong" : isBlinking ? "blink" : isFilled ? "filled" : !isDone ? "idle" : ""}`}
                    style={{
                      width: cs,
                      height: cs,
                      flexShrink: 0,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: fs,
                      fontWeight: isFilled ? 700 : 400,
                      fontFamily: "'JetBrains Mono', monospace",
                      background: bg,
                      border: `1px solid ${borderColor}`,
                      borderRadius: 6,
                      color: textColor,
                      boxShadow,
                      cursor: isDone ? "default" : "pointer",
                      userSelect: "none",
                      transition: "background 0.15s, box-shadow 0.15s, transform 0.1s",
                    }}
                  >
                    {isErased ? "" : cellData.value}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default IrregularGrid;