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

/** 食材字典条目（反查勾选 / 录入选择共用，Q8 薄版词表） */
export interface IngredientDictItem {
  /** 食材名 */
  name: string;
  /** 分类（主料 / 辅料 / 调味料） */
  group: IngredientGroup;
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
  /** 是否预置初始数据（仅供空态演示过滤；Q31 起无权限 / 展示差异，所有菜谱都可编辑删除） */
  isBuiltin: boolean;
  /** 来源小字（历史数据保留；Q31 起 UI 不再展示） */
  source?: string;
  /** 配方版本列表，仅自家菜可能有 */
  versions?: RecipeVersion[];
  /** 配料（内置菜即唯一配方；自家菜为默认版本配方） */
  ingredients: RecipeIngredient[];
  /** 步骤 */
  steps: RecipeStep[];
}

/** 做菜记录里"本次配方"的一行（记一笔 / 记录只读共用） */
export interface CookingLogIngredient {
  name: string;
  /** 用量数字；null = 特殊值"适量" */
  amount: number | null;
  unit: string | null;
  group: IngredientGroup;
  /** 这行"这次改过"（用量与菜谱配方不同） */
  changed?: boolean;
}

/** 空间成员（头像 = 彩色圆 + 首字） */
export interface Member {
  id: string;
  /** 成员名字 */
  name: string;
  /** 头像首字 */
  initial: string;
  /** 头像底色（彩色圆） */
  color: string;
}

/** 点菜时间标签（轻量，不做日历） */
export type OrderTimeTag = '今晚' | '明天午餐' | '明天晚餐' | '周末' | '不着急';

/** 点菜状态：求菜中 / 已认领 / 已完成 / 已取消 */
export type DishOrderStatus = 'open' | 'claimed' | 'done' | 'cancelled';

/** 点菜：群聊里的结构化业务对象（一条可被认领/完成的"想吃"请求） */
export interface DishOrder {
  id: string;
  /** 关联菜谱 id；手写菜无 */
  recipeId?: string;
  /** 菜品名（库菜取菜谱名快照，手写菜取输入值） */
  dishName: string;
  /** 库菜封面快照；手写菜无 */
  cover?: string;
  /** 时间标签 */
  timeTag: OrderTimeTag;
  /** 点菜人 */
  requesterId: string;
  /** 被@的指派人；空 = 公开求菜（婉拒后也清空） */
  assigneeId?: string;
  /** 认领人（实际做饭人） */
  claimerId?: string;
  status: DishOrderStatus;
  /** 完成时关联的做菜记录 id */
  logId?: string;
  /** 创建时间（YYYY-MM-DD HH:mm） */
  createdAt: string;
}

/** 群聊消息类型：文字 / 点菜卡片 / 系统提示 */
export type ChatMessageType = 'text' | 'order' | 'system';

/** 群聊消息 */
export interface ChatMessage {
  id: string;
  type: ChatMessageType;
  /** 发送人；system 无 */
  senderId?: string;
  /** text：文字内容；system：最终提示文案 */
  text?: string;
  /** order：关联的点菜 id */
  orderId?: string;
  /** 发送时间（YYYY-MM-DD HH:mm） */
  createdAt: string;
}

/** 做菜记录：做完一道菜的流水；不关联菜谱时即"随手记" */
export interface CookingLog {
  id: string;
  /** 日期（YYYY-MM-DD） */
  date: string;
  /** 关联菜谱 id；无 → 随手记 */
  recipeId?: string;
  /** 关联菜谱名（列表展示用） */
  recipeName?: string;
  /** 关联版本名（可选；无 → 不显示版本 chip） */
  versionName?: string;
  /** 备注（可空） */
  note: string;
  /** 完成时刻（YYYY-MM-DD HH:mm）；引导页"完成"打卡时自动写入，可缺省 */
  completedAt?: string;
  /** 做饭人（群聊点菜完成打卡时写入；旧预置数据无此字段） */
  cookMemberId?: string;
  /** 本次做菜人数（可选） */
  servings?: number;
  /** 本次配方副本（关联菜谱时才有） */
  ingredients?: CookingLogIngredient[];
}