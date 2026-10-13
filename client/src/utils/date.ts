/**
 * 日期工具（做菜记录等共用）
 *
 * 静态阶段用设备本地日期；正式版记录日期来自服务端。
 */

/** Date → YYYY-MM-DD */
export function toISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** 今天（YYYY-MM-DD） */
export function todayISO(): string {
  return toISODate(new Date());
}

/** 在 ISO 日期上加减天数（days 可为负） */
export function shiftISODate(iso: string, days: number): string {
  const [y, m, d] = iso.split('-').map(Number);
  return toISODate(new Date(y, m - 1, d + days));
}

/** 记录里的日期展示：今天 / 昨天 / M月D日（跨年补年份） */
export function formatLogDate(iso: string): string {
  const today = todayISO();
  if (iso === today) return '今天';
  if (iso === shiftISODate(today, -1)) return '昨天';
  const [y, m, d] = iso.split('-').map(Number);
  if (y === new Date().getFullYear()) return `${m}月${d}日`;
  return `${y}年${m}月${d}日`;
}

/** Date → YYYY-MM-DD HH:mm（完成时刻，精确到分钟） */
export function toISODateTime(d: Date): string {
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${toISODate(d)} ${hh}:${mm}`;
}

/**
 * 群聊日期分隔行（输入 YYYY-MM-DD 或 YYYY-MM-DD HH:mm）：
 * 今天 / 昨天 / M月D日（跨年补年份）
 */
export function formatChatDay(value: string): string {
  return formatLogDate(value.slice(0, 10));
}

/**
 * 完成时刻展示（输入 YYYY-MM-DD HH:mm）：
 * 今天只显时刻、昨天显"昨天 HH:mm"、今年显"M月D日 HH:mm"、跨年补年份
 */
export function formatCompletedAt(value: string): string {
  const [datePart, timePart = ''] = value.split(' ');
  if (!datePart) return value;
  const today = todayISO();
  let prefix: string;
  if (datePart === today) {
    prefix = '';
  } else if (datePart === shiftISODate(today, -1)) {
    prefix = '昨天 ';
  } else {
    const [y, m, d] = datePart.split('-').map(Number);
    prefix = y === new Date().getFullYear() ? `${m}月${d}日 ` : `${y}年${m}月${d}日 `;
  }
  return `${prefix}${timePart}`.trim();
}
