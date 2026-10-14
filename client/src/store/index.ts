/**
 * 全局内存状态（Vue reactive，不持久化 —— 刷新后回到默认值）
 *
 * 说明：静态阶段所有"数据源"都收敛在这里（菜谱 / 记录 / 常备 / 食材字典），
 * 页面只读 store 或调用下面的小函数，后续接云开发时替换本模块即可。
 */

import { computed, reactive } from 'vue';
import {
  buildSeedMessages,
  buildSeedOrders,
  INITIAL_UNREAD,
  MEMBERS,
  MEMBER_ZHANG,
  SPACE_MAIN,
} from '@/mock/chat';
import { DEFAULT_STAPLES, INGREDIENT_DICT } from '@/mock/ingredients';
import { RECIPES } from '@/mock/recipes';
import type {
  ChatMessage,
  CookingLog,
  DishOrder,
  IngredientGroup,
  Member,
  OrderTimeTag,
  Recipe,
} from '@/types';
import { shiftISODate, toISODateTime, todayISO } from '@/utils/date';

/** 种子群聊消息只构建一次（同时作为各成员初始已读游标的计算基准） */
const seedMessagesBySpace: Record<string, ChatMessage[]> = {
  [SPACE_MAIN]: buildSeedMessages(),
};

/**
 * 各成员在各空间的"已读到第几条"游标（成员 id -> 空间名 -> 已读消息条数）。
 * 初始值 = 种子消息总数 - INITIAL_UNREAD：保证每位家人打开应用时都带着初始未读，
 * 且别人之后新发的消息会自然落在游标之后、计入该成员的未读。
 */
function buildInitialReadCursors(): Record<string, Record<string, number>> {
  const map: Record<string, Record<string, number>> = {};
  MEMBERS.forEach((m) => {
    map[m.id] = {};
    Object.keys(INITIAL_UNREAD).forEach((space) => {
      const total = seedMessagesBySpace[space]?.length ?? 0;
      map[m.id][space] = Math.max(0, total - (INITIAL_UNREAD[space] ?? 0));
    });
  });
  return map;
}

export const store = reactive({
  /** 当前空间名（"我的"页可切换示意） */
  spaceName: SPACE_MAIN,
  /** 空间成员（4 位；群聊 / 我的 / 记录归属共用唯一数据源） */
  members: MEMBERS.slice() as Member[],
  /** 当前操作人 id（默认老张；群信息页可做原型演示切换） */
  currentMemberId: MEMBER_ZHANG,
  /** 各空间的群聊消息（按空间名分桶，正序：旧 → 新） */
  messagesBySpace: seedMessagesBySpace as Record<string, ChatMessage[]>,
  /** 全部点菜（id -> 订单；消息只存 orderId 引用） */
  ordersById: buildSeedOrders().reduce(
    (map, order) => {
      map[order.id] = order;
      return map;
    },
    {} as Record<string, DishOrder>,
  ),
  /**
   * 未读模型：各成员在各空间的已读游标（已读到消息流第几条）。
   * 未读数 = 游标之后、非本人发送的消息条数（getUnread 实时聚合，不存计数器）。
   */
  readCursorByMember: buildInitialReadCursors(),
  /** 全部菜谱（内置 + 自家，内存副本 —— 录入 / 编辑可就地改） */
  recipes: RECIPES.slice() as Recipe[],
  /** 收藏的菜谱 id（收藏为个人维度，各收各的） */
  favorites: ['qingzheng-luyu', 'gongbao-jiding', 'fanqie-chaodan-home'] as string[],
  /**
   * 做菜记录流水（新记录排最前）
   * 预置：宫保鸡丁 2 条历史完成记录（含完成时刻，演示"做过 N 次 · 最近一次"）+ 一条"随手记"
   */
  logs: [
    {
      id: 'log-demo-gongbao-1',
      date: shiftISODate(todayISO(), -1),
      recipeId: 'gongbao-jiding',
      recipeName: '宫保鸡丁',
      versionName: '默认版',
      servings: 2,
      note: '',
      completedAt: `${shiftISODate(todayISO(), -1)} 18:42`,
    },
    {
      id: 'log-demo-note',
      date: shiftISODate(todayISO(), -1),
      note: '夜里给娃煮了碗鸡蛋面，随手记一下',
    },
    {
      id: 'log-demo-gongbao-2',
      date: shiftISODate(todayISO(), -5),
      recipeId: 'gongbao-jiding',
      recipeName: '宫保鸡丁',
      versionName: '默认版',
      servings: 2,
      note: '花生米多放了一把，更香',
      completedAt: `${shiftISODate(todayISO(), -5)} 19:05`,
    },
  ] as CookingLog[],
  /** 食材字典（录入表单"新建食材"可就地追加） */
  ingredientDict: INGREDIENT_DICT.slice(),
  /** "我家常备"清单（工单 09 维护；反查页默认勾选跟着它走） */
  staples: [...DEFAULT_STAPLES],
  /** 反查页"当次加选"（非常备、但这次勾上的食材） */
  searchAdded: [] as string[],
  /** 反查页"当次取消"（常备、但这次没勾的食材） */
  searchRemoved: [] as string[],
});

/* ===== 菜谱 ===== */

/** 取全部菜谱（内置 + 自家） */
export function getAllRecipes(): Recipe[] {
  return store.recipes;
}

/** 按 id 取菜谱 */
export function getRecipeById(id: string): Recipe | undefined {
  return store.recipes.find((r) => r.id === id);
}

/**
 * 删除菜谱（Q31）：移除菜谱本身并清掉收藏 id。
 * 做菜记录不动——菜名 / 完成时刻是记录自身快照，悬空 recipeId 无外键、无跳转入口。
 */
export function deleteRecipe(id: string): void {
  const idx = store.recipes.findIndex((r) => r.id === id);
  if (idx >= 0) store.recipes.splice(idx, 1);
  const favIdx = store.favorites.indexOf(id);
  if (favIdx >= 0) store.favorites.splice(favIdx, 1);
}

/* ===== 做菜记录 ===== */

/** 新增一条做菜记录（新记录排最前） */
export function addLog(log: CookingLog) {
  store.logs.unshift(log);
}

/** 按 id 取做菜记录（记录只读浏览用） */
export function getLogById(id: string): CookingLog | undefined {
  return store.logs.find((l) => l.id === id);
}

/** 引导页"完成"一键打卡的入参 */
export interface QuickLogInput {
  recipe: Recipe;
  /** 当前选中版本名（内置菜传"默认版"；无版本可省略） */
  versionName?: string;
  /** 本次做菜人数 */
  servings: number;
  /** 做饭人（群聊点菜联动时传认领人；普通打卡省略） */
  cookMemberId?: string;
}

/**
 * 一键完成：落一条最简做菜记录（Q30）
 * 只带菜谱 / 版本 / 人数 / 完成时刻，无备注、无本次配方；细节由"记一笔"在同一条上补。
 */
export function addQuickLog(input: QuickLogInput): CookingLog {
  const now = new Date();
  const log: CookingLog = {
    id: `log-${Date.now()}`,
    date: todayISO(),
    recipeId: input.recipe.id,
    recipeName: input.recipe.name,
    versionName: input.versionName || undefined,
    note: '',
    completedAt: toISODateTime(now),
    servings: input.servings,
    cookMemberId: input.cookMemberId || undefined,
  };
  store.logs.unshift(log);
  return log;
}

/**
 * 手写点菜（库外菜）完成：落一条无菜谱关联的记录（表现等同"随手记"），
 * 但带菜名（记录页据此显示菜名分组）、完成时刻与做饭人。
 */
export function addOrderManualLog(dishName: string, cookMemberId: string): CookingLog {
  const log: CookingLog = {
    id: `log-${Date.now()}`,
    date: todayISO(),
    recipeName: dishName,
    note: '群里点菜做的',
    completedAt: toISODateTime(new Date()),
    cookMemberId,
  };
  store.logs.unshift(log);
  return log;
}

/** 就地更新一条做菜记录（完成打卡后用"记一笔"补细节时用，不新增第二条） */
export function updateLog(id: string, patch: Partial<CookingLog>): void {
  const target = store.logs.find((l) => l.id === id);
  if (target) Object.assign(target, patch);
}

/** 某道菜的做过统计：次数与最近一条记录（由记录流水实时聚合，不存计数器；随手记不计入） */
export function getCookedStats(recipeId: string): { count: number; lastLog?: CookingLog } {
  const list = store.logs.filter((l) => l.recipeId === recipeId);
  if (list.length === 0) return { count: 0 };
  // 完成时刻 / 日期均为定长 YYYY-MM-DD（HH:mm）格式，字典序即时间序
  const timeKey = (l: CookingLog) => l.completedAt ?? `${l.date} 00:00`;
  const lastLog = list.reduce((latest, l) => (timeKey(l) > timeKey(latest) ? l : latest));
  return { count: list.length, lastLog };
}

/* ===== 收藏（个人维度） ===== */

/** 切换某道菜的收藏状态 */
export function toggleFavorite(recipeId: string) {
  const idx = store.favorites.indexOf(recipeId);
  if (idx >= 0) {
    store.favorites.splice(idx, 1);
  } else {
    store.favorites.push(recipeId);
  }
}

/** 某道菜是否已收藏 */
export function isFavorite(recipeId: string): boolean {
  return store.favorites.includes(recipeId);
}

/* ===== 常备 与 反查勾选（同一份 store，两页联动） ===== */

/** 某食材是否已加入"我家常备" */
export function isStaple(name: string): boolean {
  return store.staples.includes(name);
}

/** 加入 / 移出常备（工单 09 常备维护页用）；同步清理反查页的"当次增减"残留 */
export function toggleStaple(name: string) {
  const idx = store.staples.indexOf(name);
  if (idx >= 0) {
    store.staples.splice(idx, 1);
    // 移出常备时，若它曾被"当次加选"，一并清掉，让反查勾选与常备保持一致
    const addedIdx = store.searchAdded.indexOf(name);
    if (addedIdx >= 0) store.searchAdded.splice(addedIdx, 1);
  } else {
    store.staples.push(name);
    // 加入常备时，清掉"当次取消"残留，否则反查页会一直显示未勾选
    const removedIdx = store.searchRemoved.indexOf(name);
    if (removedIdx >= 0) store.searchRemoved.splice(removedIdx, 1);
  }
}

/**
 * 反查页：某食材当次是否勾选
 * 默认跟随"我家常备"，可以在反查页当次增减（不改常备清单本身）
 */
export function isSearchChecked(name: string): boolean {
  if (store.searchRemoved.includes(name)) return false;
  if (store.searchAdded.includes(name)) return true;
  return store.staples.includes(name);
}

/** 反查页：勾选 / 取消（只影响"当次"，不改常备） */
export function toggleSearchChecked(name: string) {
  if (isSearchChecked(name)) {
    const addedIdx = store.searchAdded.indexOf(name);
    if (addedIdx >= 0) {
      store.searchAdded.splice(addedIdx, 1);
    } else if (store.staples.includes(name)) {
      store.searchRemoved.push(name);
    }
  } else {
    const removedIdx = store.searchRemoved.indexOf(name);
    if (removedIdx >= 0) {
      store.searchRemoved.splice(removedIdx, 1);
    } else {
      store.searchAdded.push(name);
    }
  }
}

/** 反查页：清空当次勾选（常备也一并临时取消，不改常备清单） */
export function clearSearchChecked() {
  store.searchAdded = [];
  store.searchRemoved = [...store.staples];
}

/** 反查页：当前勾选的食材名列表（按字典顺序） */
export const searchCheckedNames = computed(() =>
  store.ingredientDict.filter((i) => isSearchChecked(i.name)).map((i) => i.name),
);

/** 录入表单：新建食材（加入字典，各页共用） */
export function addIngredientToDict(name: string, group: IngredientGroup) {
  if (!store.ingredientDict.some((i) => i.name === name)) {
    store.ingredientDict.push({ name, group });
  }
}

/* ===== 空间成员与家庭群聊 ===== */

/** 成员查不到时的兜底头像（数据异常时也不允许渲染崩） */
const FALLBACK_MEMBER: Member = { id: 'm-unknown', name: '家人', initial: '?', color: '#9A928A' };

/** 取全部成员 */
export function getMembers(): Member[] {
  return store.members;
}

/** 按 id 取成员（找不到返回兜底成员） */
export function getMember(id?: string): Member {
  return store.members.find((m) => m.id === id) ?? FALLBACK_MEMBER;
}

/** 取某空间的消息流（正序：旧 → 新；无桶返回空数组） */
export function getMessages(spaceName: string = store.spaceName): ChatMessage[] {
  return store.messagesBySpace[spaceName] ?? [];
}

/**
 * 某成员在某空间的未读数：已读游标之后、且不是该成员自己发的消息条数。
 * 系统提示（无 senderId）与点菜卡都计入；自己发的任何内容不计入自己的未读。
 */
export function getUnread(
  spaceName: string = store.spaceName,
  memberId: string = store.currentMemberId,
): number {
  const list = store.messagesBySpace[spaceName] ?? [];
  const cursor = store.readCursorByMember[memberId]?.[spaceName] ?? 0;
  let count = 0;
  for (let i = cursor; i < list.length; i += 1) {
    if (list[i].senderId !== memberId) count += 1;
  }
  return count;
}

/** 进入群聊页：把当前成员在当前空间的已读游标推到最新（红点 API 由页面调用） */
export function enterChatClearUnread(): void {
  const memberId = store.currentMemberId;
  if (!store.readCursorByMember[memberId]) store.readCursorByMember[memberId] = {};
  store.readCursorByMember[memberId][store.spaceName] = (
    store.messagesBySpace[store.spaceName] ?? []
  ).length;
}

/** 切换"当前操作人"（仅群信息页原型演示用；非法 id 静默忽略） */
export function setCurrentMember(id: string): void {
  if (store.members.some((m) => m.id === id)) {
    store.currentMemberId = id;
  }
}

/** 往当前空间群聊发一条文字消息（trim 后为空不发；桶不存在则建桶） */
export function sendText(text: string): ChatMessage | null {
  const content = text.trim();
  if (!content) return null;
  const space = store.spaceName;
  if (!store.messagesBySpace[space]) {
    store.messagesBySpace[space] = [];
  }
  const msg: ChatMessage = {
    id: `msg-${Date.now()}`,
    type: 'text',
    senderId: store.currentMemberId,
    text: content,
    createdAt: toISODateTime(new Date()),
  };
  store.messagesBySpace[space].push(msg);
  return msg;
}

/* ===== 点菜 ===== */

/** 发起点菜入参 */
export interface CreateOrderInput {
  /** 关联菜谱 id；手写菜无 */
  recipeId?: string;
  /** 菜品名（库菜取菜谱名，手写取输入值） */
  dishName: string;
  /** 库菜封面；手写菜无 */
  cover?: string;
  timeTag: OrderTimeTag;
  /** 被@的指派人；空 = 公开求菜 */
  assigneeId?: string;
}

/** 按 id 取点菜订单 */
export function getOrder(id: string): DishOrder | undefined {
  return store.ordersById[id];
}

/** 往指定空间追加一条系统提示消息 */
function appendSystemMessage(spaceName: string, text: string): ChatMessage {
  if (!store.messagesBySpace[spaceName]) {
    store.messagesBySpace[spaceName] = [];
  }
  const msg: ChatMessage = {
    id: `sys-${Date.now()}-${Math.floor(Math.random() * 1e4)}`,
    type: 'system',
    text,
    createdAt: toISODateTime(new Date()),
  };
  store.messagesBySpace[spaceName].push(msg);
  return msg;
}

/** 找到点菜订单所在的空间桶（按引用该 orderId 的消息反查） */
function findSpaceOfOrder(orderId: string): string | undefined {
  return Object.keys(store.messagesBySpace).find((space) =>
    store.messagesBySpace[space].some((m) => m.type === 'order' && m.orderId === orderId),
  );
}

/**
 * 发起点菜：创建订单（open）并在当前空间消息流插入卡片消息。
 * 卡片自身已含点菜人/时间/指派人信息，不再额外插系统提示。
 */
export function createOrder(input: CreateOrderInput): DishOrder {
  const now = toISODateTime(new Date());
  const order: DishOrder = {
    id: `order-${Date.now()}`,
    recipeId: input.recipeId,
    dishName: input.dishName,
    cover: input.cover,
    timeTag: input.timeTag,
    requesterId: store.currentMemberId,
    assigneeId: input.assigneeId || undefined,
    status: 'open',
    createdAt: now,
  };
  store.ordersById[order.id] = order;

  const space = store.spaceName;
  if (!store.messagesBySpace[space]) {
    store.messagesBySpace[space] = [];
  }
  const msg: ChatMessage = {
    id: `msg-${Date.now()}-order`,
    type: 'order',
    senderId: store.currentMemberId,
    orderId: order.id,
    createdAt: now,
  };
  store.messagesBySpace[space].push(msg);
  return order;
}

/** 点菜人撤单（仅 open 态、本人操作）；卡片置 cancelled 并追加系统提示 */
export function cancelOrder(id: string): DishOrder | null {
  const order = store.ordersById[id];
  if (!order || order.status !== 'open' || order.requesterId !== store.currentMemberId) {
    return null;
  }
  order.status = 'cancelled';
  const space = findSpaceOfOrder(id);
  if (space) {
    appendSystemMessage(space, `${getMember(order.requesterId).name} 取消了「${order.dishName}」的点菜`);
  }
  return order;
}

/**
 * 被指派人婉拒（仅 open 且 @的是我）：
 * 不改变 open 状态，只清掉指派人，卡片变为公开求菜，其他成员仍可认领。
 */
export function declineOrder(id: string): DishOrder | null {
  const order = store.ordersById[id];
  if (!order || order.status !== 'open' || order.assigneeId !== store.currentMemberId) {
    return null;
  }
  order.assigneeId = undefined;
  const space = findSpaceOfOrder(id);
  if (space) {
    appendSystemMessage(
      space,
      `${getMember(store.currentMemberId).name} 婉拒了「${order.dishName}」，看看谁有空～`,
    );
  }
  return order;
}

/**
 * 认领 / 接单 / 抢单（open 态任何成员都可，含点菜人本人）：
 * - 原本@的就是我、或本来就是公开求菜 → "认领了"
 * - 我不是被指派人 → "举手…我来做"（抢单）
 */
export function claimOrder(id: string): DishOrder | null {
  const order = store.ordersById[id];
  if (!order || order.status !== 'open' || order.claimerId) {
    return null;
  }
  const me = store.currentMemberId;
  order.claimerId = me;
  order.status = 'claimed';
  const myName = getMember(me).name;
  const isGrab = !!order.assigneeId && order.assigneeId !== me;
  const space = findSpaceOfOrder(id);
  if (space) {
    appendSystemMessage(
      space,
      isGrab
        ? `${myName} 举手：${order.timeTag}的「${order.dishName}」我来做`
        : `${myName} 认领了${order.timeTag}的「${order.dishName}」`,
    );
  }
  return order;
}

/**
 * 认领人释放（claimed 且我是认领人）：回 open、清认领人；
 * 若原本@的就是自己，一并清指派人，避免释放后又@回自己。
 */
export function releaseOrder(id: string): DishOrder | null {
  const order = store.ordersById[id];
  if (!order || order.status !== 'claimed' || order.claimerId !== store.currentMemberId) {
    return null;
  }
  const me = store.currentMemberId;
  order.status = 'open';
  order.claimerId = undefined;
  if (order.assigneeId === me) order.assigneeId = undefined;
  const space = findSpaceOfOrder(id);
  if (space) {
    appendSystemMessage(
      space,
      `${getMember(me).name} 暂时做不了${order.timeTag}的「${order.dishName}」了`,
    );
  }
  return order;
}

/** 完成点菜的结果 */
export interface CompleteOrderResult {
  order: DishOrder;
  /** 本次新落的做菜记录（existingLogId 回写路径无） */
  log?: CookingLog;
}

/**
 * 完成点菜（claimed 且我是认领人）：
 * - existingLogId 缺省：库菜落最简打卡记录（菜谱被删退化手写式），手写菜落带菜名记录；均写做饭人
 * - existingLogId 存在（做菜引导页完成回写）：不再落新记录，只关联 logId
 * 幂等：已 done 直接返回，不产生第二条记录。
 */
export function completeOrder(id: string, existingLogId?: string): CompleteOrderResult | null {
  const order = store.ordersById[id];
  if (!order || order.status === 'cancelled') return null;
  if (order.status === 'done') return { order };
  if (order.status !== 'claimed' || order.claimerId !== store.currentMemberId) return null;

  const claimerId = order.claimerId;
  let log: CookingLog | undefined;
  if (existingLogId) {
    order.logId = existingLogId;
  } else {
    const recipe = order.recipeId ? getRecipeById(order.recipeId) : undefined;
    if (recipe) {
      log = addQuickLog({ recipe, servings: recipe.servings ?? 2, cookMemberId: claimerId });
    } else {
      // 手写菜，或菜谱已被删除：按库外菜落记录
      log = addOrderManualLog(order.dishName, claimerId);
    }
    order.logId = log.id;
  }
  order.status = 'done';

  const space = findSpaceOfOrder(id);
  if (space) {
    appendSystemMessage(
      space,
      `${getMember(claimerId).name} 做好了${order.timeTag}的「${order.dishName}」`,
    );
  }
  return log ? { order, log } : { order };
}