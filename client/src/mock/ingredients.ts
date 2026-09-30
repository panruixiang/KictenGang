/**
 * 食材词表（薄版本，Q8：带分类的规范食材清单）
 *
 * - 覆盖 7 道样本菜的全部主料 / 辅料 / 调味料 + 常见家常食材
 * - 反查页只显示 主料 / 辅料；调味料视为家里默认有、不参与匹配（Q18）
 * - 录入表单的食材选择器与"新建食材"都基于这份字典
 */

import type { IngredientDictItem } from '@/types';

export const INGREDIENT_DICT: IngredientDictItem[] = [
  // 主料
  { name: '鸡腿肉', group: '主料' },
  { name: '五花肉', group: '主料' },
  { name: '牛里脊', group: '主料' },
  { name: '鲈鱼', group: '主料' },
  { name: '鸡蛋', group: '主料' },
  { name: '豆腐', group: '主料' },
  { name: '土豆', group: '主料' },
  { name: '番茄', group: '主料' },
  { name: '青椒', group: '主料' },
  { name: '花生米', group: '主料' },
  { name: '虾仁', group: '主料' },
  // 辅料
  { name: '干辣椒', group: '辅料' },
  { name: '葱', group: '辅料' },
  { name: '姜', group: '辅料' },
  { name: '蒜', group: '辅料' },
  { name: '香菇', group: '辅料' },
  { name: '胡萝卜', group: '辅料' },
  { name: '黄瓜', group: '辅料' },
  { name: '白菜', group: '辅料' },
  { name: '南瓜', group: '辅料' },
  // 调味料（反查不出现，供录入表单使用）
  { name: '生抽', group: '调味料' },
  { name: '老抽', group: '调味料' },
  { name: '醋', group: '调味料' },
  { name: '糖', group: '调味料' },
  { name: '料酒', group: '调味料' },
  { name: '盐', group: '调味料' },
  { name: '淀粉', group: '调味料' },
  { name: '食用油', group: '调味料' },
  { name: '豆瓣酱', group: '调味料' },
  { name: '冰糖', group: '调味料' },
  { name: '蒸鱼豉油', group: '调味料' },
];

/** "我家常备"默认清单（12 条示例态，Q14 / 工单 07、09 共用） */
export const DEFAULT_STAPLES = [
  '鸡蛋',
  '番茄',
  '土豆',
  '五花肉',
  '鸡腿肉',
  '豆腐',
  '花生米',
  '鲈鱼',
  '青椒',
  '蒜',
  '葱',
  '姜',
];