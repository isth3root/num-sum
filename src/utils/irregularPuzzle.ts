import { type IrregularCell, type IrregularShape } from "../types";

type Rng = () => number;

export interface IrregularPuzzle {
  shape: IrregularShape;
  cells: IrregularCell[];
  // Row sums and col sums only for rows/cols that have active cells
  rowSums: Map<number, number>;  // row → target sum of selected cells in that row
  colSums: Map<number, number>;  // col → target sum
}

export function generateIrregularPuzzle(
  shape: IrregularShape,
  rng: Rng
): IrregularPuzzle {
//   const cellSet = new Set(shape.cells.map(([r, c]) => `${r},${c}`));

  let cells: IrregularCell[] = [];
  let rowSums = new Map<number, number>();
  let colSums = new Map<number, number>();
  let valid = false;
  let attempts = 0;

  while (!valid && attempts < 3000) {
    attempts++;

    cells = shape.cells.map(([row, col]) => {
      const value = Math.floor(rng() * 9) + 1;
      const solution = Math.round(rng()) as 0 | 1;
      return { row, col, value, solution };
    });

    // Compute row and col sums for selected cells
    rowSums = new Map();
    colSums = new Map();
    for (const cell of cells) {
      if (cell.solution === 1) {
        rowSums.set(cell.row, (rowSums.get(cell.row) ?? 0) + cell.value);
        colSums.set(cell.col, (colSums.get(cell.col) ?? 0) + cell.value);
      }
    }

    // Validation: every active row and col must have a non-zero sum
    const rowsWithCells = new Set(shape.cells.map(([r]) => r));
    const colsWithCells = new Set(shape.cells.map(([, c]) => c));

    const rowsValid = Array.from(rowsWithCells).every(r => (rowSums.get(r) ?? 0) !== 0);
    const colsValid = Array.from(colsWithCells).every(c => (colSums.get(c) ?? 0) !== 0);

    valid = rowsValid && colsValid;
  }

  return { shape, cells, rowSums, colSums };
}