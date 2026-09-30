<script setup lang="ts">
import { ref } from 'vue';
import { store } from '@/store';

/**
 * 我的（tabBar"我的"）· 工单 13
 * - 空间卡：当前空间 + 成员头像组 + 邀请家人（弹出微信分享卡片样式）
 * - 入口行：我的收藏 / 我的记录 / 常备食材 / 切换空间（两个示例空间）
 * - 分享卡片点开 = 预览家人打开后的样子（进"加入确认"屏）
 */

/** 空间成员（原型示例：彩色圆 + 首字） */
const MEMBERS = [
  { name: '老张', initial: '张', color: '#E8590C' },
  { name: '李姐', initial: '李', color: '#C2255C' },
  { name: '王叔', initial: '王', color: '#2F9E44' },
  { name: '豆豆', initial: '豆', color: '#E8A13C' },
];

/** 示例空间（切换示意） */
const SPACES = ['老张家的厨房', '李姐家的厨房'];

const spaceOpen = ref(false);
const shareOpen = ref(false);

/** 切换空间 */
function pickSpace(space: string) {
  store.spaceName = space;
  spaceOpen.value = false;
}

function goFavorites() {
  uni.navigateTo({ url: '/pages/favorites/index' });
}

function goLogs() {
  uni.switchTab({ url: '/pages/cooking-log-list/index' });
}

function goStaple() {
  uni.navigateTo({ url: '/pages/staple-ingredients/index' });
}

/** 点分享卡片：模拟家人从卡片进入 → 加入确认屏 */
function goJoin() {
  shareOpen.value = false;
  uni.navigateTo({
    url: `/pages/join-confirm/index?space=${encodeURIComponent(store.spaceName)}&inviter=老张`,
  });
}
</script>

<template>
  <view class="page page--tab">
    <view class="head">
      <text class="head__title">我的</text>
    </view>

    <view class="body">
      <!-- 空间卡 -->
      <view class="space-card">
        <view class="space-card__top">
          <view class="space-card__main">
            <text class="space-card__label">当前空间</text>
            <text class="space-card__name">{{ store.spaceName }}</text>
          </view>
          <view class="space-card__invite" @tap="shareOpen = true">邀请家人</view>
        </view>
        <view class="space-card__members">
          <view v-for="m in MEMBERS" :key="m.name" class="avatar" :style="{ backgroundColor: m.color }">
            <text class="avatar__char">{{ m.initial }}</text>
          </view>
          <text class="space-card__count">{{ MEMBERS.length }} 位家人</text>
        </view>
      </view>

      <!-- 入口行 -->
      <view class="rows">
        <view class="row" @tap="goFavorites">
          <text class="row__text">我的收藏</text>
          <image class="row__arrow" src="/static/icons/chevron-right.png" mode="aspectFit" />
        </view>
        <view class="row" @tap="goLogs">
          <text class="row__text">我的记录</text>
          <image class="row__arrow" src="/static/icons/chevron-right.png" mode="aspectFit" />
        </view>
        <view class="row" @tap="goStaple">
          <text class="row__text">常备食材</text>
          <image class="row__arrow" src="/static/icons/chevron-right.png" mode="aspectFit" />
        </view>
        <view class="row" @tap="spaceOpen = !spaceOpen">
          <text class="row__text">切换空间</text>
          <text class="row__value">{{ store.spaceName }}</text>
          <image
            class="row__arrow"
            :class="{ 'row__arrow--open': spaceOpen }"
            src="/static/icons/chevron-right.png"
            mode="aspectFit"
          />
        </view>
        <!-- 切换空间：展开两个示例空间 -->
        <view v-if="spaceOpen" class="space-pick">
          <view v-for="s in SPACES" :key="s" class="space-pick__item" @tap="pickSpace(s)">
            <text class="space-pick__name" :class="{ 'space-pick__name--current': s === store.spaceName }">
              {{ s }}
            </text>
            <text v-if="s === store.spaceName" class="space-pick__tag">当前</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 分享卡片弹层 -->
    <view v-if="shareOpen" class="mask" @tap="shareOpen = false">
      <view class="share" @tap.stop>
        <view class="share__card" @tap="goJoin">
          <view class="share__card-top">
            <view class="share__logo">
              <text class="share__logo-char">厨</text>
            </view>
            <view class="share__card-titles">
              <text class="share__app">厨房帮</text>
              <text class="share__mini">小程序</text>
            </view>
          </view>
          <text class="share__space">{{ store.spaceName }}</text>
          <text class="share__desc">一起来存菜谱、记做菜吧</text>
        </view>
        <text class="share__hint">点卡片可预览家人打开后的样子</text>
        <view class="share__close" @tap="shareOpen = false">
          <image class="share__close-icon" src="/static/icons/close.png" mode="aspectFit" />
        </view>
      </view>
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

.body {
  padding: 16rpx 32rpx 0;
}

/* 空间卡 */
.space-card {
  padding: 32rpx 32rpx 28rpx;
  border-radius: 24rpx;
  background-color: $c-card;
  box-shadow: 0 4rpx 20rpx rgba(31, 27, 22, 0.04);
}

.space-card__top {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.space-card__label {
  display: block;
  font-size: 22rpx;
  color: $c-text-muted;
}

.space-card__name {
  display: block;
  margin-top: 6rpx;
  font-size: 38rpx;
  font-weight: 600;
  color: $c-text;
}

.space-card__invite {
  flex-shrink: 0;
  padding: 12rpx 30rpx;
  border: 1px solid $c-primary;
  border-radius: 999rpx;
  color: $c-primary;
  font-size: 26rpx;
}

.space-card__members {
  display: flex;
  align-items: center;
  margin-top: 26rpx;
}

/* 成员头像：彩色圆 + 首字 */
.avatar {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 60rpx;
  height: 60rpx;
  margin-right: -14rpx;
  border: 3rpx solid $c-card;
  border-radius: 50%;
}

.avatar__char {
  color: #ffffff;
  font-size: 24rpx;
}

.space-card__count {
  margin-left: 32rpx;
  font-size: 24rpx;
  color: $c-text-muted;
}

/* 入口行 */
.rows {
  margin-top: 32rpx;
  padding: 0 28rpx;
  border-radius: 24rpx;
  background-color: $c-card;
  box-shadow: 0 4rpx 20rpx rgba(31, 27, 22, 0.04);
}

.row {
  display: flex;
  align-items: center;
  padding: 30rpx 0;
  border-bottom: 1px solid $c-line;

  &:last-child {
    border-bottom: none;
  }
}

.row__text {
  flex: 1;
  font-size: 30rpx;
  color: $c-text;
}

.row__value {
  margin-right: 8rpx;
  font-size: 26rpx;
  color: $c-text-muted;
}

/* 右箭头（Lucide chevron-right） */
.row__arrow {
  width: 30rpx;
  height: 30rpx;
  transition: transform 0.15s ease;
}

.row__arrow--open {
  transform: rotate(90deg);
}

/* 切换空间：内嵌选项 */
.space-pick {
  padding: 8rpx 0 20rpx;
  border-bottom: 1px solid $c-line;
}

.space-pick__item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 22rpx 20rpx;
  margin-top: 12rpx;
  border-radius: 16rpx;
  background-color: #fbf9f6;
}

.space-pick__name {
  font-size: 28rpx;
  color: $c-text;
}

.space-pick__name--current {
  color: $c-primary;
  font-weight: 600;
}

.space-pick__tag {
  padding: 2rpx 14rpx;
  border-radius: 8rpx;
  background-color: $c-primary-soft;
  color: $c-primary;
  font-size: 20rpx;
}

/* 分享卡片弹层 */
.mask {
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  z-index: 20;
  background-color: rgba(31, 27, 22, 0.45);
}

.share {
  position: absolute;
  top: 50%;
  right: 64rpx;
  left: 64rpx;
  transform: translateY(-50%);
}

.share__card {
  padding: 32rpx;
  border-radius: 28rpx;
  background-color: $c-card;
  box-shadow: 0 16rpx 48rpx rgba(0, 0, 0, 0.18);

  &:active {
    opacity: 0.94;
  }
}

.share__card-top {
  display: flex;
  align-items: center;
}

.share__logo {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 84rpx;
  height: 84rpx;
  border-radius: 20rpx;
  background-color: $c-primary;
}

.share__logo-char {
  color: #ffffff;
  font-size: 40rpx;
  font-weight: 600;
}

.share__card-titles {
  margin-left: 20rpx;
}

.share__app {
  display: block;
  font-size: 30rpx;
  font-weight: 600;
  color: $c-text;
}

.share__mini {
  display: block;
  margin-top: 4rpx;
  font-size: 22rpx;
  color: $c-text-muted;
}

.share__space {
  display: block;
  margin-top: 28rpx;
  font-size: 32rpx;
  font-weight: 600;
  color: $c-text;
}

.share__desc {
  display: block;
  margin-top: 10rpx;
  font-size: 26rpx;
  color: $c-text-muted;
}

.share__hint {
  display: block;
  margin-top: 24rpx;
  text-align: center;
  color: rgba(255, 255, 255, 0.85);
  font-size: 24rpx;
}

.share__close {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 72rpx;
  height: 72rpx;
  margin: 24rpx auto 0;
  border-radius: 50%;
  background-color: rgba(255, 255, 255, 0.92);
}

.share__close-icon {
  width: 32rpx;
  height: 32rpx;
}
</style>