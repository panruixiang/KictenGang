<script setup lang="ts">
/**
 * 成员头像：彩色圆 + 白色首字
 * 值传递：传 memberId，内部经 store 解析（查不到走兜底成员，不渲染崩）
 * size 为 rpx 数值，默认 60
 */
import { computed } from 'vue';
import { getMember } from '@/store';

const props = withDefaults(defineProps<{ memberId?: string; size?: number }>(), {
  memberId: '',
  size: 60,
});

const member = computed(() => getMember(props.memberId));

const boxStyle = computed(() => ({
  width: `${props.size}rpx`,
  height: `${props.size}rpx`,
  backgroundColor: member.value.color,
}));

const charStyle = computed(() => ({
  fontSize: `${Math.round(props.size * 0.4)}rpx`,
}));
</script>

<template>
  <view class="avatar" :style="boxStyle">
    <text class="avatar__char" :style="charStyle">{{ member.initial }}</text>
  </view>
</template>

<style lang="scss" scoped>
.avatar {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
}

.avatar__char {
  color: #ffffff;
  line-height: 1;
}
</style>
