<script setup lang="ts">
import { ref } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import NavBar from '@/components/NavBar.vue';
import RecipeCard from '@/components/RecipeCard.vue';
import { getRecipeById, isFavorite, store, toggleFavorite } from '@/store';
import type { Recipe } from '@/types';

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

function goDetail(recipe: Recipe) {
  uni.navigateTo({ url: `/pages/recipe-detail/index?id=${recipe.id}` });
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
          @tap="goDetail(r)"
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