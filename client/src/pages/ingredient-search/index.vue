<script setup lang="ts">
import { computed } from 'vue';
import Chip from '@/components/Chip.vue';
import { clearSearchChecked, isSearchChecked, searchCheckedNames, store, toggleSearchChecked } from '@/store';

/**
 * 食材反查（tabBar"反查"）· 工单 07
 * - 从"家里有什么"出发勾食材：默认勾上"我家常备"，可当次增减、可清空
 * - 只显示 主料 / 辅料；调味料视为家里默认有（Q18）
 * - 勾选状态存 store：与工单 09"常备维护"联动，结果页（工单 08）实时读取
 */

/** 分组列表：只保留 主料 / 辅料 */
const groups = computed(() =>
  (['主料', '辅料'] as const).map((group) => ({
    group,
    items: store.ingredientDict.filter((i) => i.group === group),
  })),
);

/** 已选数量（随勾选实时变） */
const checkedCount = computed(() => searchCheckedNames.value.length);

/** 管理常备（→ 工单 09） */
function goStaple() {
  uni.navigateTo({ url: '/pages/staple-ingredients/index' });
}

/** 找找能做什么（→ 工单 08） */
function goResults() {
  uni.navigateTo({ url: '/pages/search-results/index' });
}
</script>

<template>
  <view class="page page--footer">
    <!-- 顶部：已选数量 + 管理常备 + 清空 -->
    <view class="head">
      <view class="head__row">
        <text class="head__title">食材反查</text>
        <text class="head__link" @tap="goStaple">管理常备</text>
      </view>
      <view class="head__row head__row--sub">
        <text class="head__sub">已选 {{ checkedCount }} 种 · 调味料默认都有</text>
        <text class="head__clear" @tap="clearSearchChecked">清空</text>
      </view>
    </view>

    <!-- 食材多选：主料 / 辅料 两组 -->
    <view class="body">
      <view v-for="g in groups" :key="g.group" class="section">
        <text class="section-label">{{ g.group }}</text>
        <view class="items">
          <Chip
            v-for="item in g.items"
            :key="item.name"
            class="items__chip"
            check
            :label="item.name"
            :selected="isSearchChecked(item.name)"
            @tap="toggleSearchChecked(item.name)"
          />
        </view>
      </view>
    </view>

    <view class="footer">
      <button class="btn-primary" @tap="goResults">找找能做什么</button>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.head {
  padding: 24rpx 32rpx 8rpx;
}

.head__row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.head__row--sub {
  margin-top: 16rpx;
}

.head__title {
  font-size: 42rpx;
  font-weight: 600;
  color: $c-text;
}

.head__link {
  font-size: 26rpx;
  color: $c-primary;
}

.head__sub {
  font-size: 24rpx;
  color: $c-text-muted;
}

.head__clear {
  padding: 4rpx 8rpx;
  font-size: 26rpx;
  color: $c-text-muted;
}

.body {
  padding: 16rpx 32rpx 0;
}

.section {
  margin-bottom: 36rpx;
}

/* 食材勾选：chip 网格（选中 = 变色 + 对勾） */
.items {
  display: flex;
  flex-wrap: wrap;
  margin-top: 20rpx;
}

.items__chip {
  margin: 0 16rpx 16rpx 0;
}
</style>