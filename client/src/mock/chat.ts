/**
 * 家庭群聊 mock 数据（写死的真实内容）
 *
 * - 成员 4 位（头像 = 彩色圆 + 首字），全项目共用
 * - 种子消息按"昨天 / 今天傍晚"编排，时间基于今天动态生成，保证演示时消息"很新"
 * - 初始未读：老张家的厨房预置 N 条（数字需与种子里最后 N 条消息对应）
 * - 点菜种子（SEED_ORDERS）在点菜相关工单追加；消息里 type='order' 的条目与其一一对应
 */

import type { ChatMessage, DishOrder, Member } from '@/types';
import { shiftISODate, todayISO } from '@/utils/date';

/** 空间成员 id 常量（全项目引用，避免到处写字面量） */
export const MEMBER_ZHANG = 'm-zhang';
export const MEMBER_LI = 'm-li';
export const MEMBER_WANG = 'm-wang';
export const MEMBER_DOU = 'm-dou';

/** 空间成员（与"我的"页原有头像组完全一致，收敛为唯一数据源） */
export const MEMBERS: Member[] = [
  { id: MEMBER_ZHANG, name: '老张', initial: '张', color: '#E8590C' },
  { id: MEMBER_LI, name: '李姐', initial: '李', color: '#C2255C' },
  { id: MEMBER_WANG, name: '王叔', initial: '王', color: '#2F9E44' },
  { id: MEMBER_DOU, name: '豆豆', initial: '豆', color: '#E8A13C' },
];

/** 预置空间名（与 store 初始 spaceName / 我的页切换示例对齐） */
export const SPACE_MAIN = '老张家的厨房';

/** 拼"今天 HH:mm / 昨天 HH:mm"时间串 */
function at(dayOffset: number, hhmm: string): string {
  return `${shiftISODate(todayISO(), dayOffset)} ${hhmm}`;
}

/** 预置点菜 id（消息与订单通过它关联） */
export const SEED_ORDER_HONGSHAO = 'order-seed-hongshao';
export const SEED_ORDER_KELE = 'order-seed-kele';
export const SEED_ORDER_MAPO = 'order-seed-mapo';

/** 红烧肉菜谱 id 与封面快照（与 mock/recipes.ts 对齐） */
const HONGSHAO_RECIPE_ID = 'hongshao-rou';
const HONGSHAO_COVER = '/static/cover/hongshao-rou.jpg';

/**
 * 预置点菜（老张家的厨房），均为 open：
 * - 豆豆点红烧肉 @李姐（今晚，库菜卡）
 * - 豆豆点手写可乐排骨（周末，公开求菜，简卡）
 */
export function buildSeedOrders(): DishOrder[] {
  return [
    {
      id: SEED_ORDER_HONGSHAO,
      recipeId: HONGSHAO_RECIPE_ID,
      dishName: '红烧肉',
      cover: HONGSHAO_COVER,
      timeTag: '今晚',
      requesterId: MEMBER_DOU,
      assigneeId: MEMBER_LI,
      status: 'open',
      createdAt: at(0, '17:42'),
    },
    {
      id: SEED_ORDER_KELE,
      dishName: '可乐排骨',
      timeTag: '周末',
      requesterId: MEMBER_DOU,
      status: 'open',
      createdAt: at(0, '17:45'),
    },
    // 李姐点麻婆豆腐（公开求菜），老张已认领 —— 进群即可见 claimed 卡
    {
      id: SEED_ORDER_MAPO,
      recipeId: 'mapo-doufu',
      dishName: '麻婆豆腐',
      cover: '/static/cover/mapo-doufu.jpg',
      timeTag: '今晚',
      requesterId: MEMBER_LI,
      claimerId: MEMBER_ZHANG,
      status: 'claimed',
      createdAt: at(0, '17:46'),
    },
  ];
}

/**
 * 预置群聊消息（老张家的厨房），按时间正序（旧 → 新）。
 * 末尾 INITIAL_UNREAD 条语义上为"未读"（只影响红点，消息始终可见）。
 */
export function buildSeedMessages(): ChatMessage[] {
  return [
    // —— 昨天 ——
    { id: 'seed-msg-01', type: 'text', senderId: MEMBER_WANG, text: '鲈鱼蒸好了，今晚都早点回来', createdAt: at(-1, '18:40') },
    { id: 'seed-msg-02', type: 'system', text: '王叔 做好了昨天的「清蒸鲈鱼」', createdAt: at(-1, '18:41') },
    { id: 'seed-msg-03', type: 'text', senderId: MEMBER_DOU, text: '爸做的鱼太鲜了！', createdAt: at(-1, '18:55') },
    // —— 今天 ——
    { id: 'seed-msg-04', type: 'text', senderId: MEMBER_ZHANG, text: '今晚谁在家？', createdAt: at(0, '12:20') },
    { id: 'seed-msg-05', type: 'text', senderId: MEMBER_LI, text: '我在，豆豆有课外班要晚点', createdAt: at(0, '12:31') },
    // —— 以下为未读（共 5 条：3 条文字 + 2 张点菜卡）——
    { id: 'seed-msg-06', type: 'text', senderId: MEMBER_DOU, text: '今晚想吃点下饭的！', createdAt: at(0, '17:35') },
    { id: 'seed-msg-07', type: 'text', senderId: MEMBER_LI, text: '我买了五花肉，要不红烧？', createdAt: at(0, '17:40') },
    { id: 'seed-msg-08', type: 'text', senderId: MEMBER_WANG, text: '举手，我也在家吃', createdAt: at(0, '17:41') },
    { id: 'seed-msg-09', type: 'order', orderId: SEED_ORDER_HONGSHAO, senderId: MEMBER_DOU, createdAt: at(0, '17:42') },
    { id: 'seed-msg-10', type: 'order', orderId: SEED_ORDER_KELE, senderId: MEMBER_DOU, createdAt: at(0, '17:45') },
    // 第 6 个未读事件：麻婆豆腐点菜卡 + 其认领系统提示（红点数字按 6 计）
    { id: 'seed-msg-11', type: 'order', orderId: SEED_ORDER_MAPO, senderId: MEMBER_LI, createdAt: at(0, '17:46') },
    { id: 'seed-msg-12', type: 'system', text: '老张 认领了今晚的「麻婆豆腐」', createdAt: at(0, '17:47') },
  ];
}

/** 初始未读数（与种子消息末尾未读条数同源，改种子时同步改这里） */
export const INITIAL_UNREAD: Record<string, number> = {
  [SPACE_MAIN]: 6,
  '李姐家的厨房': 0,
};
