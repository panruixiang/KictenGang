/**
 * 菜谱操作动作（Q31）：卡片长按操作菜单与删除二次确认
 * 菜谱库 / 收藏 / 反查结果三处列表共用，详情页删除复用同一确认逻辑。
 */
import { deleteRecipe } from '@/store';
import type { Recipe } from '@/types';

/** 删除确认框的危险红（仅用于 showModal confirmColor，不进设计 token） */
const DANGER_COLOR = '#E03131';

/**
 * 菜谱卡长按：弹出"编辑菜谱 / 删除菜谱"操作菜单
 * @param onDeleted 删除成功后的回调（如详情页需要返回上一页；列表页通常不传，靠响应式自动刷新）
 */
export function showRecipeCardActions(recipe: Recipe, onDeleted?: () => void): void {
  uni.showActionSheet({
    itemList: ['编辑菜谱', '删除菜谱'],
    success: (res) => {
      if (res.tapIndex === 0) {
        uni.navigateTo({ url: `/pages/recipe-form/index?id=${recipe.id}` });
        return;
      }
      if (res.tapIndex === 1) confirmDeleteRecipe(recipe, onDeleted);
    },
    // 用户取消菜单属正常操作，fail 回调静默
    fail: () => undefined,
  });
}

/** 删除二次确认；确认后删菜谱 + 清收藏（store 内处理），历史做菜记录保留 */
export function confirmDeleteRecipe(recipe: Recipe, onDeleted?: () => void): void {
  uni.showModal({
    title: '删除菜谱',
    content: `删除「${recipe.name}」后不可恢复，过往做菜记录会保留。`,
    confirmText: '删除',
    confirmColor: DANGER_COLOR,
    success: (res) => {
      if (!res.confirm) return;
      deleteRecipe(recipe.id);
      uni.showToast({ title: '已删除', icon: 'none' });
      onDeleted?.();
    },
  });
}
