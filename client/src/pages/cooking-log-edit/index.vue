<script setup lang="ts">
import { computed, ref } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import Chip from '@/components/Chip.vue';
import NavBar from '@/components/NavBar.vue';
import { getRecipeIngredients } from '@/mock/recipes';
import { addLog, getLogById, getRecipeById } from '@/store';
import type { CookingLog, IngredientGroup, Recipe } from '@/types';
import { formatLogDate, todayISO } from '@/utils/date';
import { formatAmount } from '@/utils/servings';

/**
 * 记一笔（做菜记录编辑）· 工单 05
 * - 编辑态：从"做菜引导"进入，带菜谱 / 人数 / 版本；可就地改"本次配方"、保存进记录
 * - 只读态：带 recordId 进入（记录列表点开的完整浏览），复用同一套排版
 */

/** 本次配方的一行（编辑态内部结构） */
interface LogRow {
  name: string;
  group: IngredientGroup;
  unit: string | null;
  /** 当前用量数字；null = 适量 */
  amount: number | null;
  /** 菜谱原始用量（按人数换算后），用于判断"这次改过" */
  original: number | null;
  changed: boolean;
}

const readonly = ref(false);
/** 只读态：浏览的记录 */
const record = ref<CookingLog | null>(null);

/* ===== 编辑态字段 ===== */
const recipe = ref<Recipe | null>(null);
const date = ref(todayISO());
/** 当前选中的版本 id；'' = 未关联版本 */
const activeVersionId = ref('');
const note = ref('这次花生米多放了一小把，更香');
const targetServings = ref(2);
const rows = ref<LogRow[]>([]);
/** 正在就地编辑的下标（-1 = 无） */
const editingIndex = ref(-1);
const editValue = ref('');

/** 版本选项：自家菜用其版本；内置菜给一个"默认版"占位（q10 记录里显示的版本 chip） */
const versionOptions = computed(() => {
  const r = recipe.value;
  if (!r) return [] as { id: string; name: string }[];
  if (r.versions?.length) return r.versions.map((v) => ({ id: v.id, name: v.name }));
  return [{ id: 'default', name: '默认版' }];
});

/** 当前版本名（保存进记录 / 只读展示共用） */
const versionName = computed(() => versionOptions.value.find((v) => v.id === activeVersionId.value)?.name ?? '');

onLoad((query) => {
  const recordId = String(query?.recordId ?? '');
  if (recordId) {
    readonly.value = true;
    record.value = getLogById(recordId) ?? null;
    return;
  }

  const found = getRecipeById(String(query?.id ?? ''));
  recipe.value = found ?? null;
  const servings = Number(query?.servings);
  targetServings.value = Number.isFinite(servings) && servings > 0 ? servings : (found?.servings ?? 2);

  // 版本：跟随"做菜引导"里选的那版；没带则默认选第一项（默认版）
  const options = versionOptions.value;
  const version = String(query?.version ?? '');
  activeVersionId.value = options.some((v) => v.id === version) ? version : (options[0]?.id ?? '');
  rebuildRows();
});

/**
 * 生成"本次配方"副本：按本次人数换算后的用量
 * 原型示范：花生米这行预置成"这次改过"的样子（实际做时多抓了一小把）
 */
function rebuildRows() {
  const r = recipe.value;
  if (!r) {
    rows.value = [];
    return;
  }
  const ratio = r.servings ? targetServings.value / r.servings : 1;
  const list: LogRow[] = getRecipeIngredients(r, activeVersionId.value || undefined).map((ing) => {
    if (ing.amount === null || !ing.unit) {
      return { name: ing.name, group: ing.group, unit: ing.unit, amount: null, original: null, changed: false };
    }
    const scaled = Math.round(ing.amount * ratio * 10) / 10;
    return { name: ing.name, group: ing.group, unit: ing.unit, amount: scaled, original: scaled, changed: false };
  });
  const demo = list.find((row) => row.name === '花生米' && row.amount !== null);
  if (demo && demo.amount !== null) {
    demo.amount = Math.round(demo.amount * 1.2);
    demo.changed = true;
  }
  rows.value = list;
}

/* ===== 编辑操作 ===== */

function onDateChange(e: { detail: { value: string } }) {
  date.value = e.detail.value;
}

/** 清除关联菜谱 → 进入"随手记"态 */
function clearRecipe() {
  recipe.value = null;
  activeVersionId.value = '';
  rows.value = [];
}

/** 点版本 chip：选中的再点一次即清除（版本可选可清除） */
function pickVersion(id: string) {
  activeVersionId.value = activeVersionId.value === id ? '' : id;
  rebuildRows();
}

/** 用量展示文本 */
function amountText(row: LogRow): string {
  if (row.amount === null) return '适量';
  return `${formatAmount(row.amount)}${row.unit ?? ''}`;
}

/** 点用量 → 就地编辑数字（"适量"行不参与） */
function startEdit(index: number) {
  const row = rows.value[index];
  if (!row || row.amount === null) return;
  editingIndex.value = index;
  editValue.value = formatAmount(row.amount);
}

/** 提交就地编辑：数字变了就标记"这次改过" */
function commitEdit() {
  const index = editingIndex.value;
  if (index < 0) return;
  const row = rows.value[index];
  const value = Number(editValue.value);
  if (row && Number.isFinite(value) && value > 0) {
    row.amount = Math.round(value * 10) / 10;
    row.changed = row.original !== null && Math.abs(row.amount - row.original) > 1e-9;
  }
  editingIndex.value = -1;
}

/** 保存 → 写入记录 store → 进记录列表 */
function save() {
  const log: CookingLog = {
    id: `log-${Date.now()}`,
    date: date.value,
    recipeId: recipe.value?.id,
    recipeName: recipe.value?.name,
    versionName: versionName.value || undefined,
    note: note.value.trim(),
    servings: recipe.value ? targetServings.value : undefined,
    ingredients: recipe.value
      ? rows.value.map((row) => ({
          name: row.name,
          amount: row.amount,
          unit: row.amount === null ? null : row.unit,
          group: row.group,
          changed: row.changed,
        }))
      : undefined,
  };
  addLog(log);
  uni.switchTab({ url: '/pages/cooking-log-list/index' });
}

/** 只读态：用量展示文本 */
function recordAmountText(row: { amount: number | null; unit: string | null }): string {
  if (row.amount === null) return '适量';
  return `${formatAmount(row.amount)}${row.unit ?? ''}`;
}
</script>

<template>
  <view class="page" :class="{ 'page--footer': !readonly }">
    <NavBar :title="readonly ? '记录详情' : '记一笔'" />

    <!-- 只读浏览（记录列表点开） -->
    <view v-if="readonly" class="body">
      <view v-if="record">
        <view class="card">
          <view class="row">
            <text class="row__label">日期</text>
            <text class="row__plain">{{ formatLogDate(record.date) }}</text>
          </view>
          <view class="row">
            <text class="row__label">菜谱</text>
            <text class="row__plain" :class="{ 'row__plain--muted': !record.recipeName }">
              {{ record.recipeName ?? '随手记（未关联菜谱）' }}
            </text>
          </view>
        </view>

        <view v-if="record.versionName" class="section">
          <text class="section-label">版本</text>
          <view class="chips">
            <view class="ver-static">{{ record.versionName }}</view>
          </view>
        </view>

        <view class="section">
          <text class="section-label">备注</text>
          <view class="card card--pad">
            <text class="note-static">{{ record.note || '（这次没有写备注）' }}</text>
          </view>
        </view>

        <view v-if="record.ingredients?.length" class="section">
          <text class="section-label">本次配方</text>
          <view class="card">
            <view v-for="(row, index) in record.ingredients" :key="index" class="ing">
              <text class="ing__name">{{ row.name }}</text>
              <view class="ing__right">
                <text class="ing__amount" :class="{ 'ing__amount--special': row.amount === null }">
                  {{ recordAmountText(row) }}
                </text>
                <text v-if="row.changed" class="ing__changed">这次改过</text>
              </view>
            </view>
          </view>
        </view>
      </view>

      <view v-else class="placeholder">没有找到这条记录</view>
    </view>

    <!-- 编辑态 -->
    <view v-else class="body">
      <view class="card">
        <view class="row">
          <text class="row__label">日期</text>
          <picker class="row__ctl" mode="date" :value="date" :end="todayISO()" @change="onDateChange">
            <view class="row__value">
              <text class="row__text">{{ formatLogDate(date) }}</text>
              <image class="row__arrow" src="/static/icons/chevron-down.png" mode="aspectFit" />
            </view>
          </picker>
        </view>
        <view class="row">
          <text class="row__label">菜谱</text>
          <view class="row__ctl">
            <view class="row__value">
              <text class="row__text" :class="{ 'row__text--muted': !recipe }">
                {{ recipe ? recipe.name : '随手记（未关联菜谱）' }}
              </text>
              <view v-if="recipe" class="row__clear" @tap="clearRecipe">
                <image class="row__clear-icon" src="/static/icons/close.png" mode="aspectFit" />
              </view>
            </view>
          </view>
        </view>
      </view>

      <view v-if="recipe" class="section">
        <text class="section-label">版本</text>
        <view class="chips">
          <Chip
            v-for="v in versionOptions"
            :key="v.id"
            class="chips__item"
            size="sm"
            :label="v.name"
            :selected="v.id === activeVersionId"
            @tap="pickVersion(v.id)"
          />
        </view>
        <text class="section-hint">版本可选，再点一下可清除</text>
      </view>

      <view class="section">
        <text class="section-label">备注</text>
        <textarea
          v-model="note"
          class="note"
          :maxlength="200"
          placeholder="写一句这次的感受或调整"
          placeholder-class="input-ph"
        />
      </view>

      <view v-if="recipe" class="section">
        <text class="section-label">本次配方</text>
        <text class="section-hint">用量点了可以直接改；改过的行会标记"这次改过"</text>
        <view class="card">
          <view v-for="(row, index) in rows" :key="index" class="ing">
            <text class="ing__name">{{ row.name }}</text>
            <view class="ing__right">
              <view v-if="editingIndex === index" class="ing__editing">
                <input
                  v-model="editValue"
                  class="ing__input"
                  type="digit"
                  :focus="true"
                  @blur="commitEdit"
                  @confirm="commitEdit"
                />
                <text class="ing__unit">{{ row.unit }}</text>
              </view>
              <template v-else>
                <text
                  class="ing__amount"
                  :class="{ 'ing__amount--special': row.amount === null, 'ing__amount--tap': row.amount !== null }"
                  @tap="startEdit(index)"
                >
                  {{ amountText(row) }}
                </text>
                <text v-if="row.changed" class="ing__changed">这次改过</text>
              </template>
            </view>
          </view>
        </view>
      </view>
    </view>

    <view v-if="!readonly" class="footer">
      <button class="btn-primary" @tap="save">保存</button>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.body {
  padding: 8rpx 32rpx 0;
}

/* 日期 / 菜谱 行卡片 */
.card {
  padding: 0 28rpx;
  border-radius: 24rpx;
  background-color: $c-card;
  box-shadow: 0 4rpx 20rpx rgba(31, 27, 22, 0.04);
}

.card--pad {
  padding: 28rpx;
}

.row {
  display: flex;
  align-items: center;
  padding: 28rpx 0;
  border-bottom: 1px solid $c-line;

  &:last-child {
    border-bottom: none;
  }
}

.row__label {
  flex-shrink: 0;
  width: 110rpx;
  font-size: 28rpx;
  color: $c-text-muted;
}

.row__ctl {
  flex: 1;
}

.row__value {
  display: flex;
  align-items: center;
  justify-content: flex-end;
}

.row__text {
  font-size: 28rpx;
  color: $c-text;
}

.row__text--muted {
  color: $c-text-muted;
}

/* 日期选择的下拉指示（Lucide chevron-down） */
.row__arrow {
  width: 26rpx;
  height: 26rpx;
  margin-left: 12rpx;
}

/* 清除关联菜谱（Lucide x） */
.row__clear {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 52rpx;
  height: 52rpx;
  margin: -12rpx -12rpx -12rpx 8rpx;
}

.row__clear-icon {
  width: 32rpx;
  height: 32rpx;
}

.row__plain {
  flex: 1;
  text-align: right;
  font-size: 28rpx;
  color: $c-text;
}

.row__plain--muted {
  color: $c-text-muted;
}

.section {
  margin-top: 40rpx;
}

.section-hint {
  display: block;
  margin-top: 10rpx;
  font-size: 22rpx;
  color: $c-text-muted;
}

.chips {
  display: flex;
  flex-wrap: wrap;
  margin-top: 20rpx;
}

.chips__item {
  margin: 0 16rpx 12rpx 0;
}

/* 只读态版本 chip（不可点，仅展示） */
.ver-static {
  padding: 8rpx 22rpx;
  border-radius: 999rpx;
  background-color: $c-primary-soft;
  color: $c-primary;
  font-size: 24rpx;
}

/* 备注输入 */
.note {
  box-sizing: border-box;
  width: 100%;
  height: 180rpx;
  margin-top: 20rpx;
  padding: 24rpx 28rpx;
  border-radius: 24rpx;
  background-color: $c-card;
  box-shadow: 0 4rpx 20rpx rgba(31, 27, 22, 0.04);
  font-size: 28rpx;
  line-height: 1.6;
  color: $c-text;
}

.note-static {
  font-size: 28rpx;
  line-height: 1.6;
  color: $c-text;
}

/* 本次配方行（卡片左右已有内边距） */
.ing {
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

.ing__right {
  display: flex;
  align-items: center;
}

.ing__amount {
  font-size: 28rpx;
  font-weight: 500;
  color: $c-text;
}

.ing__amount--special {
  font-weight: 400;
  color: $c-text-muted;
}

/* 可点编辑的用量：加虚线下划线提示 */
.ing__amount--tap {
  border-bottom: 2rpx dashed rgba(232, 89, 12, 0.45);
}

.ing__changed {
  margin-left: 12rpx;
  padding: 2rpx 12rpx;
  border-radius: 6rpx;
  background-color: $c-primary-soft;
  color: $c-primary;
  font-size: 20rpx;
}

/* 就地编辑的输入框 */
.ing__editing {
  display: flex;
  align-items: center;
}

.ing__input {
  width: 140rpx;
  height: 56rpx;
  padding: 0 16rpx;
  border: 1px solid $c-primary;
  border-radius: 12rpx;
  background-color: #ffffff;
  font-size: 28rpx;
  text-align: right;
  color: $c-text;
}

.ing__unit {
  margin-left: 10rpx;
  font-size: 28rpx;
  color: $c-text;
}
</style>