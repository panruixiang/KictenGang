/**
 * 样本菜数据（写死的真实 mock）
 *
 * - 内置 6 道（只读）：宫保鸡丁 / 麻婆豆腐 / 红烧肉 / 清蒸鲈鱼 / 番茄炒蛋 / 青椒土豆丝
 * - 自家 1 道：「番茄炒蛋（我家版）」，带来源小字与版本（默认版 / 少糖版）
 * - 配料分组：主料 / 辅料 / 调味料（调味料不参与"按食材反查"）
 * - 用量 = 数字 + 单位，或特殊值"适量"（amount 为 null）
 * - 封面图为公开菜品照片（下厨房 CDN），仅作原型演示素材，后续可替换为自家照片
 */

import type { Recipe, RecipeIngredient } from '@/types';

export const RECIPES: Recipe[] = [
  {
    id: 'gongbao-jiding',
    name: '宫保鸡丁',
    cuisine: '川',
    durationMin: 30,
    difficulty: '中等',
    servings: 2,
    cover: '/static/cover/gongbao-jiding.jpg',
    isBuiltin: true,
    ingredients: [
      { name: '鸡腿肉', amount: 300, unit: 'g', group: '主料' },
      { name: '花生米', amount: 50, unit: 'g', group: '主料' },
      { name: '干辣椒', amount: 8, unit: '个', group: '辅料' },
      { name: '葱', amount: 1, unit: '根', group: '辅料' },
      { name: '蒜', amount: 3, unit: '瓣', group: '辅料' },
      { name: '生抽', amount: 2, unit: '勺', group: '调味料' },
      { name: '老抽', amount: 1, unit: '勺', group: '调味料' },
      { name: '醋', amount: 2, unit: '勺', group: '调味料' },
      { name: '糖', amount: 1, unit: '勺', group: '调味料' },
      { name: '料酒', amount: 1, unit: '勺', group: '调味料' },
      { name: '盐', amount: null, unit: null, group: '调味料' },
      { name: '淀粉', amount: null, unit: null, group: '调味料' },
    ],
    steps: [
      { text: '鸡腿肉切成 1.5 厘米的丁，加料酒、生抽、淀粉抓匀，腌制 5 分钟。', timerSec: 300 },
      { text: '碗中调入生抽、老抽、醋、糖、淀粉和少许清水，搅匀成碗汁。', timerSec: 60 },
      { text: '冷锅下花生米，小火慢慢炒香，盛出备用。', timerSec: 120 },
      { text: '锅中留油，小火下干辣椒、葱段和蒜片爆香，注意别炒糊。', timerSec: 60 },
      { text: '转大火下鸡丁，快速翻炒至变色。', timerSec: 120 },
      { text: '倒入碗汁，加入花生米，大火翻炒收汁，裹匀即可出锅。', timerSec: 60 },
    ],
  },
  {
    id: 'mapo-doufu',
    name: '麻婆豆腐',
    cuisine: '川',
    durationMin: 25,
    difficulty: '简单',
    servings: 2,
    cover: '/static/cover/mapo-doufu.jpg',
    isBuiltin: true,
    ingredients: [
      { name: '豆腐', amount: 400, unit: 'g', group: '主料' },
      { name: '蒜', amount: 2, unit: '瓣', group: '辅料' },
      { name: '葱', amount: 1, unit: '根', group: '辅料' },
      { name: '豆瓣酱', amount: 1, unit: '勺', group: '调味料' },
      { name: '生抽', amount: 1, unit: '勺', group: '调味料' },
      { name: '淀粉', amount: null, unit: null, group: '调味料' },
      { name: '盐', amount: null, unit: null, group: '调味料' },
      { name: '食用油', amount: 2, unit: '勺', group: '调味料' },
    ],
    steps: [
      { text: '豆腐切成 2 厘米见方的块，放淡盐水里泡 5 分钟去豆腥。', timerSec: 300 },
      { text: '锅中热油，下肉末炒散，加豆瓣酱炒出红油。', timerSec: 120 },
      { text: '下蒜末炒香，倒入适量清水烧开。', timerSec: 60 },
      { text: '下豆腐块，转中小火煮 3 分钟，轻推防碎。', timerSec: 180 },
      { text: '淋入水淀粉勾芡，撒葱花，出锅。', timerSec: 60 },
    ],
  },
  {
    id: 'hongshao-rou',
    name: '红烧肉',
    cuisine: '浙',
    durationMin: 90,
    difficulty: '中等',
    servings: 4,
    cover: '/static/cover/hongshao-rou.jpg',
    isBuiltin: true,
    ingredients: [
      { name: '五花肉', amount: 600, unit: 'g', group: '主料' },
      { name: '姜', amount: 1, unit: '块', group: '辅料' },
      { name: '葱', amount: 2, unit: '根', group: '辅料' },
      { name: '冰糖', amount: 30, unit: 'g', group: '调味料' },
      { name: '生抽', amount: 2, unit: '勺', group: '调味料' },
      { name: '老抽', amount: 1, unit: '勺', group: '调味料' },
      { name: '料酒', amount: 2, unit: '勺', group: '调味料' },
      { name: '盐', amount: null, unit: null, group: '调味料' },
    ],
    steps: [
      { text: '五花肉切成 3 厘米见方的块，冷水下锅焯水，撇去浮沫捞出。', timerSec: 300 },
      { text: '锅中少油，小火炒冰糖至枣红色，下肉块翻炒上色。', timerSec: 180 },
      { text: '加姜片、葱段、料酒、生抽、老抽，翻炒均匀。', timerSec: 60 },
      { text: '加开水没过肉，大火烧开后转小火炖 60 分钟。', timerSec: 3600 },
      { text: '大火收汁，加盐调味，汤汁浓稠裹住肉块即可。', timerSec: 300 },
    ],
  },
  {
    id: 'qingzheng-luyu',
    name: '清蒸鲈鱼',
    cuisine: '粤',
    durationMin: 25,
    difficulty: '中等',
    servings: 2,
    cover: '/static/cover/qingzheng-luyu.jpg',
    isBuiltin: true,
    ingredients: [
      { name: '鲈鱼', amount: 1, unit: '斤', group: '主料' },
      { name: '姜', amount: 1, unit: '块', group: '辅料' },
      { name: '葱', amount: 2, unit: '根', group: '辅料' },
      { name: '蒸鱼豉油', amount: 3, unit: '勺', group: '调味料' },
      { name: '料酒', amount: 1, unit: '勺', group: '调味料' },
      { name: '盐', amount: null, unit: null, group: '调味料' },
      { name: '食用油', amount: 2, unit: '勺', group: '调味料' },
    ],
    steps: [
      { text: '鲈鱼处理干净，两面各划三刀，用料酒和少许盐抹匀，腌 10 分钟。', timerSec: 600 },
      { text: '盘底垫姜片、葱段，放上鲈鱼，鱼身再铺几片姜。', timerSec: 60 },
      { text: '水开后上锅，大火蒸 8 分钟。', timerSec: 480 },
      { text: '取出倒掉盘里的汤汁，铺上葱丝、姜丝，淋蒸鱼豉油。', timerSec: 60 },
      { text: '热油烧至冒烟，浇在葱姜丝上激出香味即可。', timerSec: 60 },
    ],
  },
  {
    id: 'fanqie-chaodan',
    name: '番茄炒蛋',
    cuisine: '家常',
    durationMin: 10,
    difficulty: '简单',
    servings: 2,
    cover: '/static/cover/fanqie-chaodan.jpg',
    isBuiltin: true,
    ingredients: [
      { name: '番茄', amount: 2, unit: '个', group: '主料' },
      { name: '鸡蛋', amount: 3, unit: '个', group: '主料' },
      { name: '糖', amount: 1, unit: '勺', group: '调味料' },
      { name: '盐', amount: null, unit: null, group: '调味料' },
      { name: '食用油', amount: 2, unit: '勺', group: '调味料' },
    ],
    steps: [
      { text: '番茄切块，鸡蛋打散加少许盐搅匀。', timerSec: 120 },
      { text: '热锅倒油，倒入蛋液炒至凝固，盛出备用。', timerSec: 120 },
      { text: '锅中留油，下番茄块中火炒出汁。', timerSec: 180 },
      { text: '倒回鸡蛋，加糖和盐翻炒均匀，撒葱花出锅。', timerSec: 60 },
    ],
  },
  {
    id: 'qingjiao-tudousi',
    name: '青椒土豆丝',
    cuisine: '家常',
    durationMin: 15,
    difficulty: '简单',
    servings: 2,
    cover: '/static/cover/qingjiao-tudousi.jpg',
    isBuiltin: true,
    ingredients: [
      { name: '土豆', amount: 2, unit: '个', group: '主料' },
      { name: '青椒', amount: 1, unit: '个', group: '主料' },
      { name: '蒜', amount: 2, unit: '瓣', group: '辅料' },
      { name: '醋', amount: 1, unit: '勺', group: '调味料' },
      { name: '盐', amount: null, unit: null, group: '调味料' },
      { name: '食用油', amount: 2, unit: '勺', group: '调味料' },
    ],
    steps: [
      { text: '土豆去皮切细丝，清水冲洗去淀粉，沥干。', timerSec: 300 },
      { text: '青椒去籽切丝，蒜切末。', timerSec: 120 },
      { text: '热锅倒油，下蒜末爆香，倒入土豆丝大火快炒。', timerSec: 180 },
      { text: '加青椒丝、盐、醋继续翻炒 1 分钟，断生即可出锅。', timerSec: 60 },
    ],
  },
  {
    id: 'fanqie-chaodan-home',
    name: '番茄炒蛋（我家版）',
    cuisine: '家常',
    durationMin: 10,
    difficulty: '简单',
    servings: 2,
    cover: '/static/cover/fanqie-chaodan-home.jpg',
    isBuiltin: false,
    source: '复制自内置 · 番茄炒蛋',
    // 自家菜：两版配方副本并存，可切换
    versions: [
      {
        id: 'default',
        name: '默认版',
        ingredients: [
          { name: '番茄', amount: 2, unit: '个', group: '主料' },
          { name: '鸡蛋', amount: 3, unit: '个', group: '主料' },
          { name: '糖', amount: 1, unit: '勺', group: '调味料' },
          { name: '盐', amount: null, unit: null, group: '调味料' },
          { name: '食用油', amount: 2, unit: '勺', group: '调味料' },
        ],
      },
      {
        id: 'less-sugar',
        name: '少糖版',
        ingredients: [
          { name: '番茄', amount: 2, unit: '个', group: '主料' },
          { name: '鸡蛋', amount: 3, unit: '个', group: '主料' },
          { name: '糖', amount: 0.5, unit: '勺', group: '调味料' },
          { name: '盐', amount: null, unit: null, group: '调味料' },
          { name: '食用油', amount: 2, unit: '勺', group: '调味料' },
        ],
      },
    ],
    ingredients: [
      { name: '番茄', amount: 2, unit: '个', group: '主料' },
      { name: '鸡蛋', amount: 3, unit: '个', group: '主料' },
      { name: '糖', amount: 1, unit: '勺', group: '调味料' },
      { name: '盐', amount: null, unit: null, group: '调味料' },
      { name: '食用油', amount: 2, unit: '勺', group: '调味料' },
    ],
    steps: [
      { text: '番茄去皮切块（孩子不爱吃皮），鸡蛋打散备用。', timerSec: 180 },
      { text: '热锅倒油，鸡蛋炒至半凝固盛出。', timerSec: 120 },
      { text: '下番茄中火炒软出汁，加糖和盐。', timerSec: 180 },
      { text: '倒回鸡蛋翻炒均匀，撒葱花出锅。', timerSec: 60 },
    ],
  },
];

/** 取全部菜谱（内置 + 自家） */
export function getAllRecipes(): Recipe[] {
  return RECIPES;
}

/** 按 id 取菜谱 */
export function getRecipeById(id: string): Recipe | undefined {
  return RECIPES.find((r) => r.id === id);
}

/** 取某道菜谱在指定版本下的配料（无版本概念时返回菜谱自身配料） */
export function getRecipeIngredients(recipe: Recipe, versionId?: string): RecipeIngredient[] {
  if (!recipe.versions?.length) {
    return recipe.ingredients;
  }
  const version = recipe.versions.find((v) => v.id === versionId) ?? recipe.versions[0];
  return version.ingredients;
}