import React, { useRef, useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
  liveRowSums?: number[];
  liveColSums?: number[];
  showFillCounts?: boolean;
  hintRevealMode?: boolean;
}

// ─── Cage helpers ─────────────────────────────────────────────────────────────

function buildCageMap(cages: Cage[], playerB: number[][], solutionB: number[][]) {
  const CAGE_COLORS = [
    "rgba(139,92,246,0.5)", "rgba(56,189,248,0.5)", "rgba(249,115,22,0.5)",
    "rgba(52,211,153,0.5)", "rgba(244,114,182,0.5)", "rgba(250,204,21,0.5)",
    "rgba(167,139,250,0.5)", "rgba(103,232,249,0.5)",
  ];
  const cageId = new Map<string, number>();
  const cageColors = new Map<number, string>();
  const cageLabel = new Map<string, string>();
  const cageCompleted = new Set<number>();

  cages.forEach((cage, idx) => {
    cageColors.set(cage.id, CAGE_COLORS[idx % CAGE_COLORS.length]);
    const sorted = [...cage.cells].sort((a, b) => a[0] !== b[0] ? a[0] - b[0] : a[1] - b[1]);
    cageLabel.set(`${sorted[0][0]}-${sorted[0][1]}`, String(cage.target));
    cage.cells.forEach(([r, c]) => cageId.set(`${r}-${c}`, cage.id));
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

// ─── Animated number (count-up for live sums) ────────────────────────────────

const AnimatedNum: React.FC<{ value: number; fontSize: number }> = ({ value, fontSize }) => {
  const [displayed, setDisplayed] = useState(value);
  const [flash, setFlash] = useState(false);
  const prev = useRef(value);

  useEffect(() => {
    if (value === prev.current) return;
    const start = prev.current;
    const end = value;
    const diff = end - start;
    const steps = Math.min(Math.abs(diff), 6);
    const stepTime = 40;
    let step = 0;
    const interval = setInterval(() => {
      step++;
      const frac = step / steps;
      setDisplayed(Math.round(start + diff * frac));
      if (step >= steps) {
        clearInterval(interval);
        setDisplayed(end);
        setFlash(true);
        setTimeout(() => setFlash(false), 300);
      }
    }, stepTime);
    prev.current = value;
    return () => clearInterval(interval);
  }, [value]);

  return (
    <span style={{
      color: flash ? "var(--accent-2)" : "var(--sum-text)",
      fontSize,
      fontWeight: 700,
      fontFamily: "'JetBrains Mono', monospace",
      transition: "color 0.2s",
      lineHeight: 1,
    }}>
      {displayed}
    </span>
  );
};

// ─── Sum cell (left of row / top of col) ─────────────────────────────────────

const SumCell: React.FC<{
  target: number;
  live: number;
  solved: boolean;   // row/col fully done
  size: number;
  zerosumMode?: boolean;
}> = ({ target, live, solved, size, zerosumMode }) => {
  const targetDisplay = zerosumMode ? 0 : target;
  const tfs = Math.max(9, Math.min(13, size * 0.30));
  const lfs = Math.max(7, Math.min(11, size * 0.24));

  return (
    <div style={{
      width: size, height: size,
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      background: solved ? "var(--sum-bg)" : "var(--sum-bg)",
      borderRadius: 6,
      gap: 0,
      position: "relative",
      overflow: "hidden",
    }}>
      {solved ? (
        // Row/col complete — show just the target (merged/confirmed)
        <span style={{
          fontSize: tfs,
          fontWeight: 700,
          color: "var(--accent-2)",
          fontFamily: "'JetBrains Mono', monospace",
          lineHeight: 1,
        }}>
          {targetDisplay}
        </span>
      ) : (
        <>
          {/* Live sum on top — only show if non-zero */}
          {live !== 0 && (
            <AnimatedNum value={live} fontSize={lfs} />
          )}
          {/* Divider line */}
          {live !== 0 && (
            <div style={{ width: "70%", height: 1, background: "var(--border)", margin: "1px 0" }} />
          )}
          {/* Target sum */}
          <span style={{
            fontSize: tfs,
            fontWeight: 700,
            color: "var(--sum-text)",
            fontFamily: "'JetBrains Mono', monospace",
            lineHeight: 1,
          }}>
            {targetDisplay}
          </span>
        </>
      )}
    </div>
  );
};

// ─── Fill-count cell (right of row / bottom of col) ──────────────────────────

const FillCountCell: React.FC<{ count: number; size: number; solved: boolean }> = ({ count, size, solved }) => (
  <div style={{
    width: size, height: size,
    display: "flex", alignItems: "center", justifyContent: "center",
    opacity: solved ? 0.3 : 0.75,
    transition: "opacity 0.3s",
  }}>
    <span style={{
      fontSize: Math.max(8, size * 0.27),
      fontWeight: 600,
      color: "var(--text-muted)",
      fontFamily: "'JetBrains Mono', monospace",
    }}>
      {count}
    </span>
  </div>
);

// ─── Main GameGrid component ──────────────────────────────────────────────────

const GameGrid: React.FC<GameGridProps> = ({
  puzzle, playerB, wrongCells, blinkingCells,
  onCellClick, longPressHandlers,
  showCageOutlines = false,
  highlightDiagonals = false,
  zerosumMode = false,
  liveRowSums,
  liveColSums,
  showFillCounts = false,
  hintRevealMode = false,
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
  const gestureActive = useRef(false);
  const gestureMoved = useRef(false);
  const touchStartPoint = useRef<{ x: number; y: number } | null>(null);
  const MOVE_THRESHOLD = 6;

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
      gestureActive.current = true; gestureMoved.current = true;
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      lastPinchDist.current = Math.hypot(dx, dy);
      lastPanPoint.current = { x: (e.touches[0].clientX + e.touches[1].clientX) / 2, y: (e.touches[0].clientY + e.touches[1].clientY) / 2 };
    } else if (e.touches.length === 1) {
      touchStartPoint.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      gestureMoved.current = false; gestureActive.current = false;
      if (scaleRef.current > 1) { lastPanPoint.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }; isDragging.current = true; }
    }
  }, [isPannable]);

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isPannable) return;
    if (e.touches.length >= 2) {
      e.preventDefault(); gestureActive.current = true; gestureMoved.current = true;
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
      if (touchStartPoint.current) {
        const dx = e.touches[0].clientX - touchStartPoint.current.x;
        const dy = e.touches[0].clientY - touchStartPoint.current.y;
        if (Math.hypot(dx, dy) > MOVE_THRESHOLD) gestureMoved.current = true;
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
    if (e.touches.length < 2) { lastPinchDist.current = null; gestureActive.current = false; }
    if (e.touches.length === 0) {
      isDragging.current = false; lastPanPoint.current = null; touchStartPoint.current = null;
      if (scaleRef.current < 1.05) applyTransform(1, { x: 0, y: 0 });
      setTimeout(() => { gestureMoved.current = false; }, 50);
    }
  }, [isPannable, applyTransform]);

  // Sizing
  const vw = typeof window !== "undefined" ? window.innerWidth : 600;
  // Extra columns for fill-count cells on right
  const extraCols = showFillCounts ? 1 : 0;
  const available = Math.min(vw - 32, 520);
  const cellSize = Math.max(24, Math.min(56, Math.floor(available / (N + 1 + extraCols))));
  const fontSize = Math.max(9, Math.min(16, cellSize * 0.38));
  const sumFontSize = Math.max(9, Math.min(15, cellSize * 0.34));

  const cageData = showCageOutlines && puzzle.cages
    ? buildCageMap(puzzle.cages, playerB, puzzle.B)
    : null;

  // Precompute which rows and cols are fully solved
  const rowSolved = Array.from({ length: N }, (_, i) =>
    Array.from({ length: N }, (_, j) => playerB[i][j]).every((v, j) => v === puzzle.B[i][j])
  );
  const colSolved = Array.from({ length: N }, (_, j) =>
    Array.from({ length: N }, (_, i) => playerB[i][j]).every((v, i) => v === puzzle.B[i][j])
  );

  return (
    <div
      ref={containerRef}
      style={{
        overflow: isPannable ? "hidden" : "auto",
        width: "100%",
        touchAction: isPannable ? "none" : "auto",
        cursor: hintRevealMode ? "crosshair" : undefined,
      }}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      {isPannable && (
        <div style={{ fontSize: 10, color: "var(--text-muted)", textAlign: "center", paddingBottom: 6, opacity: 0.6 }}>
          {scale > 1.05 ? "Drag to pan · Pinch to zoom out" : "Pinch to zoom"}
        </div>
      )}
      <div style={{
        transform: isPannable ? `translate(${offset.x}px, ${offset.y}px) scale(${scale})` : undefined,
        transformOrigin: "center center",
        transition: isDragging.current ? "none" : "transform 0.15s ease",
        display: "inline-block",
        willChange: isPannable ? "transform" : undefined,
      }}>
        <div style={{
          display: "grid",
          // sum col | N cell cols | optional fill-count col
          gridTemplateColumns: `${cellSize}px repeat(${N}, ${cellSize}px)${showFillCounts ? ` ${cellSize}px` : ""}`,
          gridTemplateRows: `${cellSize}px repeat(${N}, ${cellSize}px)${showFillCounts ? ` ${cellSize}px` : ""}`,
          gap: 3,
        }}>
          {/* ── Top-left corner ── */}
          <div style={{ width: cellSize, height: cellSize, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-muted)", fontSize: sumFontSize }}>#</div>

          {/* ── Column sum cells (top row) ── */}
          {puzzle.D.map((sum, j) => (
            <SumCell
              key={`col-${j}`}
              target={sum}
              live={liveColSums ? liveColSums[j] : 0}
              solved={colSolved[j]}
              size={cellSize}
              zerosumMode={zerosumMode}
            />
          ))}

          {/* ── Top-right corner (fill count header) ── */}
          {showFillCounts && (
            <div style={{ width: cellSize, height: cellSize }} />
          )}

          {/* ── Grid rows ── */}
          {puzzle.Mat.map((row, i) => (
            <React.Fragment key={`row-${i}`}>
              {/* Row sum cell */}
              <SumCell
                target={puzzle.C[i]}
                live={liveRowSums ? liveRowSums[i] : 0}
                solved={rowSolved[i]}
                size={cellSize}
                zerosumMode={zerosumMode}
              />

              {/* Grid cells */}
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
                let cageId: number | undefined;

                if (cageData) {
                  cageId = cageData.cageId.get(cellKey);
                  if (cageId !== undefined) {
                    const isComplete = cageData.cageCompleted.has(cageId);
                    // Always show cage color, even for filled cells — use mix-blend or overlay
                    cageBg = isComplete ? undefined : cageData.cageColors.get(cageId);
                    const borders = getCageBorders(i, j, cageData.cageId);
                    const bw = 2;
                    const dashed = isComplete ? "1px solid var(--cell-border)" : `${bw}px dashed var(--border-accent)`;
                    const plain = "1px solid var(--cell-border)";
                    cageBorderStyle = {
                      borderTop:    borders.top    ? dashed : plain,
                      borderBottom: borders.bottom ? dashed : plain,
                      borderLeft:   borders.left   ? dashed : plain,
                      borderRight:  borders.right  ? dashed : plain,
                    };
                    if (!isComplete) {
                      const label = cageData.cageLabel.get(cellKey);
                      if (label) {
                        // Label always visible, even when cell is filled
                        cageLabelEl = (
                          <span style={{
                            position: "absolute", top: 1, left: 2,
                            fontSize: Math.max(7, cellSize * 0.22),
                            fontWeight: 800,
                            // On filled cells: white label with dark shadow; on empty: accent color
                            color: isFilled ? "rgba(255,255,255,0.95)" : "var(--border-accent)",
                            textShadow: isFilled ? "0 0 3px rgba(0,0,0,0.6)" : "none",
                            fontFamily: "'JetBrains Mono', monospace",
                            lineHeight: 1, pointerEvents: "none",
                            zIndex: 2,
                          }}>
                            {label}
                          </span>
                        );
                      }
                    }
                  }
                }

                const lph = longPressHandlers(i, j);

                // Cage: filled cells show cage color as a tint overlay
                // We achieve this by layering: cage bg behind + a semi-transparent filled color on top
                let cellBg: string;
                if (isWrong) {
                  cellBg = "rgba(248,113,113,0.25)";
                } else if (cageData && cageId !== undefined && !cageData.cageCompleted.has(cageId)) {
                  // Cage mode: always show cage color; filled cells use a lighter version of fill over cage bg
                  if (isFilled) {
                    cellBg = cageData.cageColors.get(cageId) ?? "var(--cell-filled)";
                  } else {
                    cellBg = cageBg ?? "var(--cell-empty)";
                  }
                } else if (isFilled) {
                  cellBg = "var(--cell-filled)";
                } else if (isMainDiag || isAntiDiag) {
                  cellBg = "var(--sum-bg)";
                } else {
                  cellBg = "var(--cell-empty)";
                }

                // Filled cage cell: use a colored border to show membership
                const filledCageOverlay = cageData && cageId !== undefined
                  && !cageData.cageCompleted.has(cageId) && isFilled;

                return (
                  <motion.div
                    key={cellKey}
                    onClick={e => {
                      e.preventDefault();
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
                    // Fill pop: scale 1 → 1.14 → 1 when cell becomes filled
                    animate={
                      isWrong
                        ? { x: [0, -5, 5, -4, 4, 0], transition: { duration: 0.35, ease: "easeOut" } }
                        : isFilled
                        ? { scale: [1, 1.14, 1], transition: { duration: 0.18, ease: [0.34, 1.56, 0.64, 1] } }
                        : { x: 0, scale: 1 }
                    }
                    style={{
                      position: "relative",
                      width: cellSize, height: cellSize,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      cursor: isDone ? "default" : hintRevealMode ? "crosshair" : "pointer",
                      borderRadius: 6, fontSize,
                      fontWeight: isFilled ? 700 : 400,
                      fontFamily: "'JetBrains Mono', monospace",
                      userSelect: "none",
                      overflow: "hidden",
                      background: cellBg,
                      ...(cageData ? cageBorderStyle : {
                        border: `1px solid ${isWrong ? "var(--error)" : isFilled ? "var(--border-accent)" : "var(--cell-border)"}`,
                      }),
                      ...(filledCageOverlay ? {
                        boxShadow: `inset 0 0 0 2px ${cageData!.cageColors.get(cageId!)?.replace("0.5", "1") ?? "var(--border-accent)"}`,
                      } : {}),
                      color: isFilled ? "rgba(255,255,255,0.95)" : isWrong ? "var(--error)" : "var(--text)",
                      boxShadow: filledCageOverlay
                        ? `inset 0 0 0 2px ${cageData!.cageColors.get(cageId!)?.replace("0.5", "0.9") ?? "var(--border-accent)"}`
                        : isFilled
                        ? "0 2px 12px var(--accent-glow)"
                        : isBlinking
                        ? "0 0 16px var(--accent-glow)"
                        : "none",
                      outline: (isMainDiag || isAntiDiag) && !cageData ? "1.5px solid var(--border-accent)" : "none",
                    }}
                  >
                    {/* Row/col completion wave — staggered glow overlay */}
                    <AnimatePresence>
                      {isBlinking && (
                        <motion.div
                          key="blink-overlay"
                          initial={{ opacity: 0, scale: 0.6 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 1 }}
                          transition={{ duration: 0.18 }}
                          style={{
                            position: "absolute", inset: 0,
                            borderRadius: 6,
                            background: "var(--accent-glow)",
                            pointerEvents: "none",
                            zIndex: 1,
                          }}
                        />
                      )}
                    </AnimatePresence>
                    {cageLabelEl}
                    {isErased ? "" : val}
                  </motion.div>
                );
              })}

              {/* Row fill-count cell (right side) */}
              {showFillCounts && (
                <FillCountCell
                  count={puzzle.rowFillCount[i]}
                  size={cellSize}
                  solved={rowSolved[i]}
                />
              )}
            </React.Fragment>
          ))}

          {/* ── Bottom fill-count row (col fill counts) ── */}
          {showFillCounts && (
            <>
              <div style={{ width: cellSize, height: cellSize }} />
              {puzzle.colFillCount.map((count, j) => (
                <FillCountCell
                  key={`col-fill-${j}`}
                  count={count}
                  size={cellSize}
                  solved={colSolved[j]}
                />
              ))}
              <div style={{ width: cellSize, height: cellSize }} />
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default GameGrid;