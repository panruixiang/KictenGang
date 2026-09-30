/**
 * 全局内存状态（Vue reactive，不持久化 —— 刷新后回到默认值）
 *
 * 说明：静态阶段所有"数据源"都收敛在这里（菜谱 / 记录 / 常备 / 食材字典），
 * 页面只读 store 或调用下面的小函数，后续接云开发时替换本模块即可。
 */

import { computed, reactive } from 'vue';
import { DEFAULT_STAPLES, INGREDIENT_DICT } from '@/mock/ingredients';
import { RECIPES } from '@/mock/recipes';
import type { CookingLog, IngredientGroup, Recipe } from '@/types';
import { shiftISODate, todayISO } from '@/utils/date';

export const store = reactive({
  /** 当前空间名（"我的"页可切换示意） */
  spaceName: '老张家的厨房',
  /** 全部菜谱（内置 + 自家，内存副本 —— 录入 / 编辑可就地改） */
  recipes: RECIPES.slice() as Recipe[],
  /** 收藏的菜谱 id（收藏为个人维度，各收各的） */
  favorites: ['qingzheng-luyu', 'gongbao-jiding', 'fanqie-chaodan-home'] as string[],
  /** 做菜记录流水（新记录排最前；预置一条"随手记"示例） */
  logs: [
    {
      id: 'log-demo-note',
      date: shiftISODate(todayISO(), -1),
      note: '夜里给娃煮了碗鸡蛋面，随手记一下',
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

/* ===== 做菜记录 ===== */

/** 新增一条做菜记录（新记录排最前） */
export function addLog(log: CookingLog) {
  store.logs.unshift(log);
}

/** 按 id 取做菜记录（记录只读浏览用） */
export function getLogById(id: string): CookingLog | undefined {
  return store.logs.find((l) => l.id === id);
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