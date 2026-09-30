<script setup lang="ts">
import type { Recipe } from '@/types';

/**
 * 菜谱卡：封面 + 菜名 + 菜系标签 + 耗时 + 难度 + 右上角收藏心形
 * 值传递：recipe + favorited；点卡片 / 点心形分别向上抛事件
 */
withDefaults(
  defineProps<{
    /** 菜谱数据 */
    recipe: Recipe;
    /** 是否已收藏 */
    favorited?: boolean;
  }>(),
  { favorited: false },
);

const emit = defineEmits<{
  (e: 'tap'): void;
  (e: 'toggle-favorite'): void;
}>();
</script>

<template>
  <view class="card" @tap="emit('tap')">
    <view class="card__cover-wrap">
      <image class="card__cover" :src="recipe.cover" mode="aspectFill" />
      <view class="card__badge" :class="recipe.isBuiltin ? 'card__badge--builtin' : 'card__badge--own'">
        <text>{{ recipe.isBuiltin ? '内置' : '我家' }}</text>
      </view>
      <view class="card__fav" @tap.stop="emit('toggle-favorite')">
        <image
          class="card__fav-icon"
          :src="favorited ? '/static/icons/heart-active.png' : '/static/icons/heart.png'"
          mode="aspectFit"
        />
      </view>
    </view>
    <view class="card__body">
      <text class="card__name">{{ recipe.name }}</text>
      <view class="card__meta">
        <text class="card__cuisine">{{ recipe.cuisine }}</text>
        <text class="card__dot">·</text>
        <text>{{ recipe.durationMin }} 分钟</text>
        <text class="card__dot">·</text>
        <text>{{ recipe.difficulty }}</text>
      </view>
      <text v-if="recipe.source" class="card__source">{{ recipe.source }}</text>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.card {
  overflow: hidden;
  border-radius: var(--radius);
  background-color: $c-card;
  box-shadow: 0 4rpx 20rpx rgba(31, 27, 22, 0.05);

  &:active {
    opacity: 0.94;
  }
}

.card__cover-wrap {
  position: relative;
  width: 100%;
  height: 320rpx;
}

.card__cover {
  width: 100%;
  height: 100%;
}

/* 左上角：内置 / 我家 角标 */
.card__badge {
  position: absolute;
  top: 20rpx;
  left: 20rpx;
  padding: 6rpx 18rpx;
  border-radius: 999rpx;
  font-size: 22rpx;
  line-height: 1.3;
}

.card__badge--builtin {
  background-color: rgba(31, 27, 22, 0.42);
  color: #ffffff;
}

.card__badge--own {
  background-color: $c-primary;
  color: #ffffff;
}

/* 右上角：收藏心形 */
.card__fav {
  position: absolute;
  top: 18rpx;
  right: 18rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 68rpx;
  height: 68rpx;
  border-radius: 50%;
  background-color: rgba(255, 255, 255, 0.92);
}

.card__fav-icon {
  width: 42rpx;
  height: 42rpx;
}

.card__body {
  padding: 24rpx 28rpx 28rpx;
}

.card__name {
  font-size: 34rpx;
  font-weight: 600;
  color: $c-text;
}

.card__meta {
  display: flex;
  align-items: center;
  margin-top: 12rpx;
  font-size: 24rpx;
  color: $c-text-muted;
}

.card__cuisine {
  margin-right: 14rpx;
  padding: 4rpx 14rpx;
  border-radius: 8rpx;
  background-color: $c-primary-soft;
  color: $c-primary;
  font-size: 22rpx;
}

.card__dot {
  margin: 0 10rpx;
  color: #c9c0b5;
}

.card__source {
  margin-top: 10rpx;
  font-size: 22rpx;
  color: $c-text-muted;
}
</style>