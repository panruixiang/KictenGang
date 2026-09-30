<script setup lang="ts">
import { computed, ref } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import Chip from '@/components/Chip.vue';
import NavBar from '@/components/NavBar.vue';
import { addIngredientToDict, getRecipeById, store } from '@/store';
import type { IngredientDictItem, IngredientGroup, RecipeIngredient, RecipeStep } from '@/types';
import { formatAmount } from '@/utils/servings';

/**
 * 菜谱录入 / 编辑表单 · 工单 10（基本信息）+ 工单 11（配料与步骤编辑器）
 * - 新建：从首页"＋"进入，预填一组示例内容（红烧排骨）
 * - 编辑：从自家菜详情"编辑"进入（id 带参），回填这道菜的全部内容
 * - 保存写入内存 store（不做持久化）；"适量"行的数字与单位禁用置灰
 */

/** 配料行（编辑态内部结构） */
interface FormIngredientRow {
  name: string;
  group: IngredientGroup;
  /** 用量数字（保持字符串便于空值判断） */
  amountText: string;
  unit: string;
  /** 适量开关：开启后数字与单位禁用置灰，保存时用量置空 */
  special: boolean;
}

/** 步骤行（编辑态内部结构） */
interface FormStepRow {
  text: string;
  /** 计时分钟（留空 = 本步不计时） */
  timerMinText: string;
}

const GROUPS: IngredientGroup[] = ['主料', '辅料', '调味料'];
const CUISINES = ['川', '粤', '浙', '家常', '其它'];
const DIFFICULTIES = ['简单', '中等', '较难'];
/** 单位表（Q29，与 00-总览约定一致） */
const UNITS = ['g', 'ml', '个', '勺', '碗', '斤', '两', '根', '棵', '片', '块', '把'];
/** 封面示例池："换一张"在既有封面里轮换（静态阶段不做真实上传，仅示意） */
const COVER_POOL = [
  '/static/cover/hongshao-rou.jpg',
  '/static/cover/gongbao-jiding.jpg',
  '/static/cover/mapo-doufu.jpg',
  '/static/cover/qingjiao-tudousi.jpg',
];

/* ===== 基本信息 ===== */
const editId = ref('');
const name = ref('');
const cuisine = ref('');
const durationText = ref('');
const difficulty = ref('');
const servingsText = ref('2');
const cover = ref(COVER_POOL[0]);

/* ===== 配料 / 步骤 ===== */
const ingredientRows = ref<FormIngredientRow[]>([]);
const stepRows = ref<FormStepRow[]>([]);

/* ===== 食材选择器 ===== */
const pickerOpen = ref(false);
const pickerIndex = ref(-1);
const pickerKeyword = ref('');
const pickerCreating = ref(false);
const newIngredientName = ref('');
const newIngredientGroup = ref<IngredientGroup>('主料');

const pageTitle = computed(() => (editId.value ? '编辑菜谱' : '新建菜谱'));

/** 选择器列表（按关键词过滤字典） */
const pickerList = computed(() => {
  const keyword = pickerKeyword.value.trim();
  return store.ingredientDict.filter((i) => i.name.includes(keyword));
});

onLoad((query) => {
  const id = String(query?.id ?? '');
  const recipe = id ? getRecipeById(id) : undefined;
  if (recipe) {
    // 编辑态：回填现有内容（表单编辑的是这道菜的基础配方）
    editId.value = id;
    name.value = recipe.name;
    cuisine.value = recipe.cuisine;
    durationText.value = String(recipe.durationMin);
    difficulty.value = recipe.difficulty;
    servingsText.value = recipe.servings === null ? '' : String(recipe.servings);
    cover.value = recipe.cover;
    ingredientRows.value = recipe.ingredients.map((i) => ({
      name: i.name,
      group: i.group,
      amountText: i.amount === null ? '' : formatAmount(i.amount),
      unit: i.unit ?? 'g',
      special: i.amount === null || !i.unit,
    }));
    stepRows.value = recipe.steps.map((s) => ({
      text: s.text,
      timerMinText: s.timerSec ? formatAmount(s.timerSec / 60) : '',
    }));
    return;
  }
  // 新建态：示例内容（红烧排骨）
  name.value = '红烧排骨';
  servingsText.value = '2';
  cover.value = COVER_POOL[0];
  ingredientRows.value = [
    { name: '鸡腿肉', group: '主料', amountText: '300', unit: 'g', special: false },
    { name: '花生米', group: '主料', amountText: '50', unit: 'g', special: false },
    { name: '盐', group: '调味料', amountText: '', unit: 'g', special: true },
  ];
  stepRows.value = [
    { text: '排骨冷水下锅，加料酒焯水 3 分钟，撇去浮沫捞出。', timerMinText: '3' },
    { text: '热锅少油，下冰糖小火炒出糖色，倒入排骨翻炒上色。', timerMinText: '' },
    { text: '加葱姜、生抽、老抽和开水，小火炖 40 分钟，大火收汁即可。', timerMinText: '40' },
  ];
});

/* ===== 基本信息操作 ===== */

/** 封面"换一张"：在示例封面池里轮换示意 */
function changeCover() {
  const idx = COVER_POOL.indexOf(cover.value);
  cover.value = COVER_POOL[(idx + 1) % COVER_POOL.length];
}

/** 菜系 / 难度单选：选中的再点一次即取消（都不必填） */
function pickCuisine(c: string) {
  cuisine.value = cuisine.value === c ? '' : c;
}

function pickDifficulty(d: string) {
  difficulty.value = difficulty.value === d ? '' : d;
}

/* ===== 配料行操作 ===== */

function addIngredient() {
  ingredientRows.value.push({ name: '', group: '主料', amountText: '', unit: 'g', special: false });
}

function removeIngredient(index: number) {
  ingredientRows.value.splice(index, 1);
}

/** 上下移动配料行 */
function moveIngredient(index: number, delta: number) {
  const target = index + delta;
  const list = ingredientRows.value;
  if (target < 0 || target >= list.length) return;
  const [row] = list.splice(index, 1);
  list.splice(target, 0, row);
}

/** 适量开关：开启后数字与单位禁用置灰 */
function toggleSpecial(index: number) {
  const row = ingredientRows.value[index];
  if (row) row.special = !row.special;
}

/** 单位下拉当前下标 */
function unitIndex(unit: string): number {
  return Math.max(0, UNITS.indexOf(unit));
}

function onUnitChange(index: number, e: { detail: { value: string } }) {
  const row = ingredientRows.value[index];
  const unit = UNITS[Number(e.detail.value)];
  if (row && unit) row.unit = unit;
}

/* ===== 食材选择器操作 ===== */

function openPicker(index: number) {
  pickerIndex.value = index;
  pickerKeyword.value = '';
  pickerCreating.value = false;
  newIngredientName.value = '';
  newIngredientGroup.value = '主料';
  pickerOpen.value = true;
}

/** 选中某食材：行上的分类标记跟随字典分类 */
function selectIngredient(item: IngredientDictItem) {
  const row = ingredientRows.value[pickerIndex.value];
  if (row) {
    row.name = item.name;
    row.group = item.group;
  }
  pickerOpen.value = false;
}

/** 新建食材：加入字典并直接选中（字典各页共用） */
function confirmCreate() {
  const newName = newIngredientName.value.trim();
  if (!newName) return;
  addIngredientToDict(newName, newIngredientGroup.value);
  selectIngredient({ name: newName, group: newIngredientGroup.value });
}

/* ===== 步骤行操作 ===== */

function addStep() {
  stepRows.value.push({ text: '', timerMinText: '' });
}

function removeStep(index: number) {
  stepRows.value.splice(index, 1);
}

/** 上下移动步骤行 */
function moveStep(index: number, delta: number) {
  const target = index + delta;
  const list = stepRows.value;
  if (target < 0 || target >= list.length) return;
  const [row] = list.splice(index, 1);
  list.splice(target, 0, row);
}

/* ===== 底部操作 ===== */

/** 关闭 / 取消：返回上一页（直接刷新进入时兜底回菜谱库） */
function closeForm() {
  if (getCurrentPages().length > 1) {
    uni.navigateBack();
  } else {
    uni.switchTab({ url: '/pages/recipe-library/index' });
  }
}

/** 防连点：保存动作只执行一次 */
let saving = false;

/** 保存：写入内存 store（静态阶段不做持久化），返回上一页 */
function save() {
  if (saving) return;
  const trimmedName = name.value.trim();
  if (!trimmedName) {
    uni.showToast({ title: '给这道菜起个名字吧', icon: 'none' });
    return;
  }
  saving = true;

  // 配料行 → 配方（"适量"行 amount / unit 置空）
  const ingredients: RecipeIngredient[] = ingredientRows.value
    .filter((row) => row.name)
    .map((row) => {
      const parsed = Number(row.amountText);
      const amount = row.special || row.amountText === '' || !Number.isFinite(parsed) || parsed <= 0
        ? null
        : Math.round(parsed * 10) / 10;
      return {
        name: row.name,
        amount,
        unit: amount === null ? null : row.unit,
        group: row.group,
      };
    });

  // 步骤行 → 步骤（计时分钟可选，留空即不计时）
  const steps: RecipeStep[] = stepRows.value
    .filter((row) => row.text.trim())
    .map((row) => {
      const min = Number(row.timerMinText);
      const sec = row.timerMinText !== '' && Number.isFinite(min) && min > 0 ? Math.round(min * 60) : 0;
      return sec > 0 ? { text: row.text.trim(), timerSec: sec } : { text: row.text.trim() };
    });

  const duration = Number(durationText.value);
  const servings = Number(servingsText.value);
  const base = {
    name: trimmedName,
    cuisine: cuisine.value || '其它',
    // 耗时 / 难度为选填，静态阶段给兜底值保证卡片展示完整
    durationMin: Number.isFinite(duration) && duration > 0 ? Math.round(duration) : 30,
    difficulty: difficulty.value || '简单',
    // 份量清空 = 未填（null），不做换算（Q27）
    servings: servingsText.value !== '' && Number.isFinite(servings) && servings > 0 ? Math.round(servings) : null,
    cover: cover.value,
    ingredients,
    steps,
  };

  if (editId.value) {
    const target = getRecipeById(editId.value);
    if (target) {
      Object.assign(target, base);
      // 表单编辑的是基础配方：有版本时，把"默认版"（第一版）同步成新配方
      if (target.versions?.length) {
        target.versions[0].ingredients = ingredients;
      }
    }
  } else {
    store.recipes.unshift({ id: `own-${Date.now()}`, isBuiltin: false, ...base });
  }
  closeForm();
}
</script>

<template>
  <view class="page page--footer">
    <NavBar :title="pageTitle" close @close="closeForm" />

    <view class="body">
      <!-- 封面图 + 换一张 -->
      <view class="cover">
        <image class="cover__img" :src="cover" mode="aspectFill" />
        <view class="cover__change" @tap="changeCover">换一张</view>
      </view>

      <!-- 基本信息：名称 / 耗时 / 份量 -->
      <view class="card">
        <view class="row">
          <text class="row__label">名称</text>
          <input v-model="name" class="row__input" type="text" placeholder="菜谱名称" placeholder-class="input-ph" />
        </view>
        <view class="row">
          <text class="row__label">耗时</text>
          <view class="row__right">
            <input
              v-model="durationText"
              class="row__input"
              type="number"
              placeholder="如 30"
              placeholder-class="input-ph"
            />
            <text class="row__suffix">分钟</text>
          </view>
        </view>
        <view class="row">
          <text class="row__label">份量</text>
          <view class="row__right">
            <input
              v-model="servingsText"
              class="row__input"
              type="number"
              placeholder="如 2"
              placeholder-class="input-ph"
            />
            <text class="row__suffix">人份</text>
          </view>
        </view>
      </view>
      <text v-if="!servingsText" class="serve-hint">未填份量时不做换算</text>

      <!-- 菜系 / 难度：单选 chips -->
      <view class="section">
        <text class="section-label">菜系</text>
        <view class="chips">
          <Chip
            v-for="c in CUISINES"
            :key="c"
            class="chips__item"
            :label="c"
            :selected="cuisine === c"
            @tap="pickCuisine(c)"
          />
        </view>
      </view>

      <view class="section">
        <text class="section-label">难度</text>
        <view class="chips">
          <Chip
            v-for="d in DIFFICULTIES"
            :key="d"
            class="chips__item"
            :label="d"
            :selected="difficulty === d"
            @tap="pickDifficulty(d)"
          />
        </view>
      </view>

      <!-- 配料行编辑器 -->
      <view class="section">
        <text class="section-label">配料</text>
        <text class="section-hint">点食材名可换食材；用量支持"数字 + 单位"或"适量"</text>
        <view v-for="(row, index) in ingredientRows" :key="index" class="edit-row">
          <view class="edit-row__head">
            <view class="edit-row__name" @tap="openPicker(index)">
              <text class="edit-row__name-text" :class="{ 'edit-row__name-text--empty': !row.name }">
                {{ row.name || '选择食材' }}
              </text>
              <image class="edit-row__name-arrow" src="/static/icons/chevron-down.png" mode="aspectFit" />
            </view>
            <text class="edit-row__tag">{{ row.group }}</text>
            <view class="edit-row__ops">
              <view
                class="op"
                :class="{ 'op--disabled': index === 0 }"
                @tap="moveIngredient(index, -1)"
              >
                <image class="op__icon" src="/static/icons/arrow-up.png" mode="aspectFit" />
              </view>
              <view
                class="op"
                :class="{ 'op--disabled': index === ingredientRows.length - 1 }"
                @tap="moveIngredient(index, 1)"
              >
                <image class="op__icon" src="/static/icons/arrow-down.png" mode="aspectFit" />
              </view>
              <view class="op" @tap="removeIngredient(index)">
                <image class="op__icon" src="/static/icons/trash.png" mode="aspectFit" />
              </view>
            </view>
          </view>
          <view class="edit-row__body">
            <input
              v-model="row.amountText"
              class="edit-row__amount"
              :class="{ 'edit-row__amount--disabled': row.special }"
              type="digit"
              :disabled="row.special"
              placeholder="用量"
              placeholder-class="input-ph"
            />
            <picker
              class="edit-row__unit-ctl"
              mode="selector"
              :range="UNITS"
              :value="unitIndex(row.unit)"
              :disabled="row.special"
              @change="onUnitChange(index, $event)"
            >
              <view class="edit-row__unit" :class="{ 'edit-row__unit--disabled': row.special }">
                <text>{{ row.unit }}</text>
                <image class="edit-row__unit-arrow" src="/static/icons/chevron-down.png" mode="aspectFit" />
              </view>
            </picker>
            <view class="edit-row__special" @tap="toggleSpecial(index)">
              <text class="edit-row__special-label">适量</text>
              <view class="switch" :class="{ 'switch--on': row.special }">
                <view class="switch__dot" />
              </view>
            </view>
          </view>
        </view>
        <view class="add-btn" @tap="addIngredient">＋ 添加配料</view>
      </view>

      <!-- 步骤行编辑器 -->
      <view class="section">
        <text class="section-label">步骤</text>
        <text class="section-hint">计时可留空；填了分钟数的步骤，做菜时会出现计时按钮</text>
        <view v-for="(row, index) in stepRows" :key="index" class="edit-row">
          <view class="edit-row__head">
            <text class="step-no">{{ index + 1 }}</text>
            <view class="edit-row__ops">
              <view class="op" :class="{ 'op--disabled': index === 0 }" @tap="moveStep(index, -1)">
                <image class="op__icon" src="/static/icons/arrow-up.png" mode="aspectFit" />
              </view>
              <view class="op" :class="{ 'op--disabled': index === stepRows.length - 1 }" @tap="moveStep(index, 1)">
                <image class="op__icon" src="/static/icons/arrow-down.png" mode="aspectFit" />
              </view>
              <view class="op" @tap="removeStep(index)">
                <image class="op__icon" src="/static/icons/trash.png" mode="aspectFit" />
              </view>
            </view>
          </view>
          <textarea
            v-model="row.text"
            class="step-text"
            auto-height
            :maxlength="300"
            placeholder="写清这一步怎么做"
            placeholder-class="input-ph"
          />
          <view class="step-timer">
            <text class="step-timer__label">计时</text>
            <input
              v-model="row.timerMinText"
              class="step-timer__input"
              type="number"
              placeholder="留空不计时"
              placeholder-class="input-ph"
            />
            <text class="step-timer__suffix">分钟</text>
          </view>
        </view>
        <view class="add-btn" @tap="addStep">＋ 添加步骤</view>
      </view>
    </view>

    <view class="footer">
      <view class="footer__btns">
        <button class="btn-secondary footer__cancel" @tap="closeForm">取消</button>
        <button class="btn-primary footer__save" @tap="save">保存</button>
      </view>
    </view>

    <!-- 食材选择器（底部弹层） -->
    <view v-if="pickerOpen" class="mask" @tap="pickerOpen = false">
      <view class="sheet" @tap.stop>
        <view class="sheet__head">
          <text class="sheet__title">选择食材</text>
          <text class="sheet__create" @tap="pickerCreating = !pickerCreating">新建食材</text>
        </view>

        <!-- 新建食材：起名 + 选分类 -->
        <view v-if="pickerCreating" class="sheet__new">
          <input
            v-model="newIngredientName"
            class="sheet__new-input"
            type="text"
            placeholder="食材名（如 香菇）"
            placeholder-class="input-ph"
          />
          <view class="sheet__new-groups">
            <Chip
              v-for="g in GROUPS"
              :key="g"
              class="sheet__new-chip"
              size="sm"
              :label="g"
              :selected="newIngredientGroup === g"
              @tap="newIngredientGroup = g"
            />
          </view>
          <view class="sheet__new-btn" @tap="confirmCreate">加入字典并选用</view>
        </view>

        <view class="sheet__search">
          <image class="sheet__search-icon" src="/static/icons/search.png" mode="aspectFit" />
          <input
            v-model="pickerKeyword"
            class="sheet__search-input"
            type="text"
            placeholder="搜索食材"
            placeholder-class="input-ph"
            confirm-type="search"
          />
        </view>

        <scroll-view class="sheet__list" scroll-y>
          <view v-for="item in pickerList" :key="item.name" class="sheet__item" @tap="selectIngredient(item)">
            <text class="sheet__item-name">{{ item.name }}</text>
            <text class="sheet__item-group">{{ item.group }}</text>
          </view>
          <view v-if="pickerList.length === 0" class="sheet__empty">没有找到食材，可以点"新建食材"</view>
        </scroll-view>
      </view>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.body {
  padding: 8rpx 32rpx 0;
}

/* 封面 + 换一张 */
.cover {
  position: relative;
  width: 100%;
  height: 360rpx;
  margin-bottom: 28rpx;
  overflow: hidden;
  border-radius: 24rpx;
}

.cover__img {
  width: 100%;
  height: 100%;
}

.cover__change {
  position: absolute;
  right: 20rpx;
  bottom: 20rpx;
  padding: 10rpx 26rpx;
  border-radius: 999rpx;
  background-color: rgba(31, 27, 22, 0.5);
  color: #ffffff;
  font-size: 24rpx;
}

/* 通用行卡片 */
.card {
  padding: 0 28rpx;
  border-radius: 24rpx;
  background-color: $c-card;
  box-shadow: 0 4rpx 20rpx rgba(31, 27, 22, 0.04);
}

.row {
  display: flex;
  align-items: center;
  padding: 24rpx 0;
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

.row__right {
  display: flex;
  flex: 1;
  align-items: center;
  justify-content: flex-end;
}

.row__input {
  flex: 1;
  height: 56rpx;
  font-size: 28rpx;
  text-align: right;
  color: $c-text;
}

.row__suffix {
  margin-left: 10rpx;
  font-size: 28rpx;
  color: $c-text-muted;
}

/* "未填份量时不做换算"行内提示 */
.serve-hint {
  display: block;
  margin: 12rpx 4rpx 0;
  font-size: 22rpx;
  color: $c-primary;
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

/* 配料 / 步骤行卡片 */
.edit-row {
  margin-top: 20rpx;
  padding: 22rpx 24rpx;
  border-radius: 24rpx;
  background-color: $c-card;
  box-shadow: 0 4rpx 20rpx rgba(31, 27, 22, 0.04);
}

.edit-row__head {
  display: flex;
  align-items: center;
}

.edit-row__name {
  display: flex;
  align-items: center;
  min-width: 0;
}

.edit-row__name-text {
  font-size: 28rpx;
  font-weight: 600;
  color: $c-text;
}

.edit-row__name-text--empty {
  font-weight: 400;
  color: $c-text-muted;
}

.edit-row__name-arrow {
  width: 24rpx;
  height: 24rpx;
  margin-left: 8rpx;
}

.edit-row__tag {
  margin-left: 14rpx;
  padding: 2rpx 14rpx;
  border-radius: 8rpx;
  background-color: $c-primary-soft;
  color: $c-primary;
  font-size: 20rpx;
}

/* 行操作：上移 / 下移 / 删除 */
.edit-row__ops {
  display: flex;
  margin-left: auto;
}

.op {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 56rpx;
  height: 56rpx;
  margin-left: 8rpx;
  border-radius: 12rpx;
}

.op:active {
  background-color: #f5f0ea;
}

.op--disabled {
  opacity: 0.25;
}

.op__icon {
  width: 32rpx;
  height: 32rpx;
}

/* 用量行：数字 + 单位 + 适量开关 */
.edit-row__body {
  display: flex;
  align-items: center;
  margin-top: 20rpx;
}

.edit-row__amount {
  box-sizing: border-box;
  width: 180rpx;
  height: 64rpx;
  padding: 0 20rpx;
  border: 1px solid $c-line;
  border-radius: 14rpx;
  background-color: #fbf9f6;
  font-size: 28rpx;
  color: $c-text;
}

.edit-row__amount--disabled {
  color: #b3a99e;
  background-color: #f3efe9;
}

.edit-row__unit-ctl {
  margin-left: 14rpx;
}

.edit-row__unit {
  display: flex;
  align-items: center;
  height: 64rpx;
  padding: 0 20rpx;
  border: 1px solid $c-line;
  border-radius: 14rpx;
  background-color: #fbf9f6;
  font-size: 28rpx;
  color: $c-text;
}

.edit-row__unit--disabled {
  color: #b3a99e;
  background-color: #f3efe9;
}

.edit-row__unit-arrow {
  width: 24rpx;
  height: 24rpx;
  margin-left: 10rpx;
}

.edit-row__special {
  display: flex;
  align-items: center;
  margin-left: auto;
}

.edit-row__special-label {
  margin-right: 12rpx;
  font-size: 26rpx;
  color: $c-text-muted;
}

/* 适量开关（自绘） */
.switch {
  box-sizing: border-box;
  width: 76rpx;
  height: 44rpx;
  padding: 4rpx;
  border-radius: 999rpx;
  background-color: #e8e1d9;
  transition: background-color 0.15s ease;
}

.switch__dot {
  width: 36rpx;
  height: 36rpx;
  border-radius: 50%;
  background-color: #ffffff;
  box-shadow: 0 2rpx 6rpx rgba(31, 27, 22, 0.15);
  transition: transform 0.15s ease;
}

.switch--on {
  background-color: $c-primary;
}

.switch--on .switch__dot {
  transform: translateX(32rpx);
}

/* 步骤行 */
.step-no {
  width: 44rpx;
  height: 44rpx;
  border-radius: 50%;
  background-color: $c-primary-soft;
  color: $c-primary;
  font-size: 24rpx;
  text-align: center;
  line-height: 44rpx;
}

.step-text {
  box-sizing: border-box;
  width: 100%;
  min-height: 88rpx;
  margin-top: 18rpx;
  padding: 18rpx 20rpx;
  border: 1px solid $c-line;
  border-radius: 14rpx;
  background-color: #fbf9f6;
  font-size: 28rpx;
  line-height: 1.6;
  color: $c-text;
}

.step-timer {
  display: flex;
  align-items: center;
  margin-top: 16rpx;
}

.step-timer__label {
  font-size: 26rpx;
  color: $c-text-muted;
}

.step-timer__input {
  box-sizing: border-box;
  width: 180rpx;
  height: 56rpx;
  margin-left: 16rpx;
  padding: 0 18rpx;
  border: 1px solid $c-line;
  border-radius: 14rpx;
  background-color: #fbf9f6;
  font-size: 26rpx;
  color: $c-text;
}

.step-timer__suffix {
  margin-left: 10rpx;
  font-size: 26rpx;
  color: $c-text-muted;
}

/* 添加行按钮（虚线） */
.add-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 88rpx;
  margin-top: 20rpx;
  border: 2rpx dashed rgba(232, 89, 12, 0.45);
  border-radius: 20rpx;
  background-color: rgba(232, 89, 12, 0.04);
  color: $c-primary;
  font-size: 28rpx;
}

.add-btn:active {
  background-color: rgba(232, 89, 12, 0.1);
}

/* 底部：取消 / 保存 */
.footer__btns {
  display: flex;
}

.footer__cancel {
  flex: 1;
  margin-right: 20rpx;
}

.footer__save {
  flex: 2;
}

/* 食材选择器弹层 */
.mask {
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  z-index: 20;
  background-color: rgba(31, 27, 22, 0.45);
}

.sheet {
  position: absolute;
  right: 0;
  bottom: 0;
  left: 0;
  padding: 28rpx 32rpx calc(28rpx + env(safe-area-inset-bottom));
  border-radius: 28rpx 28rpx 0 0;
  background-color: $c-bg;
}

.sheet__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.sheet__title {
  font-size: 32rpx;
  font-weight: 600;
  color: $c-text;
}

.sheet__create {
  font-size: 26rpx;
  color: $c-primary;
}

/* 新建食材 */
.sheet__new {
  margin-top: 24rpx;
  padding: 24rpx;
  border-radius: 20rpx;
  background-color: $c-card;
}

.sheet__new-input {
  box-sizing: border-box;
  width: 100%;
  height: 72rpx;
  padding: 0 20rpx;
  border: 1px solid $c-line;
  border-radius: 14rpx;
  background-color: #fbf9f6;
  font-size: 28rpx;
  color: $c-text;
}

.sheet__new-groups {
  display: flex;
  margin-top: 18rpx;
}

.sheet__new-chip {
  margin-right: 14rpx;
}

.sheet__new-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 76rpx;
  margin-top: 20rpx;
  border-radius: 999rpx;
  background-color: $c-primary;
  color: #ffffff;
  font-size: 28rpx;
}

/* 搜索 */
.sheet__search {
  display: flex;
  align-items: center;
  height: 80rpx;
  margin-top: 24rpx;
  padding: 0 24rpx;
  border: 1px solid $c-line;
  border-radius: 999rpx;
  background-color: $c-card;
}

.sheet__search-icon {
  flex-shrink: 0;
  width: 28rpx;
  height: 28rpx;
  margin-right: 16rpx;
}

.sheet__search-input {
  flex: 1;
  height: 100%;
  font-size: 28rpx;
  color: $c-text;
}

/* 字典列表（固定高度保证 scroll-view 在小程序端也能滚动） */
.sheet__list {
  height: 480rpx;
  margin-top: 16rpx;
}

.sheet__item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 22rpx 8rpx;
  border-bottom: 1px solid $c-line;
}

.sheet__item-name {
  font-size: 28rpx;
  color: $c-text;
}

.sheet__item-group {
  font-size: 22rpx;
  color: $c-text-muted;
}

.sheet__empty {
  padding: 60rpx 0;
  text-align: center;
  font-size: 26rpx;
  color: $c-text-muted;
}
</style>