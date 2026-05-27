import { type SizeConfig } from "../types";

export const sizeConfigs: SizeConfig[] = [
  {
    n: 3, label: "Tiny", tag: "3×3", allowNegative: false,
    difficulties: { easy: 2, medium: 1, hard: 0 },
  },
  {
    n: 5, label: "Small", tag: "5×5", allowNegative: false,
    difficulties: { easy: 3, medium: 2, hard: 0 },
  },
  {
    n: 7, label: "Medium", tag: "7×7", allowNegative: true,
    difficulties: { easy: 4, medium: 3, hard: 1 },
  },
  {
    n: 9, label: "Big", tag: "9×9", allowNegative: true,
    difficulties: { easy: 5, medium: 4, hard: 2 },
  },
  {
    n: 11, label: "Large", tag: "11×11", allowNegative: true,
    difficulties: { easy: 6, medium: 5, hard: 3 },
  },
];

export const defaultSizeIndex = 1; // 5×5