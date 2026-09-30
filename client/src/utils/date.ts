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