<script setup lang="ts">
import { computed, onUnmounted, ref } from 'vue';
import { onLoad, onUnload } from '@dcloudio/uni-app';
import Chip from '@/components/Chip.vue';
import NavBar from '@/components/NavBar.vue';
import { getRecipeById } from '@/store';
import { getRecipeIngredients } from '@/mock/recipes';
import type { Recipe } from '@/types';
import { scaleAmount, SERVING_OPTIONS } from '@/utils/servings';

/** 每步计时器状态 */
interface StepTimer {
  state: 'idle' | 'running' | 'paused' | 'finished';
  /** 剩余秒数 */
  remainSec: number;
}

const recipe = ref<Recipe | null>(null);
/** 目标人数（与配料速查的换算联动） */
const targetServings = ref(2);
/** 当前版本（仅自家菜有） */
const activeVersionId = ref('');

/** 已勾选完成的步骤下标 */
const doneSteps = ref<number[]>([]);
/** 配料速查是否展开（默认收起成一行） */
const quickOpen = ref(false);
/** 每步的计时器：步骤下标 -> 状态 */
const timers = ref<Record<number, StepTimer>>({});

let tickTimer: ReturnType<typeof setInterval> | null = null;

onLoad((query) => {
  const found = getRecipeById(String(query?.id ?? ''));
  recipe.value = found ?? null;
  const servings = Number(query?.servings);
  targetServings.value = SERVING_OPTIONS.includes(servings) ? servings : (found?.servings ?? 2);
  activeVersionId.value = String(query?.version ?? '') || (found?.versions?.[0]?.id ?? '');

  // 做菜中保持屏幕常亮（H5 端不支持，忽略）
  // #ifndef H5
  uni.setKeepScreenOn({ keepScreenOn: true });
  // #endif
});

onUnload(() => {
  stopTick();
  // 离开引导页时恢复系统默认常亮设置（H5 端不支持，忽略）
  // #ifndef H5
  uni.setKeepScreenOn({ keepScreenOn: false });
  // #endif
});

onUnmounted(() => {
  stopTick();
});

const steps = computed(() => recipe.value?.steps ?? []);

/** 当前步 = 第一个未完成的步骤；全部完成时为 -1（无高亮） */
const currentStepIndex = computed(() => steps.value.findIndex((_, index) => !doneSteps.value.includes(index)));

const allDone = computed(() => steps.value.length > 0 && doneSteps.value.length === steps.value.length);

/** 速查用的配料（带按人数的换算结果） */
const scaledIngredients = computed(() => {
  const r = recipe.value;
  if (!r) return [];
  return getRecipeIngredients(r, activeVersionId.value).map((i) => ({
    name: i.name,
    ...scaleAmount(i.amount, i.unit, r.servings, targetServings.value),
  }));
});

function toggleStep(index: number) {
  const pos = doneSteps.value.indexOf(index);
  if (pos >= 0) {
    doneSteps.value.splice(pos, 1);
  } else {
    doneSteps.value.push(index);
  }
}

/** 取某一步的计时器状态（未启动过时为 idle） */
function timerOf(index: number): StepTimer {
  return timers.value[index] ?? { state: 'idle', remainSec: 0 };
}

function startTimer(index: number) {
  const total = steps.value[index]?.timerSec ?? 0;
  if (!total) return;
  timers.value[index] = { state: 'running', remainSec: total };
  startTick();
}

function pauseTimer(index: number) {
  const timer = timers.value[index];
  if (timer?.state === 'running') {
    timer.state = 'paused';
  }
}

function resumeTimer(index: number) {
  const timer = timers.value[index];
  if (timer?.state === 'paused') {
    timer.state = 'running';
    startTick();
  }
}

function resetTimer(index: number) {
  timers.value[index] = { state: 'idle', remainSec: 0 };
}

/** 每秒走一格：所有 running 的计时器一起递减，到 0 进入"时间到" */
function startTick() {
  if (tickTimer) return;
  tickTimer = setInterval(() => {
    let hasRunning = false;
    Object.values(timers.value).forEach((timer) => {
      if (timer.state !== 'running') return;
      timer.remainSec = Math.max(0, timer.remainSec - 1);
      if (timer.remainSec === 0) {
        timer.state = 'finished';
      } else {
        hasRunning = true;
      }
    });
    if (!hasRunning) stopTick();
  }, 1000);
}

function stopTick() {
  if (tickTimer) {
    clearInterval(tickTimer);
    tickTimer = null;
  }
}

/** 秒数 → 倒计时文本（如 04:59） */
function formatClock(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

/** 全部做完 → 去记一笔（带上菜谱 / 人数 / 版本） */
function goLog() {
  const r = recipe.value;
  if (!r) return;
  const version = activeVersionId.value ? `&version=${activeVersionId.value}` : '';
  uni.navigateTo({
    url: `/pages/cooking-log-edit/index?id=${r.id}&servings=${targetServings.value}${version}`,
  });
}
</script>

<template>
  <view class="page page--footer">
    <NavBar title="做菜引导" />

    <view v-if="recipe" class="body">
      <!-- 菜名 + 几人吃 -->
      <view class="head">
        <text class="head__dish">{{ recipe.name }}</text>
        <view class="head__servings">
          <text class="head__label">几人吃</text>
          <view class="head__chips">
            <Chip
              v-for="n in SERVING_OPTIONS"
              :key="n"
              class="head__chip"
              size="sm"
              :label="String(n)"
              :selected="n === targetServings"
              @tap="targetServings = n"
            />
          </view>
        </view>
      </view>

      <!-- 配料速查：默认收起成一行，展开后显示换算后的配料 -->
      <view class="quick">
        <view class="quick__head" @tap="quickOpen = !quickOpen">
          <text class="quick__title">配料速查</text>
          <text class="quick__sub">{{ scaledIngredients.length }} 样 · {{ targetServings }} 人份</text>
          <image
            class="quick__arrow"
            :class="{ 'quick__arrow--open': quickOpen }"
            src="/static/icons/chevron-down.png"
            mode="aspectFit"
          />
        </view>
        <view v-if="quickOpen" class="quick__body">
          <view v-for="ing in scaledIngredients" :key="ing.name" class="quick__row">
            <text class="quick__name">{{ ing.name }}</text>
            <text class="quick__amount" :class="{ 'quick__amount--special': ing.isSpecial }">{{ ing.text }}</text>
          </view>
        </view>
      </view>

      <view class="keep-on">做菜中保持屏幕常亮</view>

      <!-- 步骤列表：点按勾选（划线变灰）、当前步高亮、按需计时 -->
      <view class="steps">
        <view
          v-for="(step, index) in steps"
          :key="index"
          class="step"
          :class="{
            'step--done': doneSteps.includes(index),
            'step--current': index === currentStepIndex,
          }"
        >
          <view class="step__main" @tap="toggleStep(index)">
            <text class="step__no">{{ index + 1 }}</text>
            <text class="step__text">{{ step.text }}</text>
          </view>

          <view v-if="step.timerSec" class="step__timer">
            <!-- 未启动 -->
            <view v-if="timerOf(index).state === 'idle'" class="timer-btn" @tap="startTimer(index)">计时</view>

            <!-- 时间到 -->
            <view v-else-if="timerOf(index).state === 'finished'" class="timeup">
              <text class="timeup__text">时间到</text>
              <view class="timer-btn timer-btn--sm" @tap="resetTimer(index)">重置</view>
            </view>

            <!-- 倒计时中 / 已暂停 -->
            <view v-else class="countdown">
              <text class="countdown__time">{{ formatClock(timerOf(index).remainSec) }}</text>
              <view
                v-if="timerOf(index).state === 'running'"
                class="timer-btn timer-btn--sm"
                @tap="pauseTimer(index)"
              >
                暂停
              </view>
              <view v-else class="timer-btn timer-btn--sm" @tap="resumeTimer(index)">继续</view>
              <view class="timer-btn timer-btn--sm" @tap="resetTimer(index)">重置</view>
            </view>
          </view>
        </view>
      </view>
    </view>

    <!-- 步骤全部完成后出现 -->
    <view v-if="allDone" class="footer">
      <button class="btn-primary" @tap="goLog">记一笔</button>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.body {
  padding: 8rpx 32rpx 0;
}

.head__dish {
  font-size: 42rpx;
  font-weight: 600;
  color: $c-text;
}

.head__servings {
  display: flex;
  align-items: center;
  margin-top: 24rpx;
}

.head__label {
  margin-right: 20rpx;
  font-size: 26rpx;
  color: $c-text-muted;
}

.head__chips {
  display: flex;
}

.head__chip {
  margin-right: 14rpx;
}

/* 配料速查 */
.quick {
  overflow: hidden;
  margin-top: 28rpx;
  border-radius: 24rpx;
  background-color: $c-card;
  box-shadow: 0 4rpx 20rpx rgba(31, 27, 22, 0.04);
}

.quick__head {
  display: flex;
  align-items: center;
  padding: 24rpx 28rpx;
}

.quick__title {
  font-size: 28rpx;
  font-weight: 600;
  color: $c-text;
}

.quick__sub {
  flex: 1;
  margin-left: 16rpx;
  font-size: 22rpx;
  color: $c-text-muted;
}

/* 展开指示箭头（Lucide chevron-down） */
.quick__arrow {
  width: 28rpx;
  height: 28rpx;
  transition: transform 0.15s ease;
}

.quick__arrow--open {
  transform: rotate(180deg);
}

.quick__body {
  padding: 0 28rpx 8rpx;
}

.quick__row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 18rpx 0;
  border-top: 1px solid $c-line;
}

.quick__name {
  font-size: 26rpx;
  color: $c-text;
}

.quick__amount {
  font-size: 26rpx;
  font-weight: 500;
  color: $c-text;
}

.quick__amount--special {
  font-weight: 400;
  color: $c-text-muted;
}

/* 常亮提示 */
.keep-on {
  display: flex;
  align-items: center;
  margin: 28rpx 4rpx 24rpx;
  font-size: 24rpx;
  color: $c-text-muted;

  &::before {
    content: '';
    width: 12rpx;
    height: 12rpx;
    margin-right: 12rpx;
    border-radius: 50%;
    background-color: rgba(232, 89, 12, 0.55);
  }
}

/* 步骤 */
.step {
  margin-bottom: 20rpx;
  padding: 26rpx 28rpx;
  border-radius: 24rpx;
  background-color: $c-card;
  box-shadow: 0 4rpx 20rpx rgba(31, 27, 22, 0.04);
}

/* 当前步高亮 */
.step--current {
  box-shadow: 0 0 0 3rpx rgba(232, 89, 12, 0.35);
}

.step__main {
  display: flex;
  align-items: flex-start;
}

.step__no {
  flex-shrink: 0;
  width: 44rpx;
  height: 44rpx;
  margin-right: 20rpx;
  border-radius: 50%;
  background-color: $c-primary-soft;
  color: $c-primary;
  font-size: 24rpx;
  text-align: center;
  line-height: 44rpx;
}

.step__text {
  flex: 1;
  font-size: 28rpx;
  line-height: 1.7;
  color: $c-text;
}

/* 已完成：划线变灰 */
.step--done .step__text {
  color: #b3a99e;
  text-decoration: line-through;
}

.step--done .step__no {
  background-color: #f1ebe4;
  color: #b3a99e;
}

.step__timer {
  margin-top: 20rpx;
  padding-left: 64rpx;
}

.timer-btn {
  display: inline-flex;
  align-items: center;
  padding: 8rpx 26rpx;
  border: 1px solid rgba(232, 89, 12, 0.35);
  border-radius: 999rpx;
  background-color: $c-primary-soft;
  color: $c-primary;
  font-size: 24rpx;
}

.timer-btn--sm {
  margin-left: 16rpx;
  padding: 6rpx 20rpx;
  border-color: $c-line;
  background-color: transparent;
  color: $c-text-muted;
}

.countdown {
  display: flex;
  align-items: center;
}

.countdown__time {
  font-size: 32rpx;
  font-weight: 600;
  letter-spacing: 2rpx;
  color: $c-primary;
}

/* "时间到"提醒样式 */
.timeup {
  display: inline-flex;
  align-items: center;
  padding: 8rpx 12rpx 8rpx 20rpx;
  border-radius: 16rpx;
  background-color: rgba(232, 89, 12, 0.12);
}

.timeup__text {
  font-size: 26rpx;
  font-weight: 600;
  color: $c-primary;
}
</style>