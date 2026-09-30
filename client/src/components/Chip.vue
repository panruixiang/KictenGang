<script setup lang="ts">
/**
 * 通用标签 chip：未选中 / 选中两个态
 * （菜系筛选、份量选择、版本切换共用）
 * 值传递：label + selected；点击通过 tap 事件向上传递
 */
withDefaults(
  defineProps<{
    /** 文案 */
    label: string;
    /** 是否选中 */
    selected?: boolean;
    /** md = 标准（筛选），sm = 紧凑（份量 / 版本） */
    size?: 'md' | 'sm';
  }>(),
  { selected: false, size: 'md' },
);

const emit = defineEmits<{ (e: 'tap'): void }>();
</script>

<template>
  <view class="chip" :class="[`chip--${size}`, { 'chip--on': selected }]" @tap="emit('tap')">
    <text>{{ label }}</text>
  </view>
</template>

<style lang="scss" scoped>
.chip {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background-color: $c-card;
  border: 1px solid $c-line;
  border-radius: 999rpx;
  color: $c-text-muted;
  transition: all 0.15s ease;
}

.chip--md {
  padding: 10rpx 28rpx;
  font-size: 26rpx;
}

.chip--sm {
  padding: 8rpx 22rpx;
  font-size: 24rpx;
}

.chip--on {
  background-color: $c-primary;
  border-color: $c-primary;
  color: #ffffff;
}
</style>