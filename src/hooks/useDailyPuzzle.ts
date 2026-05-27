import { useState, useEffect, useCallback, useRef } from "react";
import { type Puzzle, type DailyRecord } from "../types";
import { seededRng, todayKey, dateToSeed } from "../utils/dailySeed";
import { generateSeededPuzzle, formatTime } from "../utils/puzzle";

const STORAGE_KEY = "numgrid-daily";
const PROGRESS_KEY = "numgrid-daily-progress";
const DAILY_N = 7;
const TOTAL_HEARTS = 3;

// ─── Persistence helpers ──────────────────────────────────────────────────────

export function loadDailyRecord(dateKey: string): DailyRecord | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const rec: DailyRecord = JSON.parse(raw);
    return rec.dateKey === dateKey ? rec : null;
  } catch { return null; }
}

function saveRecord(rec: DailyRecord) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(rec)); } catch {}
}

interface ProgressSave {
  dateKey: string;
  playerB: number[][];
  hearts: number;
  time: number;
  completedCells: number;
}

function loadProgress(dateKey: string): ProgressSave | null {
  try {
    const raw = localStorage.getItem(PROGRESS_KEY);
    if (!raw) return null;
    const p: ProgressSave = JSON.parse(raw);
    return p.dateKey === dateKey ? p : null;
  } catch { return null; }
}

function saveProgress(p: ProgressSave) {
  try { localStorage.setItem(PROGRESS_KEY, JSON.stringify(p)); } catch {}
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export interface DailyState {
  puzzle: Puzzle;
  playerB: number[][];
  gameOver: boolean;
  hearts: number;
  completedCells: number;
  time: number;
  wrongCells: Set<string>;
  blinkingCells: Set<string>;
  showCelebration: boolean;
  progress: number;
  alreadySolved: boolean;
  todayRecord: DailyRecord | null;
  handleCellClick: (row: number, col: number, isEraser?: boolean) => void;
  longPressHandlers: (row: number, col: number) => {
    onPointerDown: () => void;
    onPointerUp: () => void;
    onPointerLeave: () => void;
  };
  formatTime: typeof formatTime;
}

export const useDailyPuzzle = (): DailyState => {
  const dateKey = todayKey();
  const rng = seededRng(dateToSeed(dateKey));
  // Puzzle is deterministic — same every call for same day
  const puzzle = generateSeededPuzzle(DAILY_N as any, rng);
  const N = DAILY_N;

  const existingRecord = loadDailyRecord(dateKey);
  const alreadyDone = !!(existingRecord?.solved || existingRecord?.hearts === 0);

  // Restore in-progress state if available
  const savedProgress = !alreadyDone ? loadProgress(dateKey) : null;

  const initPlayerB = savedProgress
    ? savedProgress.playerB
    : Array(N).fill(null).map(() => Array(N).fill(-1));
  const initHearts = savedProgress ? savedProgress.hearts : TOTAL_HEARTS;
  const initTime = savedProgress ? savedProgress.time : 0;
  const initCompleted = savedProgress ? savedProgress.completedCells : 0;

  // React state for rendering
  const [playerB, setPlayerB] = useState<number[][]>(initPlayerB);
  const [gameOver, setGameOver] = useState(alreadyDone);
  const [hearts, setHearts] = useState(initHearts);
  const [completedCells, setCompletedCells] = useState(initCompleted);
  const [time, setTime] = useState(initTime);
  const [wrongCells, setWrongCells] = useState<Set<string>>(new Set());
  const [blinkingCells, setBlinkingCells] = useState<Set<string>>(new Set());
  const [showCelebration, setShowCelebration] = useState(false);
  const [todayRecord, setTodayRecord] = useState<DailyRecord | null>(existingRecord);

  // Refs for sync reads
  const playerBRef = useRef(initPlayerB);
  const gameOverRef = useRef(alreadyDone);
  const heartsRef = useRef(initHearts);
  const completedRef = useRef(initCompleted);
  const timeRef = useRef(initTime);

  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Save progress to localStorage whenever meaningful state changes
  const persistProgress = useCallback(() => {
    if (gameOverRef.current) return; // don't overwrite final record
    saveProgress({
      dateKey,
      playerB: playerBRef.current,
      hearts: heartsRef.current,
      time: timeRef.current,
      completedCells: completedRef.current,
    });
  }, [dateKey]);

  useEffect(() => {
    if (!gameOver && hearts > 0 && !alreadyDone) {
      const t = setInterval(() => {
        timeRef.current += 1;
        setTime(timeRef.current);
        // Save progress every 5 seconds
        if (timeRef.current % 5 === 0) persistProgress();
      }, 1000);
      return () => clearInterval(t);
    }
  }, [gameOver, hearts, alreadyDone, persistProgress]);

  // Also save when component unmounts (user switches tabs)
  useEffect(() => {
    return () => { persistProgress(); };
  }, [persistProgress]);

  const triggerBlink = useCallback((row: number, col: number, rd: boolean, cd: boolean) => {
    const delay = 50, dur = 180;
    if (rd) {
      for (let j = 0; j < N; j++) {
        const k = `${row}-${j}`;
        setTimeout(() => {
          setBlinkingCells(p => new Set(p).add(k));
          setTimeout(() => setBlinkingCells(p => { const s = new Set(p); s.delete(k); return s; }), dur);
        }, j * delay);
      }
    }
    if (cd) {
      for (let i = 0; i < N; i++) {
        const k = `${i}-${col}`;
        setTimeout(() => {
          setBlinkingCells(p => new Set(p).add(k));
          setTimeout(() => setBlinkingCells(p => { const s = new Set(p); s.delete(k); return s; }), dur);
        }, i * delay);
      }
    }
  }, []);

  const handleCellClick = useCallback((row: number, col: number, isEraser = false) => {
    if (alreadyDone) return;
    if (gameOverRef.current) return;
    if (heartsRef.current <= 0) return;
    if (playerBRef.current[row][col] !== -1) return;

    const isCorrect = puzzle.B[row][col] === (isEraser ? 0 : 1);

    if (isCorrect) {
      const nb = playerBRef.current.map(r => [...r]);
      nb[row][col] = isEraser ? 0 : 1;
      playerBRef.current = nb;
      setPlayerB(nb);

      const nd = completedRef.current + 1;
      completedRef.current = nd;
      setCompletedCells(nd);

      const rd = nb[row].every((v, j) => v === puzzle.B[row][j]);
      const cd = nb.every((r, i) => r[col] === puzzle.B[i][col]);
      if (rd || cd) triggerBlink(row, col, rd, cd);

      persistProgress();

      if (nd === N * N) {
        gameOverRef.current = true;
        setGameOver(true);
        setShowCelebration(true);
        const rec: DailyRecord = { dateKey, solved: true, time: timeRef.current, hearts: heartsRef.current };
        saveRecord(rec);
        setTodayRecord(rec);
        // Clear in-progress save
        try { localStorage.removeItem(PROGRESS_KEY); } catch {}
      }
    } else {
      const nh = heartsRef.current - 1;
      heartsRef.current = nh;
      setHearts(nh);

      persistProgress();

      if (nh <= 0) {
        gameOverRef.current = true;
        setGameOver(true);
        const rec: DailyRecord = { dateKey, solved: false, time: timeRef.current, hearts: 0 };
        saveRecord(rec);
        setTodayRecord(rec);
        try { localStorage.removeItem(PROGRESS_KEY); } catch {}
      }

      const k = `${row}-${col}`;
      setWrongCells(p => new Set(p).add(k));
      setTimeout(() => setWrongCells(p => { const s = new Set(p); s.delete(k); return s; }), 500);
    }
  }, [puzzle.B, alreadyDone, dateKey, triggerBlink, persistProgress]);

  const longPressHandlers = useCallback((row: number, col: number) => ({
    onPointerDown: () => {
      longPressTimer.current = setTimeout(() => handleCellClick(row, col, true), 400);
    },
    onPointerUp: () => { if (longPressTimer.current) { clearTimeout(longPressTimer.current); longPressTimer.current = null; } },
    onPointerLeave: () => { if (longPressTimer.current) { clearTimeout(longPressTimer.current); longPressTimer.current = null; } },
  }), [handleCellClick]);

  return {
    puzzle, playerB, gameOver, hearts, completedCells, time,
    wrongCells, blinkingCells, showCelebration,
    progress: Math.round((completedCells / (N * N)) * 100),
    alreadySolved: alreadyDone, todayRecord,
    handleCellClick, longPressHandlers, formatTime,
  };
};