import React, { useRef, useState, useEffect, useCallback } from "react";
import { type Puzzle, type Cage } from "../types";

interface GameGridProps {
  puzzle: Puzzle;
  playerB: number[][];
  wrongCells: Set<string>;
  blinkingCells: Set<string>;
  onCellClick: (row: number, col: number, isEraser?: boolean) => void;
  longPressHandlers: (row: number, col: number) => {
    onPointerDown: () => void;
    onPointerUp: () => void;
    onPointerLeave: () => void;
  };
  showCageOutlines?: boolean;
  highlightDiagonals?: boolean;
  zerosumMode?: boolean;
}

function buildCageMap(cages: Cage[], playerB: number[][], solutionB: number[][]) {
  const CAGE_COLORS = [
    "rgba(139,92,246,0.35)", "rgba(56,189,248,0.35)", "rgba(249,115,22,0.35)",
    "rgba(52,211,153,0.35)", "rgba(244,114,182,0.35)", "rgba(250,204,21,0.35)",
    "rgba(167,139,250,0.35)", "rgba(103,232,249,0.35)",
  ];
  const cageId = new Map<string, number>();
  const cageColors = new Map<number, string>();
  const cageLabel = new Map<string, string>();
  const cageCompleted = new Set<number>(); // cage ids that are fully solved

  cages.forEach((cage, idx) => {
    cageColors.set(cage.id, CAGE_COLORS[idx % CAGE_COLORS.length]);
    const sorted = [...cage.cells].sort((a, b) => a[0] !== b[0] ? a[0] - b[0] : a[1] - b[1]);
    cageLabel.set(`${sorted[0][0]}-${sorted[0][1]}`, String(cage.target));
    cage.cells.forEach(([r, c]) => cageId.set(`${r}-${c}`, cage.id));

    // Check if every cell in this cage matches the solution
    const allDone = cage.cells.every(([r, c]) => playerB[r][c] === solutionB[r][c]);
    if (allDone) cageCompleted.add(cage.id);
  });
  return { cageId, cageColors, cageLabel, cageCompleted };
}

function getCageBorders(row: number, col: number, cageId: Map<string, number>) {
  const id = cageId.get(`${row}-${col}`);
  if (id === undefined) return { top: false, bottom: false, left: false, right: false };
  return {
    top:    cageId.get(`${row-1}-${col}`) !== id,
    bottom: cageId.get(`${row+1}-${col}`) !== id,
    left:   cageId.get(`${row}-${col-1}`) !== id,
    right:  cageId.get(`${row}-${col+1}`) !== id,
  };
}

const GameGrid: React.FC<GameGridProps> = ({
  puzzle, playerB, wrongCells, blinkingCells,
  onCellClick, longPressHandlers,
  showCageOutlines = false,
  highlightDiagonals = false,
  zerosumMode = false,
}) => {
  const N = puzzle.Mat.length;
  const isPannable = N >= 9;

  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const scaleRef = useRef(1);
  const offsetRef = useRef({ x: 0, y: 0 });
  const lastPinchDist = useRef<number | null>(null);
  const lastPanPoint = useRef<{ x: number; y: number } | null>(null);
  const isDragging = useRef(false);

  // Gesture guard — block cell clicks if any significant movement happened
  const gestureActive = useRef(false);   // true while 2+ fingers are down
  const gestureMoved = useRef(false);    // true if movement exceeded threshold during this touch sequence
  const touchStartPoint = useRef<{ x: number; y: number } | null>(null);
  const MOVE_THRESHOLD = 6; // px — less than this = tap, more = pan/pinch

  useEffect(() => {
    setScale(1); setOffset({ x: 0, y: 0 });
    scaleRef.current = 1; offsetRef.current = { x: 0, y: 0 };
  }, [N]);

  const clampOffset = useCallback((ox: number, oy: number, s: number) => {
    if (!containerRef.current) return { x: ox, y: oy };
    const { width, height } = containerRef.current.getBoundingClientRect();
    const maxX = Math.max(0, (width * s - width) / 2);
    const maxY = Math.max(0, (height * s - height) / 2);
    return { x: Math.min(maxX, Math.max(-maxX, ox)), y: Math.min(maxY, Math.max(-maxY, oy)) };
  }, []);

  const applyTransform = useCallback((newScale: number, newOffset: { x: number; y: number }) => {
    const clamped = clampOffset(newOffset.x, newOffset.y, newScale);
    scaleRef.current = newScale; offsetRef.current = clamped;
    setScale(newScale); setOffset(clamped);
  }, [clampOffset]);

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    if (!isPannable) return;

    if (e.touches.length >= 2) {
      e.preventDefault();
      gestureActive.current = true;
      gestureMoved.current = true; // multi-finger always blocks tap
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      lastPinchDist.current = Math.hypot(dx, dy);
      lastPanPoint.current = {
        x: (e.touches[0].clientX + e.touches[1].clientX) / 2,
        y: (e.touches[0].clientY + e.touches[1].clientY) / 2,
      };
    } else if (e.touches.length === 1) {
      // Single finger: only pan when already zoomed in
      touchStartPoint.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      gestureMoved.current = false; // reset for new touch sequence
      gestureActive.current = false;
      if (scaleRef.current > 1) {
        lastPanPoint.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
        isDragging.current = true;
      }
    }
  }, [isPannable]);

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isPannable) return;

    if (e.touches.length >= 2) {
      e.preventDefault();
      gestureActive.current = true;
      gestureMoved.current = true;
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const dist = Math.hypot(dx, dy);
      if (lastPinchDist.current !== null) {
        const newScale = Math.min(3, Math.max(1, scaleRef.current * (dist / lastPinchDist.current)));
        const midX = (e.touches[0].clientX + e.touches[1].clientX) / 2;
        const midY = (e.touches[0].clientY + e.touches[1].clientY) / 2;
        const panDx = lastPanPoint.current ? midX - lastPanPoint.current.x : 0;
        const panDy = lastPanPoint.current ? midY - lastPanPoint.current.y : 0;
        applyTransform(newScale, { x: offsetRef.current.x + panDx, y: offsetRef.current.y + panDy });
        lastPanPoint.current = { x: midX, y: midY };
      }
      lastPinchDist.current = dist;
    } else if (e.touches.length === 1) {
      // Check if single finger moved enough to count as pan
      if (touchStartPoint.current) {
        const dx = e.touches[0].clientX - touchStartPoint.current.x;
        const dy = e.touches[0].clientY - touchStartPoint.current.y;
        if (Math.hypot(dx, dy) > MOVE_THRESHOLD) {
          gestureMoved.current = true;
        }
      }
      if (isDragging.current && scaleRef.current > 1) {
        e.preventDefault();
        if (lastPanPoint.current) {
          const panDx = e.touches[0].clientX - lastPanPoint.current.x;
          const panDy = e.touches[0].clientY - lastPanPoint.current.y;
          applyTransform(scaleRef.current, { x: offsetRef.current.x + panDx, y: offsetRef.current.y + panDy });
        }
        lastPanPoint.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      }
    }
  }, [isPannable, applyTransform]);

  const onTouchEnd = useCallback((e: React.TouchEvent) => {
    if (!isPannable) return;
    if (e.touches.length < 2) {
      lastPinchDist.current = null;
      gestureActive.current = false;
    }
    if (e.touches.length === 0) {
      isDragging.current = false;
      lastPanPoint.current = null;
      touchStartPoint.current = null;
      if (scaleRef.current < 1.05) applyTransform(1, { x: 0, y: 0 });
      // Keep gestureMoved true briefly so the click event that fires after touchend is blocked
      setTimeout(() => { gestureMoved.current = false; }, 50);
    }
  }, [isPannable, applyTransform]);

  // Sizing
  const vw = typeof window !== "undefined" ? window.innerWidth : 600;
  const available = Math.min(vw - 32, 520);
  const cellSize = Math.max(24, Math.min(56, Math.floor(available / (N + 1))));
  const fontSize = Math.max(9, Math.min(16, cellSize * 0.38));
  const sumFontSize = Math.max(9, Math.min(15, cellSize * 0.34));

  const cageData = showCageOutlines && puzzle.cages
    ? buildCageMap(puzzle.cages, playerB, puzzle.B)
    : null;

  const sumStyle: React.CSSProperties = {
    width: cellSize, height: cellSize,
    display: "flex", alignItems: "center", justifyContent: "center",
    background: "var(--sum-bg)", color: "var(--sum-text)",
    borderRadius: 6, fontWeight: 700, fontSize: sumFontSize,
    fontFamily: "'JetBrains Mono', monospace",
  };

  return (
    <div
      ref={containerRef}
      style={{
        overflow: isPannable ? "hidden" : "auto",
        width: "100%",
        touchAction: isPannable ? "none" : "auto",
      }}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      {isPannable && (
        <div style={{ fontSize: 10, color: "var(--text-muted)", textAlign: "center", paddingBottom: 6, opacity: 0.6, fontFamily: "Sora, sans-serif" }}>
          {scale > 1.05 ? "Drag to pan · Pinch to zoom out" : "Pinch to zoom"}
        </div>
      )}
      <div
        style={{
          transform: isPannable ? `translate(${offset.x}px, ${offset.y}px) scale(${scale})` : undefined,
          transformOrigin: "center center",
          transition: isDragging.current ? "none" : "transform 0.15s ease",
          display: "inline-block",
          willChange: isPannable ? "transform" : undefined,
        }}
      >
        <div style={{
          display: "grid",
          gridTemplateColumns: `${cellSize}px repeat(${N}, ${cellSize}px)`,
          gridTemplateRows: `${cellSize}px repeat(${N}, ${cellSize}px)`,
          gap: 3,
        }}>
          {/* Corner */}
          <div style={{ width: cellSize, height: cellSize, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-muted)", fontSize: sumFontSize }}>#</div>

          {/* Column sums */}
          {puzzle.D.map((sum, j) => (
            <div key={`col-${j}`} style={sumStyle}>{zerosumMode ? 0 : sum}</div>
          ))}

          {/* Rows */}
          {puzzle.Mat.map((row, i) => (
            <React.Fragment key={`row-${i}`}>
              <div style={sumStyle}>{zerosumMode ? 0 : puzzle.C[i]}</div>
              {row.map((val, j) => {
                const cellKey = `${i}-${j}`;
                const isWrong = wrongCells.has(cellKey);
                const isBlinking = blinkingCells.has(cellKey);
                const isFilled = playerB[i][j] === 1;
                const isErased = playerB[i][j] === 0;
                const isDone = isFilled || isErased;
                const isMainDiag = highlightDiagonals && i === j;
                const isAntiDiag = highlightDiagonals && i + j === N - 1;

                let cageBg: string | undefined;
                let cageBorderStyle: React.CSSProperties = {};
                let cageLabelEl: React.ReactNode = null;

                if (cageData) {
                  const cId = cageData.cageId.get(cellKey);
                  if (cId !== undefined) {
                    const isComplete = cageData.cageCompleted.has(cId);
                    // Fade out completed cages — no color, plain border
                    cageBg = isComplete ? undefined : cageData.cageColors.get(cId);
                    const borders = getCageBorders(i, j, cageData.cageId);
                    const bw = 2;
                    const dashed = isComplete ? "1px solid var(--cell-border)" : `${bw}px dashed var(--border-accent)`;
                    const plain  = "1px solid var(--cell-border)";
                    cageBorderStyle = {
                      borderTop:    borders.top    ? dashed : plain,
                      borderBottom: borders.bottom ? dashed : plain,
                      borderLeft:   borders.left   ? dashed : plain,
                      borderRight:  borders.right  ? dashed : plain,
                    };
                    if (!isComplete) {
                      const label = cageData.cageLabel.get(cellKey);
                      if (label) {
                        cageLabelEl = (
                          <span style={{
                            position: "absolute", top: 1, left: 2,
                            fontSize: Math.max(7, cellSize * 0.22),
                            fontWeight: 700, color: "var(--sum-text)",
                            fontFamily: "'JetBrains Mono', monospace",
                            lineHeight: 1, pointerEvents: "none",
                          }}>
                            {label}
                          </span>
                        );
                      }
                    }
                  }
                }

                const lph = longPressHandlers(i, j);

                return (
                  <div
                    key={cellKey}
                    onClick={e => {
                      e.preventDefault();
                      // Block click if any gesture movement was detected
                      if (gestureMoved.current || gestureActive.current) return;
                      if (!isDone) onCellClick(i, j, false);
                    }}
                    onContextMenu={e => {
                      e.preventDefault();
                      if (!isDone) onCellClick(i, j, true);
                    }}
                    onPointerDown={lph.onPointerDown}
                    onPointerUp={lph.onPointerUp}
                    onPointerLeave={lph.onPointerLeave}
                    className={`cell ${isWrong ? "wrong" : isBlinking ? "blink" : isFilled ? "filled" : !isDone ? "idle" : ""}`}
                    style={{
                      position: "relative",
                      width: cellSize, height: cellSize,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      cursor: isDone ? "default" : "pointer",
                      borderRadius: 6, fontSize,
                      fontWeight: isFilled ? 700 : 400,
                      fontFamily: "'JetBrains Mono', monospace",
                      userSelect: "none",
                      transition: "background 0.15s, transform 0.1s, box-shadow 0.15s",
                      background: isWrong
                        ? "rgba(248,113,113,0.25)"
                        : isFilled
                        ? "var(--cell-filled)"
                        : cageBg ?? ((isMainDiag || isAntiDiag) ? "var(--sum-bg)" : "var(--cell-empty)"),
                      ...(cageData ? cageBorderStyle : {
                        border: `1px solid ${isWrong ? "var(--error)" : isFilled ? "var(--border-accent)" : "var(--cell-border)"}`,
                      }),
                      color: isFilled ? "rgba(255,255,255,0.95)" : isWrong ? "var(--error)" : "var(--text)",
                      boxShadow: isFilled
                        ? "0 2px 12px var(--accent-glow)"
                        : isBlinking
                        ? "0 0 16px var(--accent-glow)"
                        : "none",
                      outline: (isMainDiag || isAntiDiag) && !cageData ? "1.5px solid var(--border-accent)" : "none",
                    }}
                  >
                    {cageLabelEl}
                    {isErased ? "" : val}
                  </div>
                );
              })}
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  );
};

export default GameGrid;