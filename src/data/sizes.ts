import { type SizeConfig } from "../types";

export const sizeConfigs: SizeConfig[] = [
  { n: 3, label: "Tiny", tag: "3×3", maxSum: 3, allowNegative: false },
  { n: 5, label: "Small", tag: "5×5", maxSum: 4, allowNegative: false },
  { n: 7, label: "Medium", tag: "7×7", maxSum: 5, allowNegative: true },
  { n: 9, label: "Big", tag: "9×9", maxSum: 6, allowNegative: true },
  { n: 13, label: "Enormous", tag: "13×13", maxSum: 8, allowNegative: true },
];

export const defaultSizeIndex = 1; // 5×5