<script setup lang="ts">
/**
 * 自绘标题区：全局 navigationStyle 为 custom，各页面用它显示标题与返回
 * 值传递：title + showBack（tabBar 页面传 false）
 */
withDefaults(
  defineProps<{
    /** 标题文字 */
    title?: string;
    /** 是否显示返回按钮 */
    showBack?: boolean;
  }>(),
  { title: '', showBack: true },
);

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
      <view v-if="showBack" class="nav__back" @tap="goBack">
        <view class="nav__arrow" />
      </view>
      <text class="nav__title">{{ title }}</text>
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

/* CSS 绘制的返回箭头（避免额外图片资源） */
.nav__arrow {
  width: 20rpx;
  height: 20rpx;
  border-left: 4rpx solid $c-text;
  border-bottom: 4rpx solid $c-text;
  transform: rotate(45deg);
}

.nav__title {
  margin-left: 8rpx;
  font-size: 34rpx;
  font-weight: 600;
  color: $c-text;
}
</style>