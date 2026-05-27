import { useState, useEffect, useCallback, useRef } from "react";
import { type Puzzle, type GridSize, type StandardMode } from "../types";
import {
  generatePuzzle,
  generateDiagonalPuzzle,
  generateCagePuzzle,
  generateZeroSumPuzzle,
} from "../utils/puzzle";
import { sizeConfigs } from "../data/sizes";

const TOTAL_HEARTS = 3;
const ZEN_HEARTS = 999;
const SAVE_KEY = "numgrid-modes-progress";

interface ModesSave {
  mode: StandardMode;
  sizeIndex: number;
  playerB: number[][];
  hearts: number;
  time: number;
  completedCells: number;
}

function loadModesSave(): ModesSave | null {
  try { return JSON.parse(localStorage.getItem(SAVE_KEY) ?? "null"); }
  catch { return null; }
}
function writeModesSave(s: ModesSave) {
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(s)); } catch {}
}
function clearModesSave() {
  try { localStorage.removeItem(SAVE_KEY); } catch {}
}

export interface SpecialModeState {
  mode: StandardMode;
  setMode: (m: StandardMode) => void;
  puzzle: Puzzle;
  playerB: number[][];
  gameOver: boolean;
  hearts: number;
  completedCells: number;
  time: number;
  wrongCells: Set<string>;
  blinkingCells: Set<string>;
  showCelebration: boolean;
  sizeIndex: number;
  progress: number;
  handleCellClick: (row: number, col: number, isEraser?: boolean) => void;
  resetGame: () => void;
  setSizeIndex: (i: number) => void;
  longPressHandlers: (r: number, c: number) => {
    onPointerDown: () => void;
    onPointerUp: () => void;
    onPointerLeave: () => void;
  };
}

function makePuzzle(mode: StandardMode, n: GridSize): Puzzle {
  switch (mode) {
    case "diagonal": return generateDiagonalPuzzle(n, false, 5);
    case "cage":     return generateCagePuzzle(n, false, 5);
    case "zerosum":  return generateZeroSumPuzzle(n);
    default:         return generatePuzzle(n, false, 5);
  }
}

function initialHearts(mode: StandardMode) {
  return mode === "zen" ? ZEN_HEARTS : TOTAL_HEARTS;
}

export const useSpecialMode = (): SpecialModeState => {
  const saved = loadModesSave();

  const [mode, setModeState] = useState<StandardMode>(saved?.mode ?? "zen");
  const [sizeIndex, setSizeIndexState] = useState(saved?.sizeIndex ?? 1);

  const modeRef = useRef<StandardMode>(saved?.mode ?? "zen");
  const sizeIndexRef = useRef(saved?.sizeIndex ?? 1);

  const cfg = sizeConfigs[sizeIndex];
  const N = cfg.n as GridSize;

  const [puzzle, setPuzzle] = useState<Puzzle>(() => makePuzzle(modeRef.current, N));
  const puzzleRef = useRef<Puzzle>(puzzle);

  const initPlayerB = saved?.playerB ?? Array(N).fill(null).map(() => Array(N).fill(-1));
  const [playerB, setPlayerB] = useState<number[][]>(initPlayerB);
  const playerBRef = useRef(initPlayerB);

  const [gameOver, setGameOver] = useState(false);
  const gameOverRef = useRef(false);

  const initHearts = saved?.hearts ?? initialHearts(modeRef.current);
  const [hearts, setHearts] = useState(initHearts);
  const heartsRef = useRef(initHearts);

  const initCompleted = saved?.completedCells ?? 0;
  const [completedCells, setCompletedCells] = useState(initCompleted);
  const completedRef = useRef(initCompleted);

  const initTime = saved?.time ?? 0;
  const [time, setTime] = useState(initTime);
  const timeRef = useRef(initTime);

  const [wrongCells, setWrongCells] = useState<Set<string>>(new Set());
  const [blinkingCells, setBlinkingCells] = useState<Set<string>>(new Set());
  const [showCelebration, setShowCelebration] = useState(false);

  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const persistProgress = useCallback(() => {
    if (gameOverRef.current || modeRef.current === "zen") return;
    writeModesSave({
      mode: modeRef.current,
      sizeIndex: sizeIndexRef.current,
      playerB: playerBRef.current,
      hearts: heartsRef.current,
      time: timeRef.current,
      completedCells: completedRef.current,
    });
  }, []);

  useEffect(() => {
    if (!gameOver && hearts > 0) {
      const t = setInterval(() => {
        timeRef.current += 1;
        setTime(timeRef.current);
        if (timeRef.current % 5 === 0) persistProgress();
      }, 1000);
      return () => clearInterval(t);
    }
  }, [gameOver, hearts, persistProgress]);

  useEffect(() => {
    return () => { persistProgress(); };
  }, [persistProgress]);

  const triggerBlink = useCallback((row: number, col: number, rd: boolean, cd: boolean, n: number) => {
    const delay = 50, dur = 180;
    if (rd) {
      for (let j = 0; j < n; j++) {
        const k = `${row}-${j}`;
        setTimeout(() => {
          setBlinkingCells(p => new Set(p).add(k));
          setTimeout(() => setBlinkingCells(p => { const s = new Set(p); s.delete(k); return s; }), dur);
        }, j * delay);
      }
    }
    if (cd) {
      for (let i = 0; i < n; i++) {
        const k = `${i}-${col}`;
        setTimeout(() => {
          setBlinkingCells(p => new Set(p).add(k));
          setTimeout(() => setBlinkingCells(p => { const s = new Set(p); s.delete(k); return s; }), dur);
        }, i * delay);
      }
    }
  }, []);

  const handleCellClick = useCallback((row: number, col: number, isEraser = false) => {
    if (gameOverRef.current) return;
    if (heartsRef.current <= 0) return;
    if (playerBRef.current[row][col] !== -1) return;

    const currentPuzzle = puzzleRef.current;
    const currentPlayerB = playerBRef.current;
    const n = currentPlayerB.length;
    const isZen = modeRef.current === "zen";
    const isCorrect = currentPuzzle.B[row][col] === (isEraser ? 0 : 1);

    if (isCorrect) {
      const newPlayerB = currentPlayerB.map(r => [...r]);
      newPlayerB[row][col] = isEraser ? 0 : 1;
      playerBRef.current = newPlayerB;
      setPlayerB(newPlayerB);

      const newCompleted = completedRef.current + 1;
      completedRef.current = newCompleted;
      setCompletedCells(newCompleted);

      const rd = newPlayerB[row].every((v, j) => v === currentPuzzle.B[row][j]);
      const cd = newPlayerB.every((r, i) => r[col] === currentPuzzle.B[i][col]);
      if (rd || cd) triggerBlink(row, col, rd, cd, n);

      persistProgress();

      if (newCompleted === n * n) {
        gameOverRef.current = true;
        setGameOver(true);
        setShowCelebration(true);
        clearModesSave();
      }
    } else {
      if (!isZen) {
        const newHearts = heartsRef.current - 1;
        heartsRef.current = newHearts;
        setHearts(newHearts);

        persistProgress();

        if (newHearts <= 0) {
          gameOverRef.current = true;
          setGameOver(true);
          clearModesSave();
        }
      }
      const k = `${row}-${col}`;
      setWrongCells(p => new Set(p).add(k));
      setTimeout(() => setWrongCells(p => { const s = new Set(p); s.delete(k); return s; }), 500);
    }
  }, [triggerBlink, persistProgress]);

  const applyReset = useCallback((m: StandardMode, idx: number) => {
    const c = sizeConfigs[idx];
    const n = c.n as GridSize;
    const h = initialHearts(m);
    const newPuzzle = makePuzzle(m, n);
    const newPlayerB = Array(n).fill(null).map(() => Array(n).fill(-1));

    puzzleRef.current = newPuzzle;
    playerBRef.current = newPlayerB;
    gameOverRef.current = false;
    heartsRef.current = h;
    completedRef.current = 0;
    timeRef.current = 0;

    setPuzzle(newPuzzle);
    setPlayerB(newPlayerB);
    setGameOver(false);
    setShowCelebration(false);
    setHearts(h);
    setCompletedCells(0);
    setTime(0);
    setWrongCells(new Set());
    setBlinkingCells(new Set());
    clearModesSave();
  }, []);

  const resetGame = useCallback(() => {
    applyReset(modeRef.current, sizeIndexRef.current);
  }, [applyReset]);

  const setMode = useCallback((m: StandardMode) => {
    setModeState(m);
    modeRef.current = m;
    applyReset(m, sizeIndexRef.current);
  }, [applyReset]);

  const setSizeIndex = useCallback((i: number) => {
    setSizeIndexState(i);
    sizeIndexRef.current = i;
    applyReset(modeRef.current, i);
  }, [applyReset]);

  const longPressHandlers = useCallback((row: number, col: number) => ({
    onPointerDown: () => {
      longPressTimer.current = setTimeout(() => handleCellClick(row, col, true), 400);
    },
    onPointerUp: () => {
      if (longPressTimer.current) { clearTimeout(longPressTimer.current); longPressTimer.current = null; }
    },
    onPointerLeave: () => {
      if (longPressTimer.current) { clearTimeout(longPressTimer.current); longPressTimer.current = null; }
    },
  }), [handleCellClick]);

  return {
    mode, setMode, puzzle, playerB, gameOver, hearts,
    completedCells, time, wrongCells, blinkingCells, showCelebration,
    sizeIndex,
    progress: Math.round((completedCells / (N * N)) * 100),
    handleCellClick, resetGame, setSizeIndex, longPressHandlers,
  };
};