<script setup lang="ts">
/**
 * 家庭群聊（tabBar"厨房群"）
 * - 自绘顶部（群名 / 成员数 / 群信息入口 ⋯）固定在视口顶部，消息在其下方滚动时头部始终常驻
 * - 消息流：日期分隔行 + 文字气泡（左右按当前成员分列）+ 系统提示胶囊 + 点菜卡片
 * - 底部输入栏：+ 点菜（工单 03 起打开点菜面板）+ 文字发送
 * - onShow 清当前空间未读并移除 tabBar 红点（index=2，中间格）
 */
import { computed, nextTick, ref, watch } from 'vue';
import { onShow } from '@dcloudio/uni-app';
import MemberAvatar from '@/components/MemberAvatar.vue';
import OrderCard from '@/components/chat/OrderCard.vue';
import OrderCreateSheet from '@/components/chat/OrderCreateSheet.vue';
import { mockFlags } from '@/mock/config';
import {
  claimOrder,
  cancelOrder,
  completeOrder,
  declineOrder,
  enterChatClearUnread,
  getMessages,
  getOrder,
  releaseOrder,
  sendText,
  store,
} from '@/store';
import type { ChatMessage } from '@/types';
import { formatChatDay } from '@/utils/date';

/** 状态栏高度（小程序端留出安全区；H5 端为 0） */
const statusBarHeight = uni.getSystemInfoSync().statusBarHeight ?? 0;

/** 固定头部总高度（状态栏 + 88rpx 标题栏），换算 px 给消息流顶部让位（不用魔法数） */
const chatHeadHeight = `${statusBarHeight + uni.upx2px(88)}px`;

/** 渲染行：消息 或 日期分隔 */
interface ChatRow {
  kind: 'day' | 'msg';
  key: string;
  message?: ChatMessage;
}

/** 消息流 + 跨天日期分隔行（响应式跟随 store / 当前空间 / 当前身份） */
const rows = computed<ChatRow[]>(() => {
  const list = getMessages(store.spaceName);
  const out: ChatRow[] = [];
  let lastDay = '';
  list.forEach((msg) => {
    const day = msg.createdAt.slice(0, 10);
    if (day !== lastDay) {
      out.push({ kind: 'day', key: `day-${day}-${msg.id}`, message: msg });
      lastDay = day;
    }
    out.push({ kind: 'msg', key: msg.id, message: msg });
  });
  return out;
});

const memberCount = computed(() => store.members.length);

/**
 * 空态：当前空间无消息，或 mockFlags.emptyChat 强制初始为空。
 * 本会话一旦发出过内容（文字 / 点菜），强制开关让位，新消息照常出现。
 */
const chatStartedThisSession = ref(false);

const showEmpty = computed(
  () => !chatStartedThisSession.value && (mockFlags.emptyChat || rows.value.length === 0),
);

/** scroll-view 锚点：始终指向最后一行（进页 / 新消息后滚底） */
const scrollIntoId = ref('');

function scrollToBottom() {
  const last = rows.value[rows.value.length - 1];
  if (!last) return;
  // 先清空再赋值，保证同一锚点也能重新触发滚动
  scrollIntoId.value = '';
  nextTick(() => {
    scrollIntoId.value = `row-${last.key}`;
  });
}

/** HH:mm 时刻 */
function hhmm(createdAt: string): string {
  return createdAt.slice(11, 16);
}

/** 是否为"我"发的（右侧橙气泡） */
function isMine(msg: ChatMessage): boolean {
  return msg.senderId === store.currentMemberId;
}

function sendName(msg: ChatMessage): string {
  const m = store.members.find((x) => x.id === msg.senderId);
  return m?.name ?? '家人';
}

/** 点菜消息的订单是否还存在（悬空 orderId 防御） */
function hasOrder(msg: ChatMessage): boolean {
  return !!msg.orderId && !!getOrder(msg.orderId);
}

/** 解析订单（仅在 hasOrder 为真时给卡片用；给一个空壳兜底满足类型） */
function orderOf(msg: ChatMessage): NonNullable<ReturnType<typeof getOrder>> {
  return (msg.orderId && getOrder(msg.orderId)) || {
    id: '',
    dishName: '',
    timeTag: '今晚',
    requesterId: '',
    status: 'cancelled',
    createdAt: '',
  };
}

/** 右上 ⋯ → 群信息页（成员列表 + 演示身份切换） */
function openInfo() {
  uni.navigateTo({ url: '/pages/chat-info/index' });
}

/* ===== 底部输入栏 ===== */

const inputText = ref('');

/** 发送按钮是否可点（trim 后非空） */
const canSend = computed(() => inputText.value.trim().length > 0);

function doSend() {
  const msg = sendText(inputText.value);
  if (!msg) return;
  inputText.value = '';
  chatStartedThisSession.value = true;
  scrollToBottom();
}

/** 点菜面板发出一张卡：空态解除 */
function onOrderCreated() {
  chatStartedThisSession.value = true;
  scrollToBottom();
}

/** 点菜面板开关 */
const orderSheetOpen = ref(false);

/** 左侧 + → 打开点菜面板 */
function openOrderPanel() {
  orderSheetOpen.value = true;
}

/* ===== 点菜卡片操作（状态机） ===== */

/** 统一的轻反馈 toast */
function toast(title: string) {
  uni.showToast({ title, icon: 'none', duration: 900 });
}

function onCancelOrder(id: string) {
  if (cancelOrder(id)) toast('已取消');
}

function onDeclineOrder(id: string) {
  if (declineOrder(id)) toast('已婉拒');
}

function onClaimOrder(id: string) {
  if (claimOrder(id)) toast('好的，就等你啦');
}

function onReleaseOrder(id: string) {
  if (releaseOrder(id)) toast('已释放');
}

function onCompleteOrder(id: string) {
  const result = completeOrder(id);
  if (result) toast('已记下这道菜');
}

/** 认领人"开始做"：带 orderId 进做菜引导，完成打卡时回写订单（工单 05） */
function onStartOrder(id: string) {
  const order = getOrder(id);
  if (!order?.recipeId) return;
  uni.navigateTo({ url: `/pages/cooking-guide/index?id=${order.recipeId}&orderId=${id}` });
}

/** 库菜卡 → 菜谱详情（手写简卡不触发） */
function onOpenRecipe(id: string) {
  const order = getOrder(id);
  if (!order?.recipeId) return;
  uni.navigateTo({ url: `/pages/recipe-detail/index?id=${order.recipeId}` });
}

// 消息条数变化（自己发送 / 后续点菜状态变化）自动跟随滚底
watch(
  () => rows.value.length,
  () => scrollToBottom(),
);

onShow(() => {
  // 进群即清当前空间未读并移除红点（切 tab 回来也算）
  enterChatClearUnread();
  uni.removeTabBarBadge({
    index: 2,
    fail: () => {
      /* 无红点时部分平台会报错，静默 */
    },
  });
  scrollToBottom();
});
</script>

<template>
  <view class="chat">
    <!-- 自绘顶部：固定在视口顶部，下方消息滚动时始终常驻 -->
    <view class="chat-head">
      <view :style="{ height: statusBarHeight + 'px' }" />
      <view class="chat-head__bar">
        <view class="chat-head__titles">
          <text class="chat-head__name">{{ store.spaceName }}</text>
          <text class="chat-head__count">{{ memberCount }} 位家人</text>
        </view>
        <view class="chat-head__more" @tap="openInfo">
          <image class="chat-head__more-icon" src="/static/icons/more.png" mode="aspectFit" />
        </view>
      </view>
    </view>

    <!-- 消息流：内容 padding-top 让出固定头部高度，消息只在头部下方滚动 -->
    <scroll-view class="chat-body" scroll-y :scroll-into-view="scrollIntoId" :scroll-with-animation="true">
      <!-- 空态（无消息空间 / mockFlags.emptyChat 演示；首条内容发出后消失） -->
      <view v-if="showEmpty" class="empty" :style="{ paddingTop: chatHeadHeight }">
        <view class="empty__ill">
          <view class="empty__bubble">
            <view class="empty__dot empty__dot--1" />
            <view class="empty__dot empty__dot--2" />
            <view class="empty__dot empty__dot--3" />
          </view>
          <view class="empty__tail" />
        </view>
        <text class="empty__title">还没有聊天</text>
        <text class="empty__sub">点下方 + 点个菜，或直接说点什么</text>
      </view>

      <view v-else class="chat-body__inner" :style="{ paddingTop: chatHeadHeight }">
        <template v-for="row in rows" :key="row.key">
          <!-- 日期分隔行 -->
          <view v-if="row.kind === 'day' && row.message" :id="`row-${row.key}`" class="day-row">
            <text class="day-row__text">{{ formatChatDay(row.message.createdAt) }}</text>
          </view>

          <!-- 系统提示 -->
          <view v-else-if="row.message && row.message.type === 'system'" :id="`row-${row.key}`" class="sys-row">
            <text class="sys-row__text">{{ row.message.text }}</text>
          </view>

          <!-- 点菜卡片 -->
          <view
            v-else-if="row.message && row.message.type === 'order'"
            :id="`row-${row.key}`"
            class="msg-row"
            :class="{ 'msg-row--mine': isMine(row.message) }"
          >
            <MemberAvatar v-if="!isMine(row.message)" :member-id="row.message.senderId" :size="64" />
            <view class="msg-col" :class="{ 'msg-col--mine': isMine(row.message) }">
              <text v-if="!isMine(row.message)" class="msg-name">{{ sendName(row.message) }}</text>
              <OrderCard
                v-if="hasOrder(row.message)"
                :order="orderOf(row.message)"
                :current-member-id="store.currentMemberId"
                @cancel="onCancelOrder"
                @decline="onDeclineOrder"
                @claim="onClaimOrder"
                @release="onReleaseOrder"
                @complete="onCompleteOrder"
                @start="onStartOrder"
                @open-recipe="onOpenRecipe"
              />
              <view v-else class="order-placeholder">
                <text class="order-placeholder__text">点菜信息不可用</text>
              </view>
            </view>
            <MemberAvatar v-if="isMine(row.message)" :member-id="row.message.senderId" :size="64" />
          </view>

          <!-- 文字消息 -->
          <view
            v-else-if="row.message"
            :id="`row-${row.key}`"
            class="msg-row"
            :class="{ 'msg-row--mine': isMine(row.message) }"
          >
            <MemberAvatar v-if="!isMine(row.message)" :member-id="row.message.senderId" :size="64" />
            <view class="msg-col" :class="{ 'msg-col--mine': isMine(row.message) }">
              <view class="msg-meta" :class="{ 'msg-meta--mine': isMine(row.message) }">
                <text v-if="!isMine(row.message)" class="msg-name">{{ sendName(row.message) }}</text>
                <text class="msg-time">{{ hhmm(row.message.createdAt) }}</text>
              </view>
              <view class="bubble" :class="isMine(row.message) ? 'bubble--mine' : 'bubble--other'">
                <text class="bubble__text">{{ row.message.text }}</text>
              </view>
            </view>
            <MemberAvatar v-if="isMine(row.message)" :member-id="row.message.senderId" :size="64" />
          </view>
        </template>
      </view>
    </scroll-view>

    <!-- 底部输入栏：fixed + var(--window-bottom) 适配 H5 tabBar（小程序端该变量为 0） -->
    <view class="chat-input">
      <view class="chat-input__plus" @tap="openOrderPanel">
        <image class="chat-input__plus-icon" src="/static/icons/plus.png" mode="aspectFit" />
      </view>
      <input
        v-model="inputText"
        class="chat-input__field"
        placeholder-class="input-ph"
        placeholder="说点什么…"
        confirm-type="send"
        cursor-spacing="12"
        @confirm="doSend"
      />
      <view class="chat-input__send" :class="{ 'chat-input__send--on': canSend }" @tap="doSend">
        <text class="chat-input__send-text">发送</text>
      </view>
    </view>

    <!-- 点个菜面板 -->
    <OrderCreateSheet :visible="orderSheetOpen" @close="orderSheetOpen = false" @created="onOrderCreated" />
  </view>
</template>

<style lang="scss" scoped>
.chat {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background-color: $c-bg;
}

/* 顶部（固定在视口顶部；消息流以同等高度的 padding-top 让位，见内联 chatHeadHeight） */
.chat-head {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 20;
  background-color: $c-bg;
  border-bottom: 1px solid $c-line;
}

.chat-head__bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 88rpx;
  padding: 0 32rpx;
}

.chat-head__titles {
  display: flex;
  align-items: baseline;
}

.chat-head__name {
  font-size: 34rpx;
  font-weight: 600;
  color: $c-text;
}

.chat-head__count {
  margin-left: 14rpx;
  font-size: 22rpx;
  color: $c-text-muted;
}

.chat-head__more {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 64rpx;
  height: 64rpx;
  margin-right: -12rpx;
}

.chat-head__more-icon {
  width: 40rpx;
  height: 40rpx;
}

/* 消息流 */
.chat-body {
  flex: 1;
  min-height: 0;
}

/* 空态 */
.empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 62vh;
  /* padding-top 内联传入（=固定头部实际高度），保证空态插画不被头部遮挡 */
  padding: 0 64rpx;
}

.empty__ill {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 180rpx;
  height: 180rpx;
  border-radius: 44rpx;
  background-color: $c-primary-soft;
}

/* 主色描边对话气泡（纯 CSS，不引图片） */
.empty__bubble {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 96rpx;
  height: 72rpx;
  border: 4rpx solid $c-primary;
  border-radius: 22rpx;
}

.empty__tail {
  position: absolute;
  right: 42rpx;
  bottom: 44rpx;
  width: 0;
  height: 0;
  border-top: 14rpx solid transparent;
  border-right: 18rpx solid $c-primary;
  border-bottom: 0 solid $c-primary;
}

.empty__dot {
  width: 12rpx;
  height: 12rpx;
  margin: 0 6rpx;
  border-radius: 50%;
  background-color: $c-primary;
}

.empty__title {
  margin-top: 32rpx;
  font-size: 28rpx;
  color: $c-text;
}

.empty__sub {
  margin-top: 12rpx;
  font-size: 24rpx;
  color: $c-text-muted;
  text-align: center;
}

.chat-body__inner {
  /* 顶部 padding-top 内联传入（=固定头部实际高度）；底部为输入栏高度 + H5 tabBar 高度（--window-bottom）让位 */
  padding: 0 24rpx calc(132rpx + var(--window-bottom, 0));
}

/* 日期分隔行 */
.day-row {
  display: flex;
  justify-content: center;
  margin: 12rpx 0 24rpx;
}

.day-row__text {
  padding: 6rpx 20rpx;
  border-radius: 999rpx;
  background-color: rgba(107, 98, 89, 0.12);
  color: $c-text-muted;
  font-size: 22rpx;
}

/* 系统提示胶囊 */
.sys-row {
  display: flex;
  justify-content: center;
  margin: 20rpx 0;
}

.sys-row__text {
  padding: 8rpx 22rpx;
  border-radius: 999rpx;
  background-color: rgba(107, 98, 89, 0.08);
  color: #9a928a;
  font-size: 22rpx;
  line-height: 1.4;
  text-align: center;
}

/* 消息行 */
.msg-row {
  display: flex;
  align-items: flex-start;
  margin-bottom: 28rpx;
}

/* 自己的消息整行靠右（气泡在头像左侧，对齐微信习惯） */
.msg-row--mine {
  justify-content: flex-end;
}

.msg-col {
  display: flex;
  flex-direction: column;
  max-width: 540rpx;
  margin: 0 16rpx;
}

.msg-col--mine {
  align-items: flex-end;
}

.msg-meta {
  display: flex;
  align-items: baseline;
  margin-bottom: 8rpx;

  &--mine {
    justify-content: flex-end;
  }
}

.msg-name {
  margin-right: 12rpx;
  font-size: 22rpx;
  color: $c-text-muted;
}

.msg-time {
  font-size: 22rpx;
  color: #a89f95;
}

/* 气泡 */
.bubble {
  padding: 18rpx 24rpx;
  border-radius: 20rpx;
}

.bubble--other {
  background-color: $c-card;
  border-top-left-radius: 6rpx;
  box-shadow: 0 2rpx 10rpx rgba(31, 27, 22, 0.04);
}

.bubble--mine {
  background-color: $c-primary;
  border-top-right-radius: 6rpx;
}

.bubble__text {
  font-size: 28rpx;
  line-height: 1.5;
  word-break: break-word;
  white-space: pre-wrap;
}

.bubble--other .bubble__text {
  color: $c-text;
}

.bubble--mine .bubble__text {
  color: #ffffff;
}

/* 点菜消息占位（工单 03 替换） */
.order-placeholder {
  padding: 28rpx 32rpx;
  border: 1px dashed $c-line;
  border-radius: 20rpx;
  background-color: $c-card;
}

.order-placeholder__text {
  font-size: 24rpx;
  color: #a89f95;
}

/* 底部输入栏（fixed；--window-bottom 让开 H5 tabBar，小程序端为 0） */
.chat-input {
  position: fixed;
  left: 0;
  right: 0;
  bottom: var(--window-bottom, 0);
  z-index: 10;
  display: flex;
  align-items: center;
  padding: 14rpx 24rpx 16rpx;
  background-color: $c-card;
  border-top: 1px solid $c-line;
}

/* + 点菜：主色实心圆（plus 图标本身为白色） */
.chat-input__plus {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: 72rpx;
  height: 72rpx;
  margin-right: 16rpx;
  border-radius: 50%;
  background-color: $c-primary;

  &:active {
    opacity: 0.85;
  }
}

.chat-input__plus-icon {
  width: 38rpx;
  height: 38rpx;
}

.chat-input__field {
  flex: 1;
  height: 72rpx;
  padding: 0 28rpx;
  border: 1px solid $c-line;
  border-radius: 999rpx;
  background-color: $c-bg;
  font-size: 28rpx;
  color: $c-text;
}

.chat-input__send {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 72rpx;
  margin-left: 16rpx;
  padding: 0 28rpx;
  border-radius: 999rpx;
  background-color: #e7e1da;

  &:active {
    opacity: 0.85;
  }
}

.chat-input__send--on {
  background-color: $c-primary;
}

.chat-input__send-text {
  font-size: 28rpx;
  color: #ffffff;
}

/* 禁用态：灰底时文字降透明表达不可点 */
.chat-input__send:not(.chat-input__send--on) .chat-input__send-text {
  color: rgba(255, 255, 255, 0.7);
}
</style>
