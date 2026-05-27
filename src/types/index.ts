// ─── Core Puzzle ─────────────────────────────────────────────────────────────

export interface Puzzle {
  Mat: number[][];
  B: number[][];
  C: number[];
  D: number[];
  diagMain?: number;   // sum of main diagonal (top-left → bottom-right)
  diagAnti?: number;   // sum of anti-diagonal (top-right → bottom-left)
  cages?: Cage[];      // cage groups for Cage mode
}

// ─── Grid Sizes ───────────────────────────────────────────────────────────────

export type GridSize = 3 | 5 | 7 | 9 | 13;

export interface SizeConfig {
  n: GridSize;
  label: string;
  tag: string;
  maxSum: number;
  allowNegative: boolean;
}

// ─── Game Modes ───────────────────────────────────────────────────────────────

export type StandardMode = "standard" | "zen" | "diagonal" | "cage" | "zerosum";
export type AppView = "standard" | "modes" | "daily";

// ─── Special Modes ────────────────────────────────────────────────────────────

export interface Cage {
  id: number;
  cells: [number, number][];  // [row, col] pairs
  target: number;             // sum of selected cells in this cage
}

// ─── Irregular Mode ───────────────────────────────────────────────────────────

// A cell that exists in the irregular grid
export interface IrregularCell {
  row: number;
  col: number;
  value: number;       // the number shown
  solution: 0 | 1;    // correct answer: fill (1) or erase (0)
}

export type ShapeId =
  | "cross"
  | "ring"
  | "diamond"
  | "lshape"
  | "tshape"
  | "plus"
  | "random";

export interface IrregularShape {
  id: ShapeId;
  name: string;
  cells: [number, number][]; // which [row,col] cells are active in a bounding box
  boundingBox: [number, number]; // [rows, cols] of the bounding box
}

// ─── Daily Puzzle ─────────────────────────────────────────────────────────────

export interface DailyRecord {
  dateKey: string;   // "YYYY-MM-DD"
  solved: boolean;
  time: number;      // seconds
  hearts: number;
}

// ─── Themes ───────────────────────────────────────────────────────────────────

export type ThemeId =
  | "obsidian"
  | "pearl"
  | "aurora"
  | "ember"
  | "jade"
  | "void"
  | "sakura"
  | "slate";

export interface Theme {
  id: ThemeId;
  name: string;
  dark: boolean;
  css: Record<string, string>;
}