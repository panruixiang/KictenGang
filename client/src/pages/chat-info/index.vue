<script setup lang="ts">
/**
 * 群信息（普通页）· 工单 02
 * - 群信息卡：群名（当前空间）+ 成员头像叠压组 + 人数
 * - 成员列表：当前操作人所在行显"当前身份"tag
 * - 演示区（仅原型）：切换"我是谁"，切换后按新成员的真实未读（别人发、自己没看过的消息）
 *   挂 tab 红点并落到"菜谱"tab；不自动进群（进群会立即把游标推到最新），
 *   便于从 tabBar 验证未读提示后再点进群聊
 */
import NavBar from '@/components/NavBar.vue';
import MemberAvatar from '@/components/MemberAvatar.vue';
import { getUnread, setCurrentMember, store } from '@/store';

/** 按当前身份的未读数同步厨房群 tab（index=2）红点 */
function syncUnreadBadge() {
  const unread = getUnread(store.spaceName);
  if (unread > 0) {
    uni.setTabBarBadge({ index: 2, text: String(unread), fail: () => {} });
  } else {
    uni.removeTabBarBadge({ index: 2, fail: () => {} });
  }
}

/** 切换演示身份 */
function pickMember(id: string) {
  if (id === store.currentMemberId) {
    uni.navigateBack();
    return;
  }
  const target = store.members.find((m) => m.id === id);
  setCurrentMember(id);
  uni.showToast({ title: `已切换为${target?.name ?? ''}视角`, icon: 'none', duration: 900 });
  // 落到其他 tab 而不是返回群聊：群聊 onShow 会立刻把已读游标推到最新，红点将无法验证。
  // H5 端 switchTab 会重绘 tabBar，角标需在切换成功后挂，并延迟兜底再挂一次。
  uni.switchTab({
    url: '/pages/recipe-library/index',
    success: syncUnreadBadge,
  });
  setTimeout(syncUnreadBadge, 500);
}
</script>

<template>
  <view class="page">
    <NavBar title="群信息" />

    <view class="body">
      <!-- 群信息卡 -->
      <view class="info-card">
        <text class="info-card__name">{{ store.spaceName }}</text>
        <view class="info-card__members">
          <MemberAvatar
            v-for="m in store.members"
            :key="m.id"
            class="info-card__avatar"
            :member-id="m.id"
            :size="72"
          />
          <text class="info-card__count">{{ store.members.length }} 位家人</text>
        </view>
      </view>

      <!-- 成员列表 -->
      <view class="members-card">
        <view v-for="m in store.members" :key="m.id" class="member-row">
          <MemberAvatar :member-id="m.id" :size="60" />
          <text class="member-row__name">{{ m.name }}</text>
          <text v-if="m.id === store.currentMemberId" class="member-row__tag">当前身份</text>
        </view>
      </view>

      <!-- 演示区：身份切换（上线移除） -->
      <view class="demo">
        <view class="demo__head">
          <text class="demo__title">演示：切换我是谁</text>
          <text class="demo__badge">仅原型 · 上线移除</text>
        </view>
        <view class="demo__list">
          <view
            v-for="m in store.members"
            :key="m.id"
            class="demo__item"
            :class="{ 'demo__item--on': m.id === store.currentMemberId }"
            @tap="pickMember(m.id)"
          >
            <MemberAvatar :member-id="m.id" :size="56" />
            <text class="demo__name">{{ m.name }}</text>
            <image
              v-if="m.id === store.currentMemberId"
              class="demo__check"
              src="/static/icons/check.png"
              mode="aspectFit"
            />
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.body {
  padding: 16rpx 32rpx 48rpx;
}

/* 群信息卡 */
.info-card {
  padding: 32rpx;
  border-radius: 24rpx;
  background-color: $c-card;
  box-shadow: 0 4rpx 20rpx rgba(31, 27, 22, 0.04);
}

.info-card__name {
  font-size: 38rpx;
  font-weight: 600;
  color: $c-text;
}

.info-card__members {
  display: flex;
  align-items: center;
  margin-top: 26rpx;
}

.info-card__avatar {
  margin-right: -18rpx;
  border: 3rpx solid $c-card;
}

.info-card__count {
  margin-left: 36rpx;
  font-size: 24rpx;
  color: $c-text-muted;
}

/* 成员列表 */
.members-card {
  margin-top: 24rpx;
  padding: 4rpx 28rpx;
  border-radius: 24rpx;
  background-color: $c-card;
  box-shadow: 0 4rpx 20rpx rgba(31, 27, 22, 0.04);
}

.member-row {
  display: flex;
  align-items: center;
  padding: 26rpx 0;
  border-bottom: 1px solid $c-line;

  &:last-child {
    border-bottom: none;
  }
}

.member-row__name {
  flex: 1;
  margin-left: 20rpx;
  font-size: 30rpx;
  color: $c-text;
}

.member-row__tag {
  padding: 4rpx 16rpx;
  border-radius: 8rpx;
  background-color: $c-primary-soft;
  color: $c-primary;
  font-size: 22rpx;
}

/* 演示区 */
.demo {
  margin-top: 24rpx;
  padding: 28rpx;
  border: 1px dashed $c-primary;
  border-radius: 24rpx;
  background-color: rgba(232, 89, 12, 0.04);
}

.demo__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.demo__title {
  font-size: 30rpx;
  font-weight: 600;
  color: $c-text;
}

.demo__badge {
  padding: 4rpx 14rpx;
  border-radius: 8rpx;
  background-color: rgba(232, 89, 12, 0.1);
  color: $c-primary;
  font-size: 20rpx;
}

.demo__list {
  display: flex;
  justify-content: space-between;
  margin-top: 24rpx;
}

.demo__item {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 140rpx;
  padding: 20rpx 0;
  border: 2rpx solid transparent;
  border-radius: 16rpx;
  background-color: $c-card;

  &:active {
    opacity: 0.85;
  }
}

.demo__item--on {
  border-color: $c-primary;
  background-color: $c-primary;
}

/* 橙底上的头像加白边，避免与底色糊在一起 */
.demo__item--on :deep(.avatar) {
  border: 2rpx solid rgba(255, 255, 255, 0.65);
}

.demo__item--on .demo__name {
  color: #ffffff;
}

.demo__name {
  margin-top: 12rpx;
  font-size: 26rpx;
  color: $c-text;
}

.demo__check {
  width: 28rpx;
  height: 28rpx;
  margin-top: 6rpx;
}
</style>
