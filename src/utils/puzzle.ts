import { type Puzzle, type GridSize, type Cage, type Difficulty } from "../types";

type Rng = () => number;
function defaultRng(): Rng { return () => Math.random(); }

function shuffle<T>(arr: T[], rng: Rng): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Difficulty → min number of rows+cols with |sum| < 7
// const DIFF_THRESHOLDS: Record<Difficulty, number> = {
//   easy: 0,    // filled in dynamically per size
//   medium: 0,
//   hard: 0,
// };

// Per-size min easy rows/cols with |sum| < 7
function minEasyCount(n: GridSize, difficulty: Difficulty): number {
  const table: Record<GridSize, Record<Difficulty, number>> = {
    3:  { easy: 2, medium: 1, hard: 0 },
    5:  { easy: 3, medium: 2, hard: 0 },
    7:  { easy: 4, medium: 3, hard: 1 },
    9:  { easy: 5, medium: 4, hard: 2 },
    11: { easy: 6, medium: 5, hard: 3 },
  };
  return table[n]?.[difficulty] ?? 0;
}

// ─── Standard puzzle generator ────────────────────────────────────────────────

export const generatePuzzle = (
  n: GridSize,
  allowNegative: boolean,
  difficulty: Difficulty = "easy",
  rng: Rng = defaultRng()
): Puzzle => {
  const minSmall = minEasyCount(n, difficulty);
  let Mat: number[][] = [], B: number[][] = [], MatB: number[][] = [];
  let C: number[] = [], D: number[] = [];
  let valid = false, attempts = 0;

  while (!valid && attempts < 5000) {
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
    C = MatB.map(row => row.reduce((a, b) => a + b, 0));
    D = MatB[0].map((_, j) => MatB.reduce((s, row) => s + row[j], 0));

    if (C.some(s => s === 0) || D.some(s => s === 0)) continue;

    // Count rows+cols with |sum| < 7
    const smallCount = [...C, ...D].filter(s => Math.abs(s) < 7).length;
    valid = smallCount >= minSmall;
  }

  const rowFillCount = Array.from({ length: n }, (_, i) =>
    Array.from({ length: n }, (_, j) => B[i][j]).reduce((a, b) => a + b, 0)
  );
  const colFillCount = Array.from({ length: n }, (_, j) =>
    Array.from({ length: n }, (_, i) => B[i][j]).reduce((a, b) => a + b, 0)
  );

  return { Mat, B, C, D, rowFillCount, colFillCount };
};

// ─── Diagonal puzzle generator ────────────────────────────────────────────────

export const generateDiagonalPuzzle = (
  n: GridSize,
  allowNegative: boolean,
  difficulty: Difficulty = "easy",
  rng: Rng = defaultRng()
): Puzzle => {
  const base = generatePuzzle(n, allowNegative, difficulty, rng);
  const { Mat, B } = base;
  const diagMain = Array.from({ length: n }, (_, i) => Mat[i][i] * B[i][i]).reduce((a, b) => a + b, 0);
  const diagAnti = Array.from({ length: n }, (_, i) => Mat[i][n - 1 - i] * B[i][n - 1 - i]).reduce((a, b) => a + b, 0);
  return { ...base, diagMain, diagAnti };
};

// ─── Zero-Sum puzzle generator ────────────────────────────────────────────────
//
// Guaranteed algebraic construction — BUT shuffles the "fixup" row and column
// so it's NOT always the last row/last column (preventing the trivial exploit).
//
// Algorithm:
//  1. Choose a random pivot row R and pivot col C
//  2. Fill all cells NOT in R or C freely
//  3. For each non-pivot row i: set Mat[i][C] to cancel row i's sum, B[i][C]=1
//  4. For each non-pivot col j: set Mat[R][j] to cancel col j's sum, B[R][j]=1
//  5. Corner Mat[R][C]: cancels both pivot row and pivot col
//  6. Shuffle Mat and B rows/cols so the pivot position is random visually

export const generateZeroSumPuzzle = (
  n: GridSize,
  rng: Rng = defaultRng()
): Puzzle => {
  for (let attempt = 0; attempt < 400; attempt++) {
    // Choose random pivot row and col indices
    const pivotRow = Math.floor(rng() * n);
    const pivotCol = Math.floor(rng() * n);

    const Mat: number[][] = Array(n).fill(null).map(() => Array(n).fill(0));
    const B:   number[][] = Array(n).fill(null).map(() => Array(n).fill(0));

    // Step 1: fill non-pivot rows × non-pivot cols
    for (let i = 0; i < n; i++) {
      if (i === pivotRow) continue;
      for (let j = 0; j < n; j++) {
        if (j === pivotCol) continue;
        B[i][j] = rng() < 0.5 ? 1 : 0;
        const v = Math.floor(rng() * 9) + 1;
        Mat[i][j] = rng() < 0.5 ? v : -v;
      }
    }

    // Step 2: pivot column — fix each non-pivot row sum to 0
    let ok = true;
    for (let i = 0; i < n; i++) {
      if (i === pivotRow) continue;
      const rowSum = Array.from({ length: n }, (_, j) =>
        j === pivotCol ? 0 : Mat[i][j] * B[i][j]
      ).reduce((a, b) => a + b, 0);
      const needed = -rowSum;
      if (needed === 0 || Math.abs(needed) > 9) { ok = false; break; }
      Mat[i][pivotCol] = needed;
      B[i][pivotCol] = 1;
    }
    if (!ok) continue;

    // Step 3: pivot row — fix each non-pivot col sum to 0
    for (let j = 0; j < n; j++) {
      if (j === pivotCol) continue;
      const colSum = Array.from({ length: n }, (_, i) =>
        i === pivotRow ? 0 : Mat[i][j] * B[i][j]
      ).reduce((a, b) => a + b, 0);
      const needed = -colSum;
      if (needed === 0 || Math.abs(needed) > 9) { ok = false; break; }
      Mat[pivotRow][j] = needed;
      B[pivotRow][j] = 1;
    }
    if (!ok) continue;

    // Step 4: corner cell at [pivotRow][pivotCol]
    const pivotRowPartial = Array.from({ length: n }, (_, j) =>
      j === pivotCol ? 0 : Mat[pivotRow][j] * B[pivotRow][j]
    ).reduce((a, b) => a + b, 0);
    const pivotColPartial = Array.from({ length: n }, (_, i) =>
      i === pivotRow ? 0 : Mat[i][pivotCol] * B[i][pivotCol]
    ).reduce((a, b) => a + b, 0);
    const fromRow = -pivotRowPartial;
    const fromCol = -pivotColPartial;
    if (fromRow !== fromCol) continue;
    if (fromRow === 0 || Math.abs(fromRow) > 9) continue;
    Mat[pivotRow][pivotCol] = fromRow;
    B[pivotRow][pivotCol] = 1;

    // Step 5: distractors for unfilled cells
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        if (B[i][j] === 0) {
          let v: number;
          do { v = (Math.floor(rng() * 9) + 1) * (rng() < 0.5 ? 1 : -1); } while (v === 0);
          Mat[i][j] = v;
        }
      }
    }

    // Step 6: shuffle rows then cols so the pivot isn't visually predictable
    const rowPerm = shuffle(Array.from({ length: n }, (_, i) => i), rng);
    const colPerm = shuffle(Array.from({ length: n }, (_, j) => j), rng);
    const sMat = rowPerm.map(r => colPerm.map(c => Mat[r][c]));
    const sB   = rowPerm.map(r => colPerm.map(c => B[r][c]));

    // Verify
    const C = Array.from({ length: n }, (_, i) =>
      Array.from({ length: n }, (_, j) => sMat[i][j] * sB[i][j]).reduce((a, b) => a + b, 0)
    );
    const D = Array.from({ length: n }, (_, j) =>
      Array.from({ length: n }, (_, i) => sMat[i][j] * sB[i][j]).reduce((a, b) => a + b, 0)
    );
    if (!C.every(s => s === 0) || !D.every(s => s === 0)) continue;

    const rowFillCount = Array.from({ length: n }, (_, i) => sB[i].reduce((a, b) => a + b, 0));
    const colFillCount = Array.from({ length: n }, (_, j) => Array.from({ length: n }, (_, i) => sB[i][j]).reduce((a, b) => a + b, 0));

    return { Mat: sMat, B: sB, C, D, rowFillCount, colFillCount };
  }
  // Fallback (should never reach)
  return generatePuzzle(n, true, "easy", rng);
};

// ─── Cage puzzle generator ────────────────────────────────────────────────────

function buildCages(n: number, B: number[][], Mat: number[][], rng: Rng): Cage[] {
  const allCells: [number, number][] = [];
  for (let i = 0; i < n; i++)
    for (let j = 0; j < n; j++)
      allCells.push([i, j]);

  const shuffled = shuffle(allCells, rng);
  const assigned = new Set<string>();
  const cages: Cage[] = [];
  let id = 0;
  const key = (r: number, c: number) => `${r},${c}`;

  const neighbors = (r: number, c: number): [number, number][] =>
    ([[-1,0],[1,0],[0,-1],[0,1]] as [number,number][])
      .map(([dr, dc]) => [r + dr, c + dc] as [number,number])
      .filter(([nr, nc]) => nr >= 0 && nr < n && nc >= 0 && nc < n && !assigned.has(key(nr, nc)));

  for (const [startR, startC] of shuffled) {
    if (assigned.has(key(startR, startC))) continue;

    const cageSize = Math.floor(rng() * 3) + 3; // 3–5
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

    const filledInCage = cells.filter(([r, c]) => B[r][c] === 1);
    if (filledInCage.length === 0 || filledInCage.length === cells.length) {
      cells.forEach(([r, c]) => assigned.delete(key(r, c)));
      continue;
    }

    const target = filledInCage.reduce((sum, [r, c]) => sum + Mat[r][c], 0);
    cages.push({ id: id++, cells, target });
  }

  // Catch-all for any unassigned cells
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      if (!assigned.has(key(i, j))) {
        cages.push({ id: id++, cells: [[i, j]], target: B[i][j] === 1 ? Mat[i][j] : 0 });
        assigned.add(key(i, j));
      }
    }
  }

  return cages;
}

export const generateCagePuzzle = (
  n: GridSize,
  allowNegative: boolean,
  difficulty: Difficulty = "easy",
  rng: Rng = defaultRng()
): Puzzle => {
  const base = generatePuzzle(n, allowNegative, difficulty, rng);
  const cages = buildCages(n, base.B, base.Mat, rng);
  return { ...base, cages };
};

// ─── Seeded wrapper ───────────────────────────────────────────────────────────

export const generateSeededPuzzle = (n: GridSize, rng: Rng): Puzzle =>
  generatePuzzle(n, false, "easy", rng);

// ─── Utilities ────────────────────────────────────────────────────────────────

export const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
};