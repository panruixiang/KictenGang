<script setup lang="ts">
import { computed, ref } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import Chip from '@/components/Chip.vue';
import { getRecipeById, getRecipeIngredients } from '@/mock/recipes';
import type { Recipe } from '@/types';
import { scaleAmount, SERVING_OPTIONS } from '@/utils/servings';

/** 配料分组展示顺序 */
const GROUPS = ['主料', '辅料', '调味料'] as const;

const recipe = ref<Recipe | null>(null);
/** 目标人数（进入时默认 = 菜谱份量） */
const targetServings = ref(2);
/** 当前选中版本（仅自家菜有） */
const activeVersionId = ref('');

onLoad((query) => {
  const found = getRecipeById(String(query?.id ?? ''));
  recipe.value = found ?? null;
  if (!found) return;
  targetServings.value = found.servings ?? 2;
  activeVersionId.value = found.versions?.[0]?.id ?? '';
});

/** 当前版本下的配料 */
const ingredients = computed(() => (recipe.value ? getRecipeIngredients(recipe.value, activeVersionId.value) : []));

/** 按 主料 / 辅料 / 调味料 分组，并带上换算后的用量 */
const groupedIngredients = computed(() =>
  GROUPS.map((group) => ({
    group,
    items: ingredients.value
      .filter((i) => i.group === group)
      .map((i) => ({
        name: i.name,
        ...scaleAmount(i.amount, i.unit, recipe.value?.servings ?? null, targetServings.value),
      })),
  })).filter((g) => g.items.length > 0),
);

function goBack() {
  if (getCurrentPages().length > 1) {
    uni.navigateBack();
  } else {
    uni.switchTab({ url: '/pages/recipe-library/index' });
  }
}

function goEdit() {
  uni.navigateTo({ url: `/pages/recipe-form/index?id=${recipe.value?.id ?? ''}` });
}

function startCooking() {
  const r = recipe.value;
  if (!r) return;
  const version = activeVersionId.value ? `&version=${activeVersionId.value}` : '';
  uni.navigateTo({
    url: `/pages/cooking-guide/index?id=${r.id}&servings=${targetServings.value}${version}`,
  });
}
</script>

<template>
  <view v-if="recipe" class="page page--footer">
    <!-- 大封面 + 左上角返回 -->
    <view class="cover">
      <image class="cover__img" :src="recipe.cover" mode="aspectFill" />
      <view class="cover__back" @tap="goBack">
        <view class="cover__arrow" />
      </view>
    </view>

    <view class="body">
      <!-- 菜名 / 来源 / 编辑入口 -->
      <view class="title-row">
        <view class="title-row__main">
          <text class="title">{{ recipe.name }}</text>
          <text v-if="recipe.source" class="source">{{ recipe.source }}</text>
        </view>
        <view v-if="!recipe.isBuiltin" class="edit" @tap="goEdit">
          <text>编辑</text>
        </view>
      </view>

      <!-- 菜系 / 耗时 / 难度 -->
      <view class="meta">
        <text class="meta__cuisine">{{ recipe.cuisine }}</text>
        <text class="meta__item">{{ recipe.durationMin }} 分钟</text>
        <text class="meta__dot">·</text>
        <text class="meta__item">{{ recipe.difficulty }}</text>
      </view>

      <!-- 版本切换（仅自家菜） -->
      <view v-if="recipe.versions?.length" class="section">
        <text class="section-label">版本</text>
        <view class="versions">
          <Chip
            v-for="v in recipe.versions"
            :key="v.id"
            class="versions__item"
            size="sm"
            :label="v.name"
            :selected="v.id === activeVersionId"
            @tap="activeVersionId = v.id"
          />
        </view>
      </view>

      <!-- 份量换算 -->
      <view class="section">
        <text class="section-label">份量</text>
        <view class="servings">
          <Chip
            v-for="n in SERVING_OPTIONS"
            :key="n"
            class="servings__item"
            size="sm"
            :label="`${n} 人份`"
            :selected="n === targetServings"
            @tap="targetServings = n"
          />
        </view>
        <text v-if="!recipe.servings" class="hint">未填份量时不做换算</text>
      </view>

      <!-- 配料：主料 / 辅料 / 调味料 三组 -->
      <view v-for="g in groupedIngredients" :key="g.group" class="section">
        <text class="section-label">{{ g.group }}</text>
        <view class="card">
          <view v-for="item in g.items" :key="item.name" class="ing">
            <text class="ing__name">{{ item.name }}</text>
            <view class="ing__amount">
              <text class="ing__value" :class="{ 'ing__value--special': item.isSpecial }">{{ item.text }}</text>
              <text v-if="item.isSpecial" class="ing__note">不换算</text>
            </view>
          </view>
        </view>
      </view>

      <!-- 步骤预览（只读） -->
      <view class="section">
        <text class="section-label">步骤</text>
        <view class="card">
          <view v-for="(step, index) in recipe.steps" :key="index" class="step">
            <text class="step__no">{{ index + 1 }}</text>
            <text class="step__text">{{ step.text }}</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 底部固定主按钮 -->
    <view class="footer">
      <button class="btn-primary" @tap="startCooking">开始做菜</button>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.cover {
  position: relative;
  width: 100%;
  height: 520rpx;
}

.cover__img {
  width: 100%;
  height: 100%;
}

.cover__back {
  position: absolute;
  top: 24rpx;
  left: 24rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 72rpx;
  height: 72rpx;
  border-radius: 50%;
  background-color: rgba(31, 27, 22, 0.36);
}

.cover__arrow {
  width: 20rpx;
  height: 20rpx;
  margin-left: -4rpx;
  border-left: 4rpx solid #ffffff;
  border-bottom: 4rpx solid #ffffff;
  transform: rotate(45deg);
}

/* 内容区上浮压住封面下沿 */
.body {
  position: relative;
  margin-top: -40rpx;
  padding: 36rpx 32rpx 0;
  border-radius: 32rpx 32rpx 0 0;
  background-color: $c-bg;
}

.title-row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
}

.title-row__main {
  flex: 1;
}

.title {
  font-size: 44rpx;
  font-weight: 600;
  line-height: 1.3;
  color: $c-text;
}

.source {
  display: block;
  margin-top: 8rpx;
  font-size: 22rpx;
  color: $c-text-muted;
}

.edit {
  flex-shrink: 0;
  margin-left: 24rpx;
  padding: 8rpx 28rpx;
  border: 1px solid $c-primary;
  border-radius: 999rpx;
  color: $c-primary;
  font-size: 24rpx;
}

.meta {
  display: flex;
  align-items: center;
  margin-top: 20rpx;
}

.meta__cuisine {
  margin-right: 20rpx;
  padding: 6rpx 20rpx;
  border-radius: 10rpx;
  background-color: $c-primary-soft;
  color: $c-primary;
  font-size: 24rpx;
}

.meta__item {
  font-size: 26rpx;
  color: $c-text-muted;
}

.meta__dot {
  margin: 0 12rpx;
  color: #c9c0b5;
}

.section {
  margin-top: 44rpx;
}

.versions,
.servings {
  display: flex;
  flex-wrap: wrap;
  margin-top: 20rpx;
}

.versions__item,
.servings__item {
  margin: 0 16rpx 12rpx 0;
}

.hint {
  display: block;
  margin-top: 4rpx;
  font-size: 22rpx;
  color: $c-text-muted;
}

/* 配料 / 步骤 卡片 */
.card {
  margin-top: 20rpx;
  padding: 0 28rpx;
  border-radius: 24rpx;
  background-color: $c-card;
  box-shadow: 0 4rpx 20rpx rgba(31, 27, 22, 0.04);
}

.ing,
.step {
  display: flex;
  align-items: center;
  padding: 24rpx 0;
  border-bottom: 1px solid $c-line;

  &:last-child {
    border-bottom: none;
  }
}

.ing__name {
  flex: 1;
  font-size: 28rpx;
  color: $c-text;
}

.ing__amount {
  display: flex;
  align-items: center;
}

.ing__value {
  font-size: 28rpx;
  font-weight: 500;
  color: $c-text;
}

.ing__value--special {
  font-weight: 400;
  color: $c-text-muted;
}

/* "不换算"标注 */
.ing__note {
  margin-left: 12rpx;
  padding: 2rpx 12rpx;
  border-radius: 6rpx;
  background-color: #f3ede6;
  color: $c-text-muted;
  font-size: 20rpx;
}

.step {
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
</style>