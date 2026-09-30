/**
 * 数据模型（术语与 CONTEXT.md 保持一致）
 */

/** 配料分组：主料 / 辅料 / 调味料（调味料不参与"按食材反查"） */
export type IngredientGroup = '主料' | '辅料' | '调味料';

/** 配料：某份配方里的一行 —— 一个食材 + 用量 */
export interface RecipeIngredient {
  /** 食材名（取自食材词表） */
  name: string;
  /** 用量数字；null 表示特殊值"适量"（不参与换算） */
  amount: number | null;
  /** 用量单位（g / ml / 个 / 勺…）；amount 为 null 时为 null */
  unit: string | null;
  /** 分组 */
  group: IngredientGroup;
}

/** 做菜步骤 */
export interface RecipeStep {
  /** 步骤文字 */
  text: string;
  /** 可选计时时长（秒）；未设置时不显示"计时"按钮 */
  timerSec?: number;
}

/** 版本：同一道菜谱下并存的一份可编辑配方副本 */
export interface RecipeVersion {
  id: string;
  /** 版本名（如"默认版""少糖版"） */
  name: string;
  /** 该版本的配料 */
  ingredients: RecipeIngredient[];
}

/** 菜谱：一道菜的稳定做法 */
export interface Recipe {
  id: string;
  name: string;
  /** 菜系（川 / 粤 / 浙 / 家常） */
  cuisine: string;
  /** 耗时（分钟） */
  durationMin: number;
  /** 难度（简单 / 中等 / 较难） */
  difficulty: string;
  /** 份量：够几人吃；null 表示未填（不做换算） */
  servings: number | null;
  /** 封面图路径 */
  cover: string;
  /** 是否内置菜谱（内置菜只读） */
  isBuiltin: boolean;
  /** 来源小字（如"复制自内置 · 番茄炒蛋"），仅自家菜可能有 */
  source?: string;
  /** 配方版本列表，仅自家菜可能有 */
  versions?: RecipeVersion[];
  /** 配料（内置菜即唯一配方；自家菜为默认版本配方） */
  ingredients: RecipeIngredient[];
  /** 步骤 */
  steps: RecipeStep[];
}