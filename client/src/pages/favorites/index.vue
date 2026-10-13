<script setup lang="ts">
import { ref } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import NavBar from '@/components/NavBar.vue';
import RecipeCard from '@/components/RecipeCard.vue';
import { getCookedStats, getRecipeById, isFavorite, store, toggleFavorite } from '@/store';
import type { Recipe } from '@/types';
import { showRecipeCardActions } from '@/utils/recipe-actions';

/**
 * 我的收藏 · 工单 12
 * - 数据 = 收藏 store（与首页心形双向联动）
 * - 进入时对收藏列表做一次快照：取消收藏后心形变空心、卡片先留在页上（两态可见），
 *   离开再进来才按最新收藏刷新（原型演示用）
 */

const list = ref<Recipe[]>([]);

onLoad(() => {
  list.value = store.favorites
    .map((id) => getRecipeById(id))
    .filter((r): r is Recipe => !!r);
});

/** 快照里的菜可能已在别处（或本页长按）被删除：无存在性校验会进白屏详情 / 误成新建表单 */
function ensureExists(recipe: Recipe): boolean {
  if (getRecipeById(recipe.id)) return true;
  uni.showToast({ title: '这道菜已被删除', icon: 'none' });
  return false;
}

function goDetail(recipe: Recipe) {
  if (!ensureExists(recipe)) return;
  uni.navigateTo({ url: `/pages/recipe-detail/index?id=${recipe.id}` });
}

/**
 * 长按卡片：编辑 / 删除菜单（Q31）
 * 本页列表是进入时的快照：删除后卡片沿用既有策略留在本页（心形因收藏被清而变空），
 * 仅 toast 提示，下次进入按最新数据刷新
 */
function onCardLongPress(recipe: Recipe) {
  if (!ensureExists(recipe)) return;
  showRecipeCardActions(recipe);
}
</script>

<template>
  <view class="page">
    <NavBar title="我的收藏" />

    <view class="body">
      <view v-for="r in list" :key="r.id" class="body__item">
        <RecipeCard
          :recipe="r"
          :favorited="isFavorite(r.id)"
          :cooked-count="getCookedStats(r.id).count"
          @tap="goDetail(r)"
          @long-press="onCardLongPress(r)"
          @toggle-favorite="toggleFavorite(r.id)"
        />
      </view>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.body {
  padding: 8rpx 32rpx 40rpx;
}

.body__item {
  display: block;
  margin-bottom: 32rpx;
}
</style>