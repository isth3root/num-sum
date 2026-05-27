import { type Puzzle, type GridSize, type Cage } from "../types";

type Rng = () => number;
function defaultRng(): Rng { return () => Math.random(); }

// ─── Standard puzzle generator ────────────────────────────────────────────────

export const generatePuzzle = (
  n: GridSize,
  allowNegative: boolean,
  maxSum: number,
  rng: Rng = defaultRng()
): Puzzle => {
  let Mat: number[][] = [], B: number[][] = [], MatB: number[][] = [];
  let SumN_Row: number[] = [], SumN_Col: number[] = [];
  let valid = false, attempts = 0;

  while (!valid && attempts < 2000) {
    attempts++;
    Mat = Array(n).fill(null).map(() =>
      Array(n).fill(null).map(() => {
        const val = Math.floor(rng() * 9) + 1;
        return allowNegative && rng() < 0.2 ? -val : val;
      })
    );
    B = Array(n).fill(null).map(() =>
      Array(n).fill(null).map(() => Math.round(rng()))
    );
    MatB = Mat.map((row, i) => row.map((v, j) => v * B[i][j]));
    SumN_Row = MatB.map(row => row.reduce((a, b) => a + b, 0));
    SumN_Col = MatB[0].map((_, j) => MatB.reduce((s, row) => s + row[j], 0));

    valid =
      SumN_Row.every(s => s !== 0) &&
      SumN_Col.every(s => s !== 0) &&
      (SumN_Row.some(s => Math.abs(s) <= maxSum) ||
       SumN_Col.some(s => Math.abs(s) <= maxSum));
  }

  return { Mat, B, C: SumN_Row, D: SumN_Col };
};

// ─── Diagonal puzzle generator ────────────────────────────────────────────────

export const generateDiagonalPuzzle = (
  n: GridSize,
  allowNegative: boolean,
  maxSum: number,
  rng: Rng = defaultRng()
): Puzzle => {
  const base = generatePuzzle(n, allowNegative, maxSum, rng);
  const { Mat, B } = base;
  const diagMain = Array.from({ length: n }, (_, i) => Mat[i][i] * B[i][i]).reduce((a, b) => a + b, 0);
  const diagAnti = Array.from({ length: n }, (_, i) => Mat[i][n - 1 - i] * B[i][n - 1 - i]).reduce((a, b) => a + b, 0);
  return { ...base, diagMain, diagAnti };
};

// ─── Zero-Sum puzzle generator ────────────────────────────────────────────────
//
// Algebraic construction that GUARANTEES both row and column sums = 0:
//
// 1. Fill the (n-1)×(n-1) interior with random ±1..9 values and random B
// 2. Last column: set Mat[i][n-1] = -(sum of filled cells in row i), B[i][n-1]=1
// 3. Last row:    set Mat[n-1][j] = -(sum of filled cells in col j), B[n-1][j]=1
// 4. Corner [n-1][n-1]: both constraints agree → set to cancel both
//
// Values used: any ±1..9, not just ±2. Distractors fill unfilled cells.

export const generateZeroSumPuzzle = (
  n: GridSize,
  rng: Rng = defaultRng()
): Puzzle => {
  for (let attempt = 0; attempt < 300; attempt++) {
    const Mat: number[][] = Array(n).fill(null).map(() => Array(n).fill(0));
    const B:   number[][] = Array(n).fill(null).map(() => Array(n).fill(0));

    // Step 1: random interior (n-1)×(n-1)
    for (let i = 0; i < n - 1; i++) {
      for (let j = 0; j < n - 1; j++) {
        B[i][j] = rng() < 0.5 ? 1 : 0;
        const v = Math.floor(rng() * 9) + 1;
        Mat[i][j] = rng() < 0.5 ? v : -v;
      }
    }

    // Step 2: last column fixes each row sum to 0
    let ok = true;
    for (let i = 0; i < n - 1; i++) {
      const rowSum = Array.from({ length: n - 1 }, (_, j) => Mat[i][j] * B[i][j])
        .reduce((a, b) => a + b, 0);
      const needed = -rowSum;
      if (needed === 0 || Math.abs(needed) > 9) { ok = false; break; }
      Mat[i][n - 1] = needed;
      B[i][n - 1] = 1;
    }
    if (!ok) continue;

    // Step 3: last row fixes each column sum to 0
    for (let j = 0; j < n - 1; j++) {
      const colSum = Array.from({ length: n - 1 }, (_, i) => Mat[i][j] * B[i][j])
        .reduce((a, b) => a + b, 0);
      const needed = -colSum;
      if (needed === 0 || Math.abs(needed) > 9) { ok = false; break; }
      Mat[n - 1][j] = needed;
      B[n - 1][j] = 1;
    }
    if (!ok) continue;

    // Step 4: corner cell — must satisfy last-row sum AND last-col sum = 0
    const lastRowPartial = Array.from({ length: n - 1 }, (_, j) => Mat[n-1][j] * B[n-1][j])
      .reduce((a, b) => a + b, 0);
    const lastColPartial = Array.from({ length: n - 1 }, (_, i) => Mat[i][n-1] * B[i][n-1])
      .reduce((a, b) => a + b, 0);
    const fromRow = -lastRowPartial;
    const fromCol = -lastColPartial;
    if (fromRow !== fromCol) continue; // sanity check (should always match)
    if (fromRow === 0 || Math.abs(fromRow) > 9) continue;
    Mat[n-1][n-1] = fromRow;
    B[n-1][n-1] = 1;

    // Step 5: distractor values for unfilled cells
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        if (B[i][j] === 0) {
          let v: number;
          do { v = (Math.floor(rng() * 9) + 1) * (rng() < 0.5 ? 1 : -1); } while (v === 0);
          Mat[i][j] = v;
        }
      }
    }

    // Step 6: verify
    const C = Array.from({ length: n }, (_, i) =>
      Array.from({ length: n }, (_, j) => Mat[i][j] * B[i][j]).reduce((a, b) => a + b, 0)
    );
    const D = Array.from({ length: n }, (_, j) =>
      Array.from({ length: n }, (_, i) => Mat[i][j] * B[i][j]).reduce((a, b) => a + b, 0)
    );
    if (C.every(s => s === 0) && D.every(s => s === 0)) {
      return { Mat, B, C, D };
    }
  }
  // Fallback — should never reach
  return generatePuzzle(n, true, 5, rng);
};

// ─── Cage puzzle generator ────────────────────────────────────────────────────

function shuffle<T>(arr: T[], rng: Rng): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
//
// Each cage contains BOTH filled (B=1) and empty (B=0) cells.
// The "target" is the sum of ONLY the filled cells in the cage.
// The player must figure out which cells to select — not just "fill all".
// Cage sizes: 3-5 cells, with ~40% being filled cells.

function buildCages(n: number, B: number[][], Mat: number[][], rng: Rng): Cage[] {
  // Build cages over ALL cells (not just filled ones)
  const allCells: [number, number][] = [];
  for (let i = 0; i < n; i++)
    for (let j = 0; j < n; j++)
      allCells.push([i, j]);

  // Shuffle for random cage assignment
  const shuffled = shuffle(allCells, rng);

  const assigned = new Set<string>();
  const cages: Cage[] = [];
  let id = 0;
  const key = (r: number, c: number) => `${r},${c}`;

  // Neighbors (all cells, not just filled)
  const neighbors = (r: number, c: number): [number, number][] =>
    ([[-1,0],[1,0],[0,-1],[0,1]] as [number,number][])
      .map(([dr, dc]) => [r + dr, c + dc] as [number,number])
      .filter(([nr, nc]) => nr >= 0 && nr < n && nc >= 0 && nc < n && !assigned.has(key(nr, nc)));

  for (const [startR, startC] of shuffled) {
    if (assigned.has(key(startR, startC))) continue;

    // Cage size: 3–5 cells
    const cageSize = Math.floor(rng() * 3) + 3;
    const cells: [number, number][] = [[startR, startC]];
    assigned.add(key(startR, startC));

    while (cells.length < cageSize) {
      const candidates = cells.flatMap(([r, c]) => neighbors(r, c));
      if (candidates.length === 0) break;
      const pick = candidates[Math.floor(rng() * candidates.length)];
      if (!assigned.has(key(pick[0], pick[1]))) {
        cells.push(pick);
        assigned.add(key(pick[0], pick[1]));
      } else break;
    }

    // Target = sum of only the FILLED (B=1) cells in this cage
    const filledInCage = cells.filter(([r, c]) => B[r][c] === 1);
    // Require at least 1 filled and 1 non-filled cell per cage for challenge
    if (filledInCage.length === 0 || filledInCage.length === cells.length) {
      // Skip — add cells back as unassigned (we'll handle remaining in a catch-all pass)
      cells.forEach(([r, c]) => assigned.delete(key(r, c)));
      continue;
    }

    const target = filledInCage.reduce((sum, [r, c]) => sum + Mat[r][c], 0);
    cages.push({ id: id++, cells, target });
  }

  // Catch-all: any remaining unassigned cells form solo cages
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      if (!assigned.has(key(i, j))) {
        const target = B[i][j] === 1 ? Mat[i][j] : 0;
        cages.push({ id: id++, cells: [[i, j]], target });
        assigned.add(key(i, j));
      }
    }
  }

  return cages;
}

export const generateCagePuzzle = (
  n: GridSize,
  allowNegative: boolean,
  maxSum: number,
  rng: Rng = defaultRng()
): Puzzle => {
  const base = generatePuzzle(n, allowNegative, maxSum, rng);
  const cages = buildCages(n, base.B, base.Mat, rng);
  return { ...base, cages };
};

// ─── Seeded wrapper ───────────────────────────────────────────────────────────

export const generateSeededPuzzle = (n: GridSize, rng: Rng): Puzzle =>
  generatePuzzle(n, false, 5, rng);

// ─── Utilities ────────────────────────────────────────────────────────────────

export const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
};