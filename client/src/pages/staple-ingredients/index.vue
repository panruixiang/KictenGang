<script setup lang="ts">
import { computed, ref } from 'vue';
import Chip from '@/components/Chip.vue';
import NavBar from '@/components/NavBar.vue';
import { isStaple, store, toggleStaple } from '@/store';

/**
 * 常备食材维护 · 工单 09
 * - 常备 = 家里平时就有的食材；调味料默认视为有，无需维护
 * - 勾选 = 加入常备 / 取消 = 移出（与反查页默认勾选同源联动，同一 store）
 */

/** 搜索关键词（按食材名过滤） */
const keyword = ref('');

/** 分组列表：只显示 主料 / 辅料，过滤空组 */
const visibleGroups = computed(() =>
  (['主料', '辅料'] as const)
    .map((group) => ({
      group,
      items: store.ingredientDict.filter(
        (i) => i.group === group && i.name.includes(keyword.value.trim()),
      ),
    }))
    .filter((g) => g.items.length > 0),
);
</script>

<template>
  <view class="page">
    <NavBar title="常备食材" />

    <view class="body">
      <view class="intro">常备 = 家里平时就有的食材；调味料默认视为有，无需维护</view>

      <view class="search">
        <image class="search__icon" src="/static/icons/search.png" mode="aspectFit" />
        <input
          v-model="keyword"
          class="search__input"
          type="text"
          placeholder="搜索食材"
          placeholder-class="input-ph"
          confirm-type="search"
        />
      </view>

      <view v-for="g in visibleGroups" :key="g.group" class="section">
        <text class="section-label">{{ g.group }}</text>
        <view class="items">
          <Chip
            v-for="item in g.items"
            :key="item.name"
            class="items__chip"
            check
            :label="item.name"
            :selected="isStaple(item.name)"
            @tap="toggleStaple(item.name)"
          />
        </view>
      </view>

      <view v-if="visibleGroups.length === 0" class="empty">没有找到相关食材</view>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.body {
  padding: 8rpx 32rpx 40rpx;
}

.intro {
  padding: 20rpx 28rpx;
  border-radius: 20rpx;
  background-color: $c-primary-soft;
  color: $c-primary;
  font-size: 24rpx;
  line-height: 1.6;
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

.section {
  margin-top: 40rpx;
}

.items {
  display: flex;
  flex-wrap: wrap;
  margin-top: 20rpx;
}

.items__chip {
  margin: 0 16rpx 16rpx 0;
}

.empty {
  padding: 120rpx 0;
  text-align: center;
  color: $c-text-muted;
  font-size: 26rpx;
}
</style>