<script setup lang="ts">
/**
 * 点个菜（群聊输入栏 + 唤起的底部大面板）· 工单 03
 * - 菜品：菜谱库搜索/单选为主，手写库外菜名为辅，两模式互斥
 * - 时间：今晚（默认）/ 明天午餐 / 明天晚餐 / 周末 / 不着急
 * - 点给谁：不指定（默认）/ 单选某位家人
 * - 发送：createOrder 落 store，emit created + close
 */
import { computed, ref, watch } from 'vue';
import Chip from '@/components/Chip.vue';
import MemberAvatar from '@/components/MemberAvatar.vue';
import { createOrder, store } from '@/store';
import type { OrderTimeTag } from '@/types';

const props = defineProps<{ visible: boolean }>();
const emit = defineEmits<{ (e: 'close'): void; (e: 'created', id: string): void }>();

/** 选菜模式：库 / 手写（互斥） */
const mode = ref<'lib' | 'manual'>('lib');
const keyword = ref('');
const selectedRecipeId = ref('');
const manualName = ref('');
const timeTag = ref<OrderTimeTag>('今晚');
/** 指派人 id；'' = 不指定 */
const assigneeId = ref('');

const TIME_OPTIONS: OrderTimeTag[] = ['今晚', '明天午餐', '明天晚餐', '周末', '不着急'];

/** 面板每次打开都重置为默认态 */
watch(
  () => props.visible,
  (v) => {
    if (v) resetForm();
  },
);

function resetForm() {
  mode.value = 'lib';
  keyword.value = '';
  selectedRecipeId.value = '';
  manualName.value = '';
  timeTag.value = '今晚';
  assigneeId.value = '';
}

/** 库菜搜索结果（按菜名 includes） */
const filteredRecipes = computed(() => {
  const kw = keyword.value.trim();
  const list = store.recipes;
  return kw ? list.filter((r) => r.name.includes(kw)) : list;
});

/** 选中的库菜对象 */
const selectedRecipe = computed(() => store.recipes.find((r) => r.id === selectedRecipeId.value));

/** 手写菜名（trim） */
const manualDish = computed(() => manualName.value.trim());

function pickRecipe(id: string) {
  selectedRecipeId.value = selectedRecipeId.value === id ? '' : id;
}

function switchToManual() {
  mode.value = 'manual';
  selectedRecipeId.value = '';
}

function switchToLib() {
  mode.value = 'lib';
  manualName.value = '';
}

function pickAssignee(id: string) {
  assigneeId.value = assigneeId.value === id ? '' : id;
}

/** 是否可发送：库模式选了菜，或手写模式有菜名 */
const canSubmit = computed(() => (mode.value === 'lib' ? !!selectedRecipe.value : manualDish.value.length > 0));

function submit() {
  if (!canSubmit.value) return;
  const order =
    mode.value === 'lib' && selectedRecipe.value
      ? createOrder({
          recipeId: selectedRecipe.value.id,
          dishName: selectedRecipe.value.name,
          cover: selectedRecipe.value.cover,
          timeTag: timeTag.value,
          assigneeId: assigneeId.value || undefined,
        })
      : createOrder({
          dishName: manualDish.value,
          timeTag: timeTag.value,
          assigneeId: assigneeId.value || undefined,
        });
  uni.showToast({ title: '已发到群里', icon: 'none', duration: 900 });
  emit('created', order.id);
  emit('close');
}
</script>

<template>
  <view v-if="visible" class="mask" @tap="emit('close')">
    <view class="sheet" @tap.stop>
      <!-- 标题行 -->
      <view class="sheet__head">
        <text class="sheet__title">点个菜</text>
        <view class="sheet__close" @tap="emit('close')">
          <image class="sheet__close-icon" src="/static/icons/close.png" mode="aspectFit" />
        </view>
      </view>

      <scroll-view class="sheet__body" scroll-y>
        <!-- 菜品选择：库模式 -->
        <template v-if="mode === 'lib'">
          <view class="search">
            <image class="search__icon" src="/static/icons/search.png" mode="aspectFit" />
            <input
              v-model="keyword"
              class="search__input"
              placeholder-class="input-ph"
              placeholder="搜菜名"
            />
          </view>

          <view class="recipe-list">
            <view
              v-for="r in filteredRecipes"
              :key="r.id"
              class="recipe-item"
              :class="{ 'recipe-item--on': r.id === selectedRecipeId }"
              @tap="pickRecipe(r.id)"
            >
              <image class="recipe-item__cover" :src="r.cover" mode="aspectFill" />
              <view class="recipe-item__info">
                <text class="recipe-item__name">{{ r.name }}</text>
                <text class="recipe-item__meta">{{ r.cuisine }}菜 · {{ r.durationMin }}分钟</text>
              </view>
              <view v-if="r.id === selectedRecipeId" class="recipe-item__badge">
                <image class="recipe-item__check" src="/static/icons/check.png" mode="aspectFit" />
              </view>
            </view>
            <view v-if="filteredRecipes.length === 0" class="recipe-empty">
              <text class="recipe-empty__text">没搜到这道菜</text>
            </view>
            <view class="switch-mode" @tap="switchToManual">
              <text class="switch-mode__text">想吃的不在库里？手动输入</text>
            </view>
          </view>
        </template>

        <!-- 菜品选择：手写模式 -->
        <template v-else>
          <input
            v-model="manualName"
            class="manual-input"
            placeholder-class="input-ph"
            placeholder="输入菜名，如：可乐排骨"
            :maxlength="20"
          />
          <view class="switch-mode switch-mode--left" @tap="switchToLib">
            <text class="switch-mode__text">从菜谱里选</text>
          </view>
        </template>

        <!-- 时间 -->
        <text class="section-label section-label--gap">什么时候吃</text>
        <view class="chip-row">
          <Chip
            v-for="t in TIME_OPTIONS"
            :key="t"
            class="chip-row__item"
            size="sm"
            :label="t"
            :selected="timeTag === t"
            @tap="timeTag = t"
          />
        </view>

        <!-- 点给谁 -->
        <text class="section-label section-label--gap">点给谁做</text>
        <view class="chip-row">
          <Chip
            class="chip-row__item"
            size="sm"
            label="不指定 · 谁做都行"
            :selected="assigneeId === ''"
            @tap="assigneeId = ''"
          />
          <view
            v-for="m in store.members"
            :key="m.id"
            class="person-chip"
            :class="{ 'person-chip--on': assigneeId === m.id }"
            @tap="pickAssignee(m.id)"
          >
            <MemberAvatar :member-id="m.id" :size="40" />
            <text class="person-chip__name">@{{ m.name }}</text>
          </view>
        </view>
      </scroll-view>

      <!-- 发送 -->
      <view class="sheet__footer">
        <button class="submit" :class="{ 'submit--off': !canSubmit }" :disabled="!canSubmit" @tap="submit">
          发到群里
        </button>
      </view>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.mask {
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  z-index: 30;
  background-color: rgba(31, 27, 22, 0.45);

  &:active {
    opacity: 0.98;
  }
}

.sheet {
  position: absolute;
  right: 0;
  bottom: 0;
  left: 0;
  display: flex;
  flex-direction: column;
  height: 85vh;
  padding: 0 32rpx;
  padding-bottom: calc(24rpx + env(safe-area-inset-bottom));
  border-radius: 28rpx 28rpx 0 0;
  background-color: $c-bg;
  animation: sheet-up 0.2s ease;
}

@keyframes sheet-up {
  from {
    transform: translateY(100%);
  }
  to {
    transform: translateY(0);
  }
}

.sheet__head {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: space-between;
  padding: 28rpx 0 20rpx;
}

.sheet__title {
  font-size: 34rpx;
  font-weight: 600;
  color: $c-text;
}

.sheet__close {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 60rpx;
  height: 60rpx;
  margin-right: -10rpx;
}

.sheet__close-icon {
  width: 34rpx;
  height: 34rpx;
}

.sheet__body {
  flex: 1;
  min-height: 0;
}

/* 搜索框 */
.search {
  display: flex;
  align-items: center;
  height: 76rpx;
  padding: 0 24rpx;
  border-radius: 999rpx;
  background-color: $c-card;
  border: 1px solid $c-line;
}

.search__icon {
  width: 30rpx;
  height: 30rpx;
  margin-right: 14rpx;
}

.search__input {
  flex: 1;
  font-size: 28rpx;
  color: $c-text;
}

/* 菜谱列表 */
.recipe-list {
  margin-top: 20rpx;
}

.recipe-item {
  display: flex;
  align-items: center;
  padding: 18rpx;
  margin-bottom: 16rpx;
  border: 2rpx solid transparent;
  border-radius: 18rpx;
  background-color: $c-card;

  &:active {
    opacity: 0.92;
  }
}

.recipe-item--on {
  border-color: $c-primary;
  background-color: $c-primary-soft;
}

.recipe-item__cover {
  flex-shrink: 0;
  width: 88rpx;
  height: 88rpx;
  border-radius: 12rpx;
  background-color: $c-bg;
}

.recipe-item__info {
  flex: 1;
  min-width: 0;
  margin-left: 18rpx;
}

.recipe-item__name {
  display: block;
  font-size: 30rpx;
  font-weight: 500;
  color: $c-text;
}

.recipe-item__meta {
  display: block;
  margin-top: 8rpx;
  font-size: 24rpx;
  color: $c-text-muted;
}

/* 选中徽章：主色圆底 + 白勾 */
.recipe-item__badge {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: 40rpx;
  height: 40rpx;
  border-radius: 50%;
  background-color: $c-primary;
}

.recipe-item__check {
  width: 24rpx;
  height: 24rpx;
}

.recipe-empty {
  padding: 60rpx 0;
  text-align: center;
}

.recipe-empty__text {
  font-size: 26rpx;
  color: $c-text-muted;
}

.switch-mode {
  padding: 18rpx 0 8rpx;
  text-align: center;
}

.switch-mode--left {
  text-align: left;
}

.switch-mode__text {
  font-size: 26rpx;
  color: $c-primary;
}

/* 手写输入 */
.manual-input {
  height: 96rpx;
  padding: 0 28rpx;
  border: 1px solid $c-line;
  border-radius: 16rpx;
  background-color: $c-card;
  font-size: 30rpx;
  color: $c-text;
}

/* 分区 */
.section-label--gap {
  display: block;
  margin: 28rpx 0 16rpx;
}

.chip-row {
  display: flex;
  flex-wrap: wrap;
}

.chip-row__item {
  margin: 0 16rpx 16rpx 0;
}

/* 成员 chip */
.person-chip {
  display: flex;
  align-items: center;
  margin: 0 16rpx 16rpx 0;
  padding: 6rpx 18rpx 6rpx 8rpx;
  border: 1px solid $c-line;
  border-radius: 999rpx;
  background-color: $c-card;

  &:active {
    opacity: 0.88;
  }
}

.person-chip--on {
  border-color: $c-primary;
  background-color: $c-primary-soft;
}

.person-chip__name {
  margin-left: 10rpx;
  font-size: 24rpx;
  color: $c-text-muted;
}

.person-chip--on .person-chip__name {
  color: $c-primary;
}

/* 发送按钮 */
.sheet__footer {
  flex-shrink: 0;
  padding-top: 16rpx;
}

.submit {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 96rpx;
  margin: 0;
  padding: 0;
  border: none;
  border-radius: 999rpx;
  background-color: $c-primary;
  color: #ffffff;
  font-size: 32rpx;
  font-weight: 500;
  line-height: 1;

  &::after {
    border: none;
  }

  &:active {
    opacity: 0.88;
  }
}

.submit--off {
  background-color: #e7e1da;
  color: rgba(255, 255, 255, 0.7);
}
</style>
