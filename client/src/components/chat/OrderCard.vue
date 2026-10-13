<script setup lang="ts">
/**
 * 群聊里的点菜卡片（消息中的结构化卡片，不是菜谱列表卡）
 * 值传递：order 整对象快照 + currentMemberId + mine（仅决定外层分列，本组件不读 store）
 * 操作全部 emit 上抛，由群聊页接 store action：
 *   工单 03：cancel
 *   工单 04：decline / claim / release / complete
 *   工单 05：start / open-recipe
 */
import { computed } from 'vue';
import { getMember, getRecipeById } from '@/store';
import type { DishOrder } from '@/types';

const props = defineProps<{
  order: DishOrder;
  /** 当前操作人 id（决定按钮矩阵） */
  currentMemberId: string;
}>();

const emit = defineEmits<{
  (e: 'cancel', id: string): void;
  (e: 'decline', id: string): void;
  (e: 'claim', id: string): void;
  (e: 'release', id: string): void;
  (e: 'complete', id: string): void;
  (e: 'start', id: string): void;
  (e: 'open-recipe', id: string): void;
}>();

/** 是否手写简卡（无菜谱关联 / 无封面） */
const isManual = computed(() => !props.order.recipeId);

/** 库菜耗时（按 recipeId 补取；菜谱被删则不显示） */
const durationMin = computed(() => {
  if (!props.order.recipeId) return undefined;
  return getRecipeById(props.order.recipeId)?.durationMin;
});

/** 诉求行文案与色调 */
const appeal = computed(() => {
  const o = props.order;
  if (o.status === 'cancelled') {
    return { text: '点菜已取消', tone: 'muted' as const };
  }
  if (o.status === 'done') {
    return { text: `${getMember(o.claimerId).name} 做好了`, tone: 'done' as const };
  }
  if (o.status === 'claimed') {
    return { text: `${getMember(o.claimerId).name} 来做`, tone: 'primary' as const };
  }
  // open
  if (o.assigneeId) {
    return { text: `@${getMember(o.assigneeId).name} 来做`, tone: 'primary' as const };
  }
  return { text: '谁做都行～', tone: 'muted' as const };
});

const isRequester = computed(() => props.order.requesterId === props.currentMemberId);
const isAssignee = computed(() => !!props.order.assigneeId && props.order.assigneeId === props.currentMemberId);
const isClaimer = computed(() => !!props.order.claimerId && props.order.claimerId === props.currentMemberId);

/** 按钮矩阵（详见需求文档 §5.3） */
const showCancel = computed(() => props.order.status === 'open' && isRequester.value);
const showDecline = computed(() => props.order.status === 'open' && isAssignee.value);
const showClaim = computed(() => props.order.status === 'open');
const showRelease = computed(() => props.order.status === 'claimed' && isClaimer.value);
const showStart = computed(() => props.order.status === 'claimed' && isClaimer.value && !isManual.value);
const showComplete = computed(() => props.order.status === 'claimed' && isClaimer.value);

/** 操作区是否出现（claimed 态非认领人、done/cancelled 均无按钮） */
const hasActions = computed(
  () =>
    showCancel.value ||
    showDecline.value ||
    showClaim.value ||
    showRelease.value ||
    showStart.value ||
    showComplete.value,
);

function tapCancel() {
  emit('cancel', props.order.id);
}
function tapDecline() {
  emit('decline', props.order.id);
}
function tapClaim() {
  emit('claim', props.order.id);
}
function tapRelease() {
  emit('release', props.order.id);
}
function tapStart() {
  emit('start', props.order.id);
}
function tapComplete() {
  emit('complete', props.order.id);
}

/** 库菜卡封面 / 菜名 → 菜谱详情（cancelled 态不可点；手写简卡无入口） */
const canOpenRecipe = computed(
  () => !isManual.value && props.order.status !== 'cancelled',
);

function tapOpenRecipe() {
  if (canOpenRecipe.value && props.order.recipeId) {
    emit('open-recipe', props.order.id);
  }
}
</script>

<template>
  <view class="order-card" :class="{ 'order-card--off': order.status === 'done' || order.status === 'cancelled' }">
    <!-- 上半部：菜信息 -->
    <view class="order-card__dish">
      <!-- 库菜封面（可点 → 菜谱详情；cancelled 不可点） -->
      <image
        v-if="!isManual && order.cover"
        class="order-card__cover"
        :class="{ 'order-card__cover--link': canOpenRecipe }"
        :src="order.cover"
        mode="aspectFill"
        @tap="tapOpenRecipe"
      />
      <!-- 手写菜：主色浅底"菜"字块 -->
      <view v-else class="order-card__manual">
        <text class="order-card__manual-char">菜</text>
      </view>

      <view class="order-card__info">
        <text
          class="order-card__name"
          :class="{ 'order-card__name--link': canOpenRecipe }"
          @tap="tapOpenRecipe"
        >{{ order.dishName }}</text>
        <view class="order-card__tags">
          <text class="order-card__time">{{ order.timeTag }}</text>
          <text v-if="durationMin" class="order-card__dur">约 {{ durationMin }} 分钟</text>
        </view>
      </view>
    </view>

    <!-- 诉求行 -->
    <view class="order-card__appeal">
      <!-- done：绿底圆徽章 + 白勾（check.png 为白色资源，需色块衬托） -->
      <view v-if="order.status === 'done'" class="order-card__check-badge">
        <image class="order-card__check-icon" src="/static/icons/check.png" mode="aspectFit" />
      </view>
      <text class="order-card__appeal-text" :class="`order-card__appeal-text--${appeal.tone}`">{{ appeal.text }}</text>
    </view>

    <!-- 操作区：按 状态 × 我是谁 渲染（需求文档 §5.3 按钮矩阵） -->
    <view v-if="hasActions" class="order-card__actions">
      <!-- claimed 认领人：释放（文字按钮，靠左） -->
      <view v-if="showRelease" class="act-text" @tap="tapRelease">
        <text class="act-text__text">我不做了</text>
      </view>
      <!-- open：点菜人撤单 -->
      <view v-if="showCancel" class="act-ghost" @tap="tapCancel">
        <text class="act-ghost__text">取消点菜</text>
      </view>
      <!-- open：被指派人婉拒 -->
      <view v-if="showDecline" class="act-ghost" @tap="tapDecline">
        <text class="act-ghost__text">婉拒</text>
      </view>
      <!-- 弹性间隔：主操作靠右 -->
      <view v-if="showRelease || showCancel || showDecline" class="act-spacer" />
      <!-- claimed 认领人 + 库菜：进做菜引导（工单 05 接跳转） -->
      <view v-if="showStart" class="act-outline" @tap="tapStart">
        <text class="act-outline__text">开始做</text>
      </view>
      <!-- open：任何成员认领/接单/抢单；claimed 认领人：完成 -->
      <view v-if="showClaim" class="act-primary" @tap="tapClaim">
        <text class="act-primary__text">我来做</text>
      </view>
      <view v-if="showComplete" class="act-primary" @tap="tapComplete">
        <text class="act-primary__text">做好了</text>
      </view>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.order-card {
  width: 480rpx;
  padding: 20rpx;
  border: 1px solid $c-line;
  border-radius: 20rpx;
  background-color: $c-card;
  box-shadow: 0 2rpx 10rpx rgba(31, 27, 22, 0.05);
  box-sizing: border-box;
}

/* done / cancelled 整卡弱化 */
.order-card--off {
  opacity: 0.62;
}

/* 菜信息行 */
.order-card__dish {
  display: flex;
}

.order-card__cover {
  flex-shrink: 0;
  width: 120rpx;
  height: 120rpx;
  border-radius: 14rpx;
  background-color: $c-bg;
}

.order-card__manual {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: 120rpx;
  height: 120rpx;
  border-radius: 14rpx;
  background-color: $c-primary-soft;
}

.order-card__manual-char {
  color: $c-primary;
  font-size: 40rpx;
  font-weight: 600;
}

.order-card__info {
  display: flex;
  flex-direction: column;
  justify-content: center;
  min-width: 0;
  margin-left: 18rpx;
}

.order-card__name {
  font-size: 30rpx;
  font-weight: 600;
  color: $c-text;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 可跳详情的库菜：点击反馈（不做链接色，保持消息卡语境） */
.order-card__cover--link:active,
.order-card__name--link:active {
  opacity: 0.7;
}

.order-card__tags {
  display: flex;
  align-items: center;
  margin-top: 12rpx;
}

.order-card__time {
  padding: 4rpx 14rpx;
  border-radius: 8rpx;
  background-color: $c-primary-soft;
  color: $c-primary;
  font-size: 20rpx;
}

.order-card__dur {
  margin-left: 12rpx;
  font-size: 22rpx;
  color: $c-text-muted;
}

/* 诉求行 */
.order-card__appeal {
  display: flex;
  align-items: center;
  margin-top: 16rpx;
}

.order-card__check-badge {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: 32rpx;
  height: 32rpx;
  margin-right: 10rpx;
  border-radius: 50%;
  background-color: #2f9e44;
}

.order-card__check-icon {
  width: 20rpx;
  height: 20rpx;
}

.order-card__appeal-text {
  font-size: 26rpx;
}

.order-card__appeal-text--primary {
  color: $c-primary;
}

.order-card__appeal-text--muted {
  color: $c-text-muted;
}

.order-card__appeal-text--done {
  color: #2f9e44;
}

/* 操作区 */
.order-card__actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 14rpx;
  padding-top: 14rpx;
  border-top: 1px solid $c-line;
}

/* 灰色描边小字按钮（取消 / 婉拒） */
.act-ghost {
  padding: 10rpx 26rpx;
  margin-right: 16rpx;
  border: 1px solid $c-line;
  border-radius: 999rpx;
  background-color: $c-card;

  &:active {
    opacity: 0.85;
  }
}

.act-ghost__text {
  font-size: 24rpx;
  color: $c-text-muted;
}

/* 主色描边次按钮（开始做） */
.act-outline {
  padding: 10rpx 26rpx;
  margin-right: 16rpx;
  border: 1px solid $c-primary;
  border-radius: 999rpx;
  background-color: $c-card;

  &:active {
    opacity: 0.85;
  }
}

.act-outline__text {
  font-size: 24rpx;
  color: $c-primary;
}

/* 主色浅底小胶囊（我来做 / 做好了） */
.act-primary {
  padding: 10rpx 30rpx;
  border: 1px solid $c-primary;
  border-radius: 999rpx;
  background-color: $c-primary-soft;

  &:active {
    opacity: 0.85;
  }
}

.act-primary__text {
  font-size: 24rpx;
  color: $c-primary;
}

/* 文字按钮（我不做了） */
.act-text {
  padding: 10rpx 0;

  &:active {
    opacity: 0.7;
  }
}

.act-text__text {
  font-size: 24rpx;
  color: $c-text-muted;
}

/* 弹性间隔：把主操作推到右侧 */
.act-spacer {
  flex: 1;
}
</style>
