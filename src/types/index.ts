// ─── Core Puzzle ─────────────────────────────────────────────────────────────

export interface Puzzle {
  Mat: number[][];
  B: number[][];
  C: number[];      // row sums of selected cells
  D: number[];      // col sums of selected cells
  rowFillCount: number[]; // how many cells in each row should be selected
  colFillCount: number[]; // how many cells in each col should be selected
  diagMain?: number;
  diagAnti?: number;
  cages?: Cage[];
}

// ─── Grid Sizes ───────────────────────────────────────────────────────────────

export type GridSize = 3 | 5 | 7 | 9 | 11;

export type Difficulty = "easy" | "medium" | "hard";

export interface SizeConfig {
  n: GridSize;
  label: string;
  tag: string;
  allowNegative: boolean;
  difficulties: {
    easy: number;   // min rows/cols with |sum| < 7
    medium: number;
    hard: number;
  };
}

// ─── Game Modes ───────────────────────────────────────────────────────────────

export type StandardMode = "standard" | "zen" | "diagonal" | "cage" | "zerosum";
export type AppView = "standard" | "modes" | "daily";

// ─── Special Modes ────────────────────────────────────────────────────────────

export interface Cage {
  id: number;
  cells: [number, number][];
  target: number;
}

// ─── Irregular Mode ───────────────────────────────────────────────────────────

export interface IrregularCell {
  row: number;
  col: number;
  value: number;
  solution: 0 | 1;
}

export type ShapeId = "cross" | "ring" | "diamond" | "lshape" | "tshape" | "plus" | "random";

export interface IrregularShape {
  id: ShapeId;
  name: string;
  cells: [number, number][];
  boundingBox: [number, number];
}

// ─── Daily Puzzle ─────────────────────────────────────────────────────────────

export interface DailyRecord {
  dateKey: string;
  solved: boolean;
  time: number;
  hearts: number;
}

// ─── Themes ───────────────────────────────────────────────────────────────────

export type ThemeId =
  | "obsidian" | "pearl" | "aurora" | "ember"
  | "jade" | "void" | "sakura" | "slate";

export interface Theme {
  id: ThemeId;
  name: string;
  dark: boolean;
  css: Record<string, string>;
}