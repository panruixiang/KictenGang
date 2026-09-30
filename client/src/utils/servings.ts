/**
 * 份量换算工具（菜谱详情、做菜引导、记一笔共用）
 *
 * 规则（见 REQUIREMENTS.md Q27 / Q28）：
 * - 比例 = 目标人数 ÷ 菜谱份量；
 * - "适量"等特殊值不参与换算，原样展示并标注；
 * - 菜谱份量未填（null）时不做换算，原样展示。
 */

/** "几人吃"的可选档位 */
export const SERVING_OPTIONS = [1, 2, 3, 4, 6];

export interface ScaledAmount {
  /** 展示文本（如 "600g" / "适量"） */
  text: string;
  /** 是否为"适量"这类特殊值（不参与换算，界面需标注"不换算"） */
  isSpecial: boolean;
}

/** 数字展示：最多保留一位小数，整数不带小数点（3.0 → "3"，1.5 → "1.5"） */
export function formatAmount(value: number): string {
  const rounded = Math.round(value * 10) / 10;
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
}

/**
 * 换算一行用量
 * @param amount 用量数字；null = 特殊值"适量"
 * @param unit 用量单位
 * @param recipeServings 菜谱份量（够几人吃）；null = 未填
 * @param targetServings 目标人数
 */
export function scaleAmount(
  amount: number | null,
  unit: string | null,
  recipeServings: number | null,
  targetServings: number,
): ScaledAmount {
  if (amount === null || !unit) {
    return { text: '适量', isSpecial: true };
  }
  if (!recipeServings || recipeServings <= 0) {
    return { text: `${formatAmount(amount)}${unit}`, isSpecial: false };
  }
  const ratio = targetServings / recipeServings;
  return { text: `${formatAmount(amount * ratio)}${unit}`, isSpecial: false };
}