<script setup lang="ts">
import { computed, ref } from 'vue';
import Chip from '@/components/Chip.vue';
import RecipeCard from '@/components/RecipeCard.vue';
import { mockFlags } from '@/mock/config';
import { getAllRecipes, isFavorite, store, toggleFavorite } from '@/store';
import type { Recipe } from '@/types';

/** 菜系筛选档位（"全部"默认选中） */
const CUISINES = ['全部', '川', '粤', '浙', '家常'];

const searchText = ref('');
const activeCuisine = ref('全部');

/** 菜谱库数据：mock 开关打开时隐藏自家菜，用于演示"自家菜为 0"的空态 */
const recipes = computed(() => {
  const all = getAllRecipes();
  return mockFlags.hideOwnRecipes ? all.filter((r) => r.isBuiltin) : all;
});

/** 搜索（命中菜名或该菜任一配料食材名）+ 菜系筛选，叠加生效 */
const filtered = computed(() => {
  const keyword = searchText.value.trim();
  return recipes.value.filter((r) => {
    if (activeCuisine.value !== '全部' && r.cuisine !== activeCuisine.value) return false;
    if (!keyword) return true;
    return r.name.includes(keyword) || r.ingredients.some((i) => i.name.includes(keyword));
  });
});

/** 自家菜为 0（默认浏览态）：提示"把常做的菜录进来吧" */
const showOwnEmptyHint = computed(
  () => recipes.value.every((r) => r.isBuiltin) && !searchText.value.trim() && activeCuisine.value === '全部',
);

function selectCuisine(cuisine: string) {
  activeCuisine.value = cuisine;
}

function goDetail(recipe: Recipe) {
  uni.navigateTo({ url: `/pages/recipe-detail/index?id=${recipe.id}` });
}

function goCreate() {
  uni.navigateTo({ url: '/pages/recipe-form/index' });
}
</script>

<template>
  <view class="page page--tab">
    <!-- 顶部：当前空间 + 搜索 + 菜系筛选 + 新建入口 -->
    <view class="head">
      <view class="head__top">
        <view class="space">
          <text class="space__label">当前空间</text>
          <text class="space__name">{{ store.spaceName }}</text>
        </view>
        <view class="head__add" @tap="goCreate">
          <image class="head__add-icon" src="/static/icons/plus.png" mode="aspectFit" />
        </view>
      </view>

      <view class="search">
        <image class="search__icon" src="/static/icons/search.png" mode="aspectFit" />
        <input
          v-model="searchText"
          class="search__input"
          type="text"
          placeholder="搜菜名或食材"
          placeholder-class="input-ph"
          confirm-type="search"
        />
      </view>

      <view class="filters">
        <Chip
          v-for="c in CUISINES"
          :key="c"
          class="filters__item"
          :label="c"
          :selected="activeCuisine === c"
          @tap="selectCuisine(c)"
        />
      </view>
    </view>

    <!-- 列表 -->
    <view class="body">
      <view v-if="showOwnEmptyHint" class="own-empty">把常做的菜录进来吧</view>

      <view class="list">
        <RecipeCard
          v-for="r in filtered"
          :key="r.id"
          class="list__item"
          :recipe="r"
          :favorited="isFavorite(r.id)"
          @tap="goDetail(r)"
          @toggle-favorite="toggleFavorite(r.id)"
        />
      </view>

      <view v-if="filtered.length === 0" class="list-empty">没有找到相关的菜谱</view>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.head {
  padding: 24rpx 32rpx 8rpx;
  background-color: $c-bg;
}

.head__top {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.space__label {
  display: block;
  font-size: 22rpx;
  color: $c-text-muted;
}

.space__name {
  font-size: 42rpx;
  font-weight: 600;
  color: $c-text;
}

.head__add {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 80rpx;
  height: 80rpx;
  border-radius: 50%;
  background-color: $c-primary;
  box-shadow: 0 8rpx 20rpx rgba(232, 89, 12, 0.28);
}

.head__add-icon {
  width: 40rpx;
  height: 40rpx;
}

/* 搜索框 */
.search {
  display: flex;
  align-items: center;
  height: 88rpx;
  margin-top: 24rpx;
  padding: 0 28rpx;
  border: 1px solid $c-line;
  border-radius: 999rpx;
  background-color: $c-card;
}

/* 搜索图标（Lucide search） */
.search__icon {
  flex-shrink: 0;
  width: 30rpx;
  height: 30rpx;
  margin-right: 20rpx;
}

.search__input {
  flex: 1;
  height: 100%;
  font-size: 28rpx;
  color: $c-text;
}

/* 菜系筛选 */
.filters {
  display: flex;
  flex-wrap: wrap;
  margin-top: 24rpx;
}

.filters__item {
  margin: 0 16rpx 12rpx 0;
}

.body {
  padding: 16rpx 32rpx 0;
}

/* 自家菜为 0 的空态提示 */
.own-empty {
  margin-bottom: 24rpx;
  padding: 20rpx 28rpx;
  border-radius: 20rpx;
  background-color: $c-primary-soft;
  color: $c-primary;
  font-size: 26rpx;
}

.list__item {
  display: block;
  margin-bottom: 32rpx;
}

.list-empty {
  padding: 140rpx 0;
  text-align: center;
  color: $c-text-muted;
  font-size: 26rpx;
}
</style>