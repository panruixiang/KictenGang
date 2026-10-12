<script setup lang="ts">
import type { Recipe } from '@/types';

/**
 * 菜谱卡：封面 + 菜名（含"做过 N 次"）+ 菜系标签 + 耗时 + 难度 + 右上角收藏心形
 * 值传递：recipe + favorited + cookedCount；点击 / 长按 / 心形分别向上抛事件（Q31 长按出操作菜单）
 */
withDefaults(
  defineProps<{
    /** 菜谱数据 */
    recipe: Recipe;
    /** 是否已收藏 */
    favorited?: boolean;
    /** 做过的次数（Q30）：> 0 时在菜名右侧显淡色小标记；不传 / 0 不渲染 */
    cookedCount?: number;
  }>(),
  { favorited: false, cookedCount: 0 },
);

const emit = defineEmits<{
  (e: 'tap'): void;
  (e: 'long-press'): void;
  (e: 'toggle-favorite'): void;
}>();
</script>

<template>
  <view class="card" @tap="emit('tap')" @longpress="emit('long-press')">
    <view class="card__cover-wrap">
      <image class="card__cover" :src="recipe.cover" mode="aspectFill" />
      <view class="card__fav" @tap.stop="emit('toggle-favorite')">
        <image
          class="card__fav-icon"
          :src="favorited ? '/static/icons/heart-active.png' : '/static/icons/heart.png'"
          mode="aspectFit"
        />
      </view>
    </view>
    <view class="card__body">
      <view class="card__title-row">
        <text class="card__name">{{ recipe.name }}</text>
        <text v-if="cookedCount > 0" class="card__cooked">做过 {{ cookedCount }} 次</text>
      </view>
      <view class="card__meta">
        <text class="card__cuisine">{{ recipe.cuisine }}</text>
        <text class="card__dot">·</text>
        <text>{{ recipe.durationMin }} 分钟</text>
        <text class="card__dot">·</text>
        <text>{{ recipe.difficulty }}</text>
      </view>
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

/* 菜名行：名称 + 右侧"做过 N 次"淡色小标记（Q30） */
.card__title-row {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
}

.card__name {
  font-size: 34rpx;
  font-weight: 600;
  color: $c-text;
}

.card__cooked {
  flex-shrink: 0;
  margin-left: 16rpx;
  font-size: 22rpx;
  color: $c-text-muted;
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
</style>
