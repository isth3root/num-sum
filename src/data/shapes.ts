import { type IrregularShape, type ShapeId } from "../types";

// Each shape is defined as a set of [row, col] cells within a bounding box.
// The bounding box is [rows, cols].

export const PREDEFINED_SHAPES: IrregularShape[] = [
  {
    id: "cross",
    name: "Cross",
    boundingBox: [5, 5],
    cells: [
      [0,2],[1,2],[2,0],[2,1],[2,2],[2,3],[2,4],[3,2],[4,2],
    ],
  },
  {
    id: "plus",
    name: "Plus",
    boundingBox: [3, 3],
    cells: [
      [0,1],[1,0],[1,1],[1,2],[2,1],
    ],
  },
  {
    id: "ring",
    name: "Ring",
    boundingBox: [4, 4],
    cells: [
      [0,0],[0,1],[0,2],[0,3],
      [1,0],            [1,3],
      [2,0],            [2,3],
      [3,0],[3,1],[3,2],[3,3],
    ],
  },
  {
    id: "diamond",
    name: "Diamond",
    boundingBox: [5, 5],
    cells: [
      [0,2],
      [1,1],[1,2],[1,3],
      [2,0],[2,1],[2,2],[2,3],[2,4],
      [3,1],[3,2],[3,3],
      [4,2],
    ],
  },
  {
    id: "lshape",
    name: "L-Shape",
    boundingBox: [4, 3],
    cells: [
      [0,0],[1,0],[2,0],[3,0],[3,1],[3,2],
    ],
  },
  {
    id: "tshape",
    name: "T-Shape",
    boundingBox: [3, 5],
    cells: [
      [0,0],[0,1],[0,2],[0,3],[0,4],
      [1,2],[2,2],
    ],
  },
];

/**
 * Generate a random blob shape using flood-fill.
 * @param targetSize  Approximate number of cells (e.g. 9–25)
 * @param seed        Random seed for reproducibility
 */
export function generateRandomShape(
  targetSize: number,
  rng: () => number
): IrregularShape {
  const grid = new Set<string>();
  const key = (r: number, c: number) => `${r},${c}`;
  const OFFSET = 20; // work in a large virtual grid, offset from 0

  // Start from center
  const startR = OFFSET, startC = OFFSET;
  grid.add(key(startR, startC));

  const dirs: [number, number][] = [[-1,0],[1,0],[0,-1],[0,1]];

  for (let attempt = 0; attempt < targetSize * 20 && grid.size < targetSize; attempt++) {
    // Pick a random existing cell and expand
    const existing = Array.from(grid);
    const base = existing[Math.floor(rng() * existing.length)];
    const [br, bc] = base.split(",").map(Number);
    const [dr, dc] = dirs[Math.floor(rng() * 4)];
    const nr = br + dr, nc = bc + dc;
    grid.add(key(nr, nc));
  }

  // Normalize to 0-based
  const cells = Array.from(grid).map(k => k.split(",").map(Number) as [number, number]);
  const minR = Math.min(...cells.map(c => c[0]));
  const minC = Math.min(...cells.map(c => c[1]));
  const normalized = cells.map(([r, c]) => [r - minR, c - minC] as [number, number]);
  const maxR = Math.max(...normalized.map(c => c[0]));
  const maxC = Math.max(...normalized.map(c => c[1]));

  return {
    id: "random",
    name: "Random",
    boundingBox: [maxR + 1, maxC + 1],
    cells: normalized,
  };
}

export function getShape(id: ShapeId, rng?: () => number, targetSize = 15): IrregularShape {
  if (id === "random") {
    return generateRandomShape(targetSize, rng ?? Math.random);
  }
  return PREDEFINED_SHAPES.find(s => s.id === id) ?? PREDEFINED_SHAPES[0];
}