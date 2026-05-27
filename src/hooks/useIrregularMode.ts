import { useState, useCallback, useRef } from "react";
import { type IrregularShape } from "../types";
import { generateRandomShape } from "../data/shapes";
import { generateIrregularPuzzle, type IrregularPuzzle } from "../utils/irregularPuzzle";

const TOTAL_HEARTS = 3;
const TARGET_SIZE = 15; // ~15 cells per random puzzle

export interface IrregularState {
  puzzle: IrregularPuzzle;
  playerCells: Map<string, 0 | 1 | -1>;
  gameOver: boolean;
  hearts: number;
  showCelebration: boolean;
  wrongCells: Set<string>;
  blinkingCells: Set<string>;
  completedCount: number;
  totalCount: number;
  handleCellClick: (row: number, col: number, isEraser?: boolean) => void;
  resetGame: () => void;
  longPressHandlers: (r: number, c: number) => {
    onPointerDown: () => void;
    onPointerUp: () => void;
    onPointerLeave: () => void;
  };
}

function buildRandomPuzzle(): IrregularPuzzle {
  const shape: IrregularShape = generateRandomShape(TARGET_SIZE, Math.random);
  return generateIrregularPuzzle(shape, Math.random);
}

function buildPlayerMap(puzzle: IrregularPuzzle): Map<string, 0 | 1 | -1> {
  const m = new Map<string, 0 | 1 | -1>();
  for (const cell of puzzle.cells) m.set(`${cell.row},${cell.col}`, -1);
  return m;
}

export const useIrregularMode = (): IrregularState => {
  const [puzzle, setPuzzle] = useState<IrregularPuzzle>(() => buildRandomPuzzle());
  const puzzleRef = useRef<IrregularPuzzle>(puzzle);

  const [playerCells, setPlayerCells] = useState<Map<string, 0 | 1 | -1>>(() =>
    buildPlayerMap(puzzle)
  );
  const playerCellsRef = useRef<Map<string, 0 | 1 | -1>>(playerCells);

  const [gameOver, setGameOver] = useState(false);
  const gameOverRef = useRef(false);

  const [hearts, setHearts] = useState(TOTAL_HEARTS);
  const heartsRef = useRef(TOTAL_HEARTS);

  const [showCelebration, setShowCelebration] = useState(false);
  const [wrongCells, setWrongCells] = useState<Set<string>>(new Set());
  const [blinkingCells, setBlinkingCells] = useState<Set<string>>(new Set());

  const [completedCount, setCompletedCount] = useState(0);
  const completedRef = useRef(0);

  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const triggerBlink = useCallback((keys: string[]) => {
    for (let i = 0; i < keys.length; i++) {
      const k = keys[i];
      setTimeout(() => {
        setBlinkingCells(p => new Set(p).add(k));
        setTimeout(() => setBlinkingCells(p => { const s = new Set(p); s.delete(k); return s; }), 180);
      }, i * 50);
    }
  }, []);

  const handleCellClick = useCallback((row: number, col: number, isEraser = false) => {
    if (gameOverRef.current) return;
    if (heartsRef.current <= 0) return;

    const k = `${row},${col}`;
    if (playerCellsRef.current.get(k) !== -1) return;

    const currentPuzzle = puzzleRef.current;
    const cell = currentPuzzle.cells.find(c => c.row === row && c.col === col);
    if (!cell) return;

    const isCorrect = cell.solution === (isEraser ? 0 : 1);

    if (isCorrect) {
      const newMap = new Map(playerCellsRef.current);
      newMap.set(k, isEraser ? 0 : 1);
      playerCellsRef.current = newMap;
      setPlayerCells(newMap);

      const newCompleted = completedRef.current + 1;
      completedRef.current = newCompleted;
      setCompletedCount(newCompleted);

      // Blink if row or col fully solved
      const rowKeys = currentPuzzle.cells
        .filter(c => c.row === row)
        .map(c => `${c.row},${c.col}`);
      const colKeys = currentPuzzle.cells
        .filter(c => c.col === col)
        .map(c => `${c.row},${c.col}`);

      const rowDone = rowKeys.every(rk => {
        const target = currentPuzzle.cells.find(c => `${c.row},${c.col}` === rk);
        return newMap.get(rk) === target?.solution;
      });
      const colDone = colKeys.every(ck => {
        const target = currentPuzzle.cells.find(c => `${c.row},${c.col}` === ck);
        return newMap.get(ck) === target?.solution;
      });

      if (rowDone) triggerBlink(rowKeys);
      else if (colDone) triggerBlink(colKeys);

      if (newCompleted === currentPuzzle.cells.length) {
        gameOverRef.current = true;
        setGameOver(true);
        setShowCelebration(true);
      }
    } else {
      const newHearts = heartsRef.current - 1;
      heartsRef.current = newHearts;
      setHearts(newHearts);
      if (newHearts <= 0) {
        gameOverRef.current = true;
        setGameOver(true);
      }
      setWrongCells(p => new Set(p).add(k));
      setTimeout(() => setWrongCells(p => { const s = new Set(p); s.delete(k); return s; }), 500);
    }
  }, [triggerBlink]);

  const resetGame = useCallback(() => {
    const newPuzzle = buildRandomPuzzle();
    const newMap = buildPlayerMap(newPuzzle);

    puzzleRef.current = newPuzzle;
    playerCellsRef.current = newMap;
    gameOverRef.current = false;
    heartsRef.current = TOTAL_HEARTS;
    completedRef.current = 0;

    setPuzzle(newPuzzle);
    setPlayerCells(newMap);
    setGameOver(false);
    setShowCelebration(false);
    setHearts(TOTAL_HEARTS);
    setCompletedCount(0);
    setWrongCells(new Set());
    setBlinkingCells(new Set());
  }, []);

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
    puzzle, playerCells, gameOver, hearts, showCelebration,
    wrongCells, blinkingCells, completedCount, totalCount: puzzle.cells.length,
    handleCellClick, resetGame, longPressHandlers,
  };
};