/**
 * 全局内存状态（Vue reactive，不持久化 —— 刷新后回到默认值）
 */

import { reactive } from 'vue';

export const store = reactive({
  /** 当前空间名 */
  spaceName: '老张家的厨房',
  /** 收藏的菜谱 id（收藏为个人维度，各收各的） */
  favorites: ['qingzheng-luyu'] as string[],
});

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