<script setup lang="ts">
import { computed, ref } from 'vue';
import Chip from '@/components/Chip.vue';
import { mockFlags } from '@/mock/config';
import { store } from '@/store';
import type { CookingLog } from '@/types';
import { formatLogDate } from '@/utils/date';

/**
 * 记录列表（tabBar"记录"）· 工单 06
 * - 两种视图：全部（流水）/ 按菜谱（分组）
 * - 点一条 → 只读浏览（复用记一笔的只读形态）
 * - 空态：mock 开关 emptyLogs 打开即可演示
 */

/** 视图：全部流水 / 按菜谱分组 */
const view = ref<'all' | 'byRecipe'>('all');

/** 记录数据（新记录排最前；mock 开关可演示空态） */
const logs = computed(() => (mockFlags.emptyLogs ? [] : store.logs));

/** 按菜谱分组（组顺序 = 最近一次做的先后，"随手记"自成一类） */
const groups = computed(() => {
  const map = new Map<string, CookingLog[]>();
  logs.value.forEach((log) => {
    const key = log.recipeName ?? '随手记';
    const list = map.get(key);
    if (list) {
      list.push(log);
    } else {
      map.set(key, [log]);
    }
  });
  return [...map.entries()].map(([name, items]) => ({ name, items }));
});

/** 点一条记录 → 只读浏览 */
function open(log: CookingLog) {
  uni.navigateTo({ url: `/pages/cooking-log-edit/index?recordId=${log.id}` });
}
</script>

<template>
  <view class="page page--tab">
    <!-- 顶部：标题 + 视图切换 -->
    <view class="head">
      <text class="head__title">记录</text>
      <view class="head__filters">
        <Chip class="head__chip" label="全部" :selected="view === 'all'" @tap="view = 'all'" />
        <Chip class="head__chip" label="按菜谱" :selected="view === 'byRecipe'" @tap="view = 'byRecipe'" />
      </view>
    </view>

    <view class="body">
      <!-- 空态（mock 开关演示） -->
      <view v-if="logs.length === 0" class="empty">还没有记录，做完一道菜记一笔</view>

      <!-- 全部：流水列表 -->
      <template v-else-if="view === 'all'">
        <view v-for="log in logs" :key="log.id" class="log" @tap="open(log)">
          <view class="log__top">
            <text class="log__date">{{ formatLogDate(log.date) }}</text>
            <text class="log__name">{{ log.recipeName ?? '随手记' }}</text>
            <text v-if="log.versionName" class="log__ver">{{ log.versionName }}</text>
          </view>
          <text v-if="log.note" class="log__note">{{ log.note }}</text>
        </view>
      </template>

      <!-- 按菜谱：分组 -->
      <template v-else>
        <view v-for="g in groups" :key="g.name" class="group">
          <view class="group__head">
            <text class="group__name">{{ g.name }}</text>
            <text class="group__count">共 {{ g.items.length }} 次</text>
          </view>
          <view v-for="log in g.items" :key="log.id" class="log" @tap="open(log)">
            <view class="log__top">
              <text class="log__date">{{ formatLogDate(log.date) }}</text>
              <text v-if="log.versionName" class="log__ver">{{ log.versionName }}</text>
            </view>
            <text v-if="log.note" class="log__note">{{ log.note }}</text>
          </view>
        </view>
      </template>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.head {
  padding: 24rpx 32rpx 8rpx;
}

.head__title {
  font-size: 42rpx;
  font-weight: 600;
  color: $c-text;
}

.head__filters {
  display: flex;
  margin-top: 24rpx;
}

.head__chip {
  margin-right: 16rpx;
}

.body {
  padding: 16rpx 32rpx 0;
}

/* 空态 */
.empty {
  padding: 160rpx 48rpx;
  text-align: center;
  color: $c-text-muted;
  font-size: 26rpx;
}

/* 一条记录 */
.log {
  margin-bottom: 20rpx;
  padding: 26rpx 28rpx;
  border-radius: 24rpx;
  background-color: $c-card;
  box-shadow: 0 4rpx 20rpx rgba(31, 27, 22, 0.04);

  &:active {
    opacity: 0.94;
  }
}

.log__top {
  display: flex;
  align-items: center;
}

.log__date {
  flex-shrink: 0;
  margin-right: 18rpx;
  font-size: 24rpx;
  color: $c-text-muted;
}

.log__name {
  font-size: 30rpx;
  font-weight: 600;
  color: $c-text;
}

/* 版本 chip（只读展示） */
.log__ver {
  margin-left: 14rpx;
  padding: 4rpx 16rpx;
  border-radius: 999rpx;
  background-color: $c-primary-soft;
  color: $c-primary;
  font-size: 22rpx;
}

/* 备注摘要：单行截断 */
.log__note {
  display: block;
  overflow: hidden;
  margin-top: 12rpx;
  font-size: 26rpx;
  color: $c-text-muted;
  white-space: nowrap;
  text-overflow: ellipsis;
}

/* 分组视图 */
.group {
  margin-bottom: 36rpx;
}

.group__head {
  display: flex;
  align-items: baseline;
  margin-bottom: 18rpx;
  padding: 0 4rpx;
}

.group__name {
  font-size: 30rpx;
  font-weight: 600;
  color: $c-text;
}

.group__count {
  margin-left: 16rpx;
  font-size: 24rpx;
  color: $c-text-muted;
}
</style>