import { useState, useEffect, useCallback, useRef } from "react";
import { type Puzzle, type GridSize, type SizeConfig, type Difficulty } from "../types";
import { generatePuzzle } from "../utils/puzzle";
import { sizeConfigs, defaultSizeIndex } from "../data/sizes";

const TOTAL_HEARTS = 3;
const SAVE_KEY = "numgrid-standard-progress";

interface StandardSave {
  sizeIndex: number;
  difficulty: Difficulty;
  negativeEnabled: boolean;
  playerB: number[][];
  hearts: number;
  time: number;
  completedCells: number;
  hintUsed: boolean;
}

function loadSave(): StandardSave | null {
  try { return JSON.parse(localStorage.getItem(SAVE_KEY) ?? "null"); }
  catch { return null; }
}
function writeSave(s: StandardSave) {
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(s)); } catch {}
}
function clearSave() {
  try { localStorage.removeItem(SAVE_KEY); } catch {}
}

export interface GameState {
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
  sizeConfig: SizeConfig;
  progress: number;
  negativeEnabled: boolean;
  difficulty: Difficulty;
  // Live row/col sums (computed from playerB)
  liveRowSums: number[];
  liveColSums: number[];
  // Hint state
  hintUsed: boolean;
  hintRevealMode: boolean;  // waiting for player to click a cell
  activateHintReveal: () => void;
  cancelHintReveal: () => void;
  setNegativeEnabled: (v: boolean) => void;
  setDifficulty: (d: Difficulty) => void;
  handleCellClick: (row: number, col: number, isEraser?: boolean) => void;
  resetGame: (newSizeIndex?: number, negOverride?: boolean, diffOverride?: Difficulty) => void;
  setSizeIndex: (index: number) => void;
  longPressHandlers: (row: number, col: number) => {
    onPointerDown: () => void;
    onPointerUp: () => void;
    onPointerLeave: () => void;
  };
}

export const useGame = (): GameState => {
  const saved = loadSave();

  const [sizeIndex, setSizeIndexState] = useState(saved?.sizeIndex ?? defaultSizeIndex);
  const [negativeEnabled, setNegativeEnabledState] = useState(saved?.negativeEnabled ?? false);
  const [difficulty, setDifficultyState] = useState<Difficulty>(saved?.difficulty ?? "easy");

  const sizeIndexRef = useRef(saved?.sizeIndex ?? defaultSizeIndex);
  const negativeEnabledRef = useRef(saved?.negativeEnabled ?? false);
  const difficultyRef = useRef<Difficulty>(saved?.difficulty ?? "easy");

  const sizeConfig = sizeConfigs[sizeIndex];
  const N = sizeConfig.n as GridSize;

  const [puzzle, setPuzzle] = useState<Puzzle>(() =>
    generatePuzzle(N, saved?.negativeEnabled ?? false, saved?.difficulty ?? "easy")
  );
  const puzzleRef = useRef(puzzle);

  const initPlayerB = saved?.playerB ?? Array(N).fill(null).map(() => Array(N).fill(-1));
  const [playerB, setPlayerB] = useState<number[][]>(initPlayerB);
  const playerBRef = useRef(initPlayerB);

  const [gameOver, setGameOver] = useState(false);
  const gameOverRef = useRef(false);

  const [hearts, setHearts] = useState(saved?.hearts ?? TOTAL_HEARTS);
  const heartsRef = useRef(saved?.hearts ?? TOTAL_HEARTS);

  const [completedCells, setCompletedCells] = useState(saved?.completedCells ?? 0);
  const completedRef = useRef(saved?.completedCells ?? 0);

  const [time, setTime] = useState(saved?.time ?? 0);
  const timeRef = useRef(saved?.time ?? 0);

  const [wrongCells, setWrongCells] = useState<Set<string>>(new Set());
  const [blinkingCells, setBlinkingCells] = useState<Set<string>>(new Set());
  const [showCelebration, setShowCelebration] = useState(false);

  const [hintUsed, setHintUsed] = useState(saved?.hintUsed ?? false);
  const hintUsedRef = useRef(saved?.hintUsed ?? false);
  const [hintRevealMode, setHintRevealMode] = useState(false);

  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Live sums (derived from playerB, puzzle) ──────────────────────────────
  const computeLiveSums = useCallback((pb: number[][], puz: Puzzle) => {
    const n = pb.length;
    const rows = Array.from({ length: n }, (_, i) =>
      Array.from({ length: n }, (_, j) => pb[i][j] === 1 ? puz.Mat[i][j] : 0)
        .reduce((a, b) => a + b, 0)
    );
    const cols = Array.from({ length: n }, (_, j) =>
      Array.from({ length: n }, (_, i) => pb[i][j] === 1 ? puz.Mat[i][j] : 0)
        .reduce((a, b) => a + b, 0)
    );
    return { rows, cols };
  }, []);

  const initSums = computeLiveSums(initPlayerB, puzzle);
  const [liveRowSums, setLiveRowSums] = useState(initSums.rows);
  const [liveColSums, setLiveColSums] = useState(initSums.cols);

  // ── Persist ───────────────────────────────────────────────────────────────
  const persistProgress = useCallback(() => {
    if (gameOverRef.current) return;
    writeSave({
      sizeIndex: sizeIndexRef.current,
      difficulty: difficultyRef.current,
      negativeEnabled: negativeEnabledRef.current,
      playerB: playerBRef.current,
      hearts: heartsRef.current,
      time: timeRef.current,
      completedCells: completedRef.current,
      hintUsed: hintUsedRef.current,
    });
  }, []);

  useEffect(() => {
    if (!gameOver && hearts > 0) {
      const timer = setInterval(() => {
        timeRef.current += 1;
        setTime(timeRef.current);
        if (timeRef.current % 5 === 0) persistProgress();
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [gameOver, hearts, persistProgress]);

  useEffect(() => { return () => { persistProgress(); }; }, [persistProgress]);

  // ── Blink animation ───────────────────────────────────────────────────────
  const triggerBlinkAnimation = useCallback((row: number, col: number, rd: boolean, cd: boolean, n: number) => {
    const delay = 50, duration = 180;
    if (rd) for (let j = 0; j < n; j++) {
      const k = `${row}-${j}`;
      setTimeout(() => {
        setBlinkingCells(p => new Set(p).add(k));
        setTimeout(() => setBlinkingCells(p => { const s = new Set(p); s.delete(k); return s; }), duration);
      }, j * delay);
    }
    if (cd) for (let i = 0; i < n; i++) {
      const k = `${i}-${col}`;
      setTimeout(() => {
        setBlinkingCells(p => new Set(p).add(k));
        setTimeout(() => setBlinkingCells(p => { const s = new Set(p); s.delete(k); return s; }), duration);
      }, i * delay);
    }
  }, []);

  // ── Cell click ────────────────────────────────────────────────────────────
  const handleCellClick = useCallback((row: number, col: number, isEraser = false) => {
    if (gameOverRef.current) return;
    if (heartsRef.current <= 0) return;
    if (playerBRef.current[row][col] !== -1) return;

    // Hint reveal mode: reveal the correct answer for this cell
    if (hintRevealMode) {
      setHintRevealMode(false);
      hintUsedRef.current = true;
      setHintUsed(true);

      const correctAction = puzzleRef.current.B[row][col]; // 1=fill, 0=erase
      const newPlayerB = playerBRef.current.map(r => [...r]);
      newPlayerB[row][col] = correctAction;
      playerBRef.current = newPlayerB;
      setPlayerB(newPlayerB);

      const newCompleted = completedRef.current + 1;
      completedRef.current = newCompleted;
      setCompletedCells(newCompleted);

      // Update live sums
      const { rows, cols } = computeLiveSums(newPlayerB, puzzleRef.current);
      setLiveRowSums(rows);
      setLiveColSums(cols);

      const n = newPlayerB.length;
      const rd = newPlayerB[row].every((v, j) => v === puzzleRef.current.B[row][j]);
      const cd = newPlayerB.every((r, i) => r[col] === puzzleRef.current.B[i][col]);
      if (rd || cd) triggerBlinkAnimation(row, col, rd, cd, n);

      if (newCompleted === n * n) {
        gameOverRef.current = true;
        setGameOver(true);
        setShowCelebration(true);
        clearSave();
      }
      return;
    }

    const currentPuzzle = puzzleRef.current;
    const currentPlayerB = playerBRef.current;
    const n = currentPlayerB.length;
    const isCorrect = currentPuzzle.B[row][col] === (isEraser ? 0 : 1);

    if (isCorrect) {
      const newPlayerB = currentPlayerB.map(r => [...r]);
      newPlayerB[row][col] = isEraser ? 0 : 1;
      playerBRef.current = newPlayerB;
      setPlayerB(newPlayerB);

      const newCompleted = completedRef.current + 1;
      completedRef.current = newCompleted;
      setCompletedCells(newCompleted);

      // Update live sums
      const { rows, cols } = computeLiveSums(newPlayerB, currentPuzzle);
      setLiveRowSums(rows);
      setLiveColSums(cols);

      const rd = newPlayerB[row].every((v, j) => v === currentPuzzle.B[row][j]);
      const cd = newPlayerB.every((r, i) => r[col] === currentPuzzle.B[i][col]);
      if (rd || cd) triggerBlinkAnimation(row, col, rd, cd, n);

      persistProgress();

      if (newCompleted === n * n) {
        gameOverRef.current = true;
        setGameOver(true);
        setShowCelebration(true);
        clearSave();
      }
    } else {
      const newHearts = heartsRef.current - 1;
      heartsRef.current = newHearts;
      setHearts(newHearts);
      persistProgress();
      if (newHearts <= 0) { gameOverRef.current = true; setGameOver(true); clearSave(); }
      const k = `${row}-${col}`;
      setWrongCells(p => new Set(p).add(k));
      setTimeout(() => setWrongCells(p => { const s = new Set(p); s.delete(k); return s; }), 500);
    }
  }, [hintRevealMode, triggerBlinkAnimation, persistProgress, computeLiveSums]);

  // ── Reset ─────────────────────────────────────────────────────────────────
  const resetGame = useCallback((newSizeIndex?: number, negOverride?: boolean, diffOverride?: Difficulty) => {
    const idx = newSizeIndex !== undefined ? newSizeIndex : sizeIndexRef.current;
    const cfg = sizeConfigs[idx];
    const newN = cfg.n as GridSize;
    const useNeg = negOverride !== undefined ? negOverride : negativeEnabledRef.current;
    const useDiff = diffOverride !== undefined ? diffOverride : difficultyRef.current;
    const allowNeg = cfg.allowNegative && useNeg;

    const newPuzzle = generatePuzzle(newN, allowNeg, useDiff);
    const newPlayerB = Array(newN).fill(null).map(() => Array(newN).fill(-1));
    const { rows, cols } = computeLiveSums(newPlayerB, newPuzzle);

    puzzleRef.current = newPuzzle;
    playerBRef.current = newPlayerB;
    gameOverRef.current = false;
    heartsRef.current = TOTAL_HEARTS;
    completedRef.current = 0;
    timeRef.current = 0;
    hintUsedRef.current = false;

    if (newSizeIndex !== undefined) { setSizeIndexState(newSizeIndex); sizeIndexRef.current = newSizeIndex; }
    setPuzzle(newPuzzle);
    setPlayerB(newPlayerB);
    setGameOver(false);
    setShowCelebration(false);
    setHearts(TOTAL_HEARTS);
    setCompletedCells(0);
    setTime(0);
    setWrongCells(new Set());
    setBlinkingCells(new Set());
    setLiveRowSums(rows);
    setLiveColSums(cols);
    setHintUsed(false);
    setHintRevealMode(false);
    clearSave();
  }, [computeLiveSums]);

  const setSizeIndex = useCallback((index: number) => {
    const cfg = sizeConfigs[index];
    const newNeg = cfg.allowNegative ? negativeEnabledRef.current : false;
    sizeIndexRef.current = index;
    if (!cfg.allowNegative) { setNegativeEnabledState(false); negativeEnabledRef.current = false; }
    resetGame(index, newNeg);
  }, [resetGame]);

  const setNegativeEnabled = useCallback((v: boolean) => {
    setNegativeEnabledState(v); negativeEnabledRef.current = v;
    resetGame(undefined, v);
  }, [resetGame]);

  const setDifficulty = useCallback((d: Difficulty) => {
    setDifficultyState(d); difficultyRef.current = d;
    resetGame(undefined, undefined, d);
  }, [resetGame]);

  const activateHintReveal = useCallback(() => {
    if (!hintUsedRef.current) setHintRevealMode(true);
  }, []);

  const cancelHintReveal = useCallback(() => {
    setHintRevealMode(false);
  }, []);

  const longPressHandlers = useCallback((row: number, col: number) => ({
    onPointerDown: () => { longPressTimer.current = setTimeout(() => handleCellClick(row, col, true), 400); },
    onPointerUp: () => { if (longPressTimer.current) { clearTimeout(longPressTimer.current); longPressTimer.current = null; } },
    onPointerLeave: () => { if (longPressTimer.current) { clearTimeout(longPressTimer.current); longPressTimer.current = null; } },
  }), [handleCellClick]);

  return {
    puzzle, playerB, gameOver, hearts, completedCells, time,
    wrongCells, blinkingCells, showCelebration,
    sizeIndex, sizeConfig,
    progress: Math.round((completedCells / (N * N)) * 100),
    negativeEnabled, difficulty,
    liveRowSums, liveColSums,
    hintUsed, hintRevealMode,
    activateHintReveal, cancelHintReveal,
    setNegativeEnabled, setDifficulty, handleCellClick, resetGame, setSizeIndex, longPressHandlers,
  };
};