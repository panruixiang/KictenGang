<script setup lang="ts">
/**
 * 自绘标题区：全局 navigationStyle 为 custom，各页面用它显示标题与返回
 * 值传递：title + showBack（tabBar 页面传 false）+ close（表单页用关闭键替代返回）
 */
withDefaults(
  defineProps<{
    /** 标题文字 */
    title?: string;
    /** 是否显示返回按钮 */
    showBack?: boolean;
    /** 显示右侧关闭键（传 true 时不显示返回箭头），点击抛 close 事件 */
    close?: boolean;
  }>(),
  { title: '', showBack: true, close: false },
);

const emit = defineEmits<{ (e: 'close'): void }>();

/** 状态栏高度（小程序端用于留出安全区；H5 端为 0） */
const statusBarHeight = uni.getSystemInfoSync().statusBarHeight ?? 0;

/** 返回上一页；没有上一页时（如直接刷新进入）回菜谱库 */
function goBack() {
  if (getCurrentPages().length > 1) {
    uni.navigateBack();
  } else {
    uni.switchTab({ url: '/pages/recipe-library/index' });
  }
}
</script>

<template>
  <view class="nav">
    <view class="nav__status" :style="{ height: statusBarHeight + 'px' }" />
    <view class="nav__bar">
      <view v-if="showBack && !close" class="nav__back" @tap="goBack">
        <image class="nav__arrow" src="/static/icons/chevron-left.png" mode="aspectFit" />
      </view>
      <text class="nav__title">{{ title }}</text>
      <!-- 关闭键（Lucide x），表单页替代返回 -->
      <view v-if="close" class="nav__close" @tap="emit('close')">
        <image class="nav__close-icon" src="/static/icons/close.png" mode="aspectFit" />
      </view>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.nav {
  background-color: $c-bg;
}

.nav__bar {
  display: flex;
  align-items: center;
  height: 88rpx;
  padding: 0 32rpx;
}

.nav__back {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 64rpx;
  height: 64rpx;
  margin-left: -12rpx;
}

/* 返回箭头图标（Lucide chevron-left） */
.nav__arrow {
  width: 34rpx;
  height: 34rpx;
}

.nav__title {
  margin-left: 8rpx;
  font-size: 34rpx;
  font-weight: 600;
  color: $c-text;
}

.nav__close {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 64rpx;
  height: 64rpx;
  margin-left: auto;
  margin-right: -12rpx;
}

.nav__close-icon {
  width: 36rpx;
  height: 36rpx;
}
</style>