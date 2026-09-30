<script setup lang="ts">
import { computed } from 'vue';
import NavBar from '@/components/NavBar.vue';
import RecipeCard from '@/components/RecipeCard.vue';
import { getAllRecipes, isFavorite, searchCheckedNames, toggleFavorite } from '@/store';
import type { Recipe } from '@/types';

/**
 * 反查结果 · 工单 08
 * 规则（真实计算，随时跟随勾选变化）：
 * - 调味料一律视为有（家里默认）
 * - 一道菜入选 = 它的全部 主料 + 辅料 都在已勾选集合里
 * - 内置菜与自家菜各自成卡（番茄炒蛋会出现两张）
 */

/** 当前勾选（读 store，与反查页同源 → 回退调整后自动刷新） */
const checkedNames = computed(() => searchCheckedNames.value);

/** 能做的菜 */
const results = computed(() => {
  const checked = new Set(checkedNames.value);
  return getAllRecipes().filter((r) =>
    r.ingredients.filter((i) => i.group !== '调味料').every((i) => checked.has(i.name)),
  );
});

function goDetail(recipe: Recipe) {
  uni.navigateTo({ url: `/pages/recipe-detail/index?id=${recipe.id}` });
}
</script>

<template>
  <view class="page">
    <NavBar title="能做什么" />

    <view class="body">
      <view class="summary">
        <text class="summary__main">已选 {{ checkedNames.length }} 种食材，能做 {{ results.length }} 道菜</text>
        <text class="summary__hint">调味料默认都有；回上一页调整勾选，结果会跟着变</text>
      </view>

      <view class="list">
        <RecipeCard
          v-for="r in results"
          :key="r.id"
          class="list__item"
          :recipe="r"
          :favorited="isFavorite(r.id)"
          @tap="goDetail(r)"
          @toggle-favorite="toggleFavorite(r.id)"
        />
      </view>

      <!-- 勾得太少时的提示（非空态，属于结果为空时的引导） -->
      <view v-if="results.length === 0" class="empty">这几样还做不了什么，回上一页再勾几样试试</view>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.body {
  padding: 8rpx 32rpx 40rpx;
}

.summary {
  margin-bottom: 28rpx;
}

.summary__main {
  display: block;
  font-size: 30rpx;
  font-weight: 600;
  color: $c-text;
}

.summary__hint {
  display: block;
  margin-top: 10rpx;
  font-size: 22rpx;
  color: $c-text-muted;
}

.list__item {
  display: block;
  margin-bottom: 32rpx;
}

.empty {
  padding: 140rpx 48rpx;
  text-align: center;
  color: $c-text-muted;
  font-size: 26rpx;
}
</style>