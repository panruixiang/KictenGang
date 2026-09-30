<script setup lang="ts">
import { computed, ref } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import NavBar from '@/components/NavBar.vue';

/**
 * 加入空间（确认屏）· 工单 13
 * - 从"我的"页分享卡片点入（模拟家人打开分享卡片后的样子）
 * - 主按钮"加入"、次按钮"暂不"，均有去向
 */

/** 邀请人 / 空间名（默认老张家的厨房，可由分享卡片带参） */
const inviter = ref('老张');
const spaceName = ref('老张家的厨房');

/** 头像首字（如"老张"取"张"） */
const inviterInitial = computed(() =>
  inviter.value.length > 1 ? inviter.value.slice(-1) : inviter.value,
);

onLoad((query) => {
  if (query?.inviter) inviter.value = String(query.inviter);
  if (query?.space) spaceName.value = decodeURIComponent(String(query.space));
});

/** 加入：回到这个空间的菜谱库 */
function join() {
  uni.showToast({ title: `已加入「${spaceName.value}」`, icon: 'none' });
  uni.switchTab({ url: '/pages/recipe-library/index' });
}

/** 暂不：返回上一页；直接刷新进入时兜底回"我的" */
function decline() {
  if (getCurrentPages().length > 1) {
    uni.navigateBack();
  } else {
    uni.switchTab({ url: '/pages/profile/index' });
  }
}
</script>

<template>
  <view class="page">
    <NavBar title="加入空间" />

    <view class="body">
      <view class="card">
        <view class="avatar">
          <text class="avatar__char">{{ inviterInitial }}</text>
        </view>
        <text class="card__title">{{ inviter }} 邀请你加入</text>
        <text class="card__space">「{{ spaceName }}」</text>
        <text class="card__desc">加入后可以一起存菜谱、记做菜、逛食材反查</text>
      </view>

      <view class="actions">
        <button class="btn-primary actions__join" @tap="join">加入</button>
        <button class="btn-secondary actions__decline" @tap="decline">暂不</button>
      </view>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.body {
  padding: 80rpx 48rpx 0;
}

.card {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 56rpx 40rpx;
  border-radius: 28rpx;
  background-color: $c-card;
  box-shadow: 0 4rpx 20rpx rgba(31, 27, 22, 0.04);
}

/* 邀请人头像：彩色圆 + 首字 */
.avatar {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 120rpx;
  height: 120rpx;
  border-radius: 50%;
  background-color: $c-primary;
}

.avatar__char {
  color: #ffffff;
  font-size: 48rpx;
  font-weight: 600;
}

.card__title {
  margin-top: 28rpx;
  font-size: 34rpx;
  font-weight: 600;
  color: $c-text;
}

.card__space {
  margin-top: 10rpx;
  font-size: 30rpx;
  color: $c-primary;
}

.card__desc {
  margin-top: 20rpx;
  font-size: 24rpx;
  color: $c-text-muted;
  text-align: center;
}

.actions {
  margin-top: 56rpx;
}

.actions__join {
  width: 100%;
}

.actions__decline {
  width: 100%;
  margin-top: 24rpx;
}
</style>