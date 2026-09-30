/**
 * 图标生成脚本（纯 Node 实现，不依赖三方库）
 *
 * 生成两类 PNG：
 *  1. tabBar 四格图标（菜谱 / 反查 / 记录 / 我的）——线性描边风格，未选中灰、选中主色
 *  2. 收藏心形图标（未收藏 = 灰描边，已收藏 = 主色实心）
 *
 * 用法：node scripts/gen-icons.mjs
 */
import { deflateSync } from 'node:zlib';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const TABBAR_DIR = join(ROOT, 'src/static/tabbar');
const ICONS_DIR = join(ROOT, 'src/static/icons');

/** 设计 token 中的颜色 */
const COLOR_MUTED = { r: 0x9a, g: 0x92, b: 0x8a }; // 未选中灰
const COLOR_PRIMARY = { r: 0xe8, g: 0x59, b: 0x0c }; // 主色

/* ---------------- PNG 编码 ---------------- */

const CRC_TABLE = (() => {
  const table = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c;
  }
  return table;
})();

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
}

/** 将 RGBA 像素编码为 PNG */
function encodePng(width, height, rgba) {
  const raw = Buffer.alloc((width * 4 + 1) * height);
  for (let y = 0; y < height; y++) {
    raw[y * (width * 4 + 1)] = 0; // filter: none
    rgba.copy(raw, y * (width * 4 + 1) + 1, y * width * 4, (y + 1) * width * 4);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type: RGBA
  const sig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  return Buffer.concat([
    sig,
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

/* ---------------- 光栅化（4x4 超采样抗锯齿） ---------------- */

/**
 * 将"图形判定函数"渲染为 RGBA 像素
 * @param {number} size 画布边长（px）
 * @param {(x: number, y: number) => boolean} hit 命中判定（x/y 为像素中心坐标，0.5 起点）
 * @param {{r:number,g:number,b:number}} color 图形颜色
 */
function render(size, hit, color) {
  const SS = 4;
  const rgba = Buffer.alloc(size * size * 4);
  for (let py = 0; py < size; py++) {
    for (let px = 0; px < size; px++) {
      let acc = 0;
      for (let sy = 0; sy < SS; sy++) {
        for (let sx = 0; sx < SS; sx++) {
          const x = px + (sx + 0.5) / SS;
          const y = py + (sy + 0.5) / SS;
          if (hit(x, y)) acc++;
        }
      }
      const idx = (py * size + px) * 4;
      rgba[idx] = color.r;
      rgba[idx + 1] = color.g;
      rgba[idx + 2] = color.b;
      rgba[idx + 3] = Math.round((acc / (SS * SS)) * 255);
    }
  }
  return rgba;
}

/* ---------------- 基础图形 ---------------- */

/** 点到线段的距离 */
function segDist(px, py, x1, y1, x2, y2) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len2 = dx * dx + dy * dy;
  const t = len2 === 0 ? 0 : Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / len2));
  return Math.hypot(px - (x1 + t * dx), py - (y1 + t * dy));
}

/** 圆形描边 */
const ring = (cx, cy, r, w) => (x, y) => Math.abs(Math.hypot(x - cx, y - cy) - r) <= w / 2;

/** 实心圆 */
const disc = (cx, cy, r) => (x, y) => Math.hypot(x - cx, y - cy) <= r;

/** 线段描边（圆头） */
const line = (x1, y1, x2, y2, w) => (x, y) => segDist(x, y, x1, y1, x2, y2) <= w / 2;

/** 圆弧描边：角度用 atan2(度)，0 = 正右方，顺时针为正（屏幕坐标系 y 向下） */
const arc = (cx, cy, r, w, a0, a1) => (x, y) => {
  const d = Math.hypot(x - cx, y - cy);
  if (Math.abs(d - r) > w / 2) return false;
  let a = (Math.atan2(y - cy, x - cx) * 180) / Math.PI;
  if (a < 0) a += 360;
  let s = a0 < 0 ? a0 + 360 : a0;
  let e = a1 < 0 ? a1 + 360 : a1;
  if (s <= e) return a >= s && a <= e;
  return a >= s || a <= e;
};

/** 圆角矩形描边 */
const roundRect = (x0, y0, x1, y1, rad, w) => {
  const cx = (x0 + x1) / 2;
  const cy = (y0 + y1) / 2;
  const hw = (x1 - x0) / 2;
  const hh = (y1 - y0) / 2;
  return (x, y) => {
    const qx = Math.abs(x - cx) - (hw - rad);
    const qy = Math.abs(y - cy) - (hh - rad);
    const d = Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) + Math.min(Math.max(qx, qy), 0) - rad;
    return Math.abs(d) <= w / 2;
  };
};

/** 图形并集 */
const union = (...shapes) => (x, y) => shapes.some((s) => s(x, y));

/* ---------------- 图标定义（画布 81×81） ---------------- */

const STROKE = 5; // 线性图标统一线宽

/** 菜谱：书本（圆角外框 + 书脊 + 文字线） */
const iconRecipe = union(
  roundRect(13, 12, 68, 69, 6, STROKE),
  line(26, 14.5, 26, 66.5, STROKE),
  line(36, 31, 58, 31, STROKE),
  line(36, 44, 58, 44, STROKE),
  line(36, 57, 50, 57, STROKE),
);

/** 反查：放大镜（镜圈 + 手柄） */
const iconSearch = union(ring(35, 35, 17, STROKE), line(47.5, 47.5, 63.5, 63.5, STROKE));

/** 记录：便签（圆角外框 + 三条横线） */
const iconLog = union(
  roundRect(15, 12, 66, 69, 6, STROKE),
  line(27, 30, 54, 30, STROKE),
  line(27, 40.5, 54, 40.5, STROKE),
  line(27, 51, 54, 51, STROKE),
);

/** 我的：人形（头部圆环 + 肩部圆弧） */
const iconProfile = union(ring(40.5, 28, 10, STROKE), arc(40.5, 63, 18, STROKE, 200, 340));

/* ---------------- 心形（收藏） ---------------- */

/** 三角形内外判定 + 带符号距离 */
function triDist(px, py, ax, ay, bx, by, cx, cy) {
  const d = Math.min(
    segDist(px, py, ax, ay, bx, by),
    segDist(px, py, bx, by, cx, cy),
    segDist(px, py, cx, cy, ax, ay),
  );
  const d1 = (px - bx) * (ay - by) - (ax - bx) * (py - by);
  const d2 = (px - cx) * (by - cy) - (bx - cx) * (py - cy);
  const d3 = (px - ax) * (cy - ay) - (cx - ax) * (py - ay);
  const hasNeg = d1 < 0 || d2 < 0 || d3 < 0;
  const hasPos = d1 > 0 || d2 > 0 || d3 > 0;
  return hasNeg && hasPos ? d : -d;
}

/**
 * 心形带符号距离：两个圆 + 一个三角形取并集
 * 画布 60×60，心形实际占约 52×49
 */
function heartSd(x, y) {
  const cxA = 17;
  const cxB = 43;
  const cy = 18.3;
  const r = 13;
  const dCircleA = Math.hypot(x - cxA, y - cy) - r;
  const dCircleB = Math.hypot(x - cxB, y - cy) - r;
  const dTri = triDist(x, y, 4, 18.3, 56, 18.3, 30, 54.7);
  return Math.min(dCircleA, dCircleB, dTri);
}

/* ---------------- 输出 ---------------- */

mkdirSync(TABBAR_DIR, { recursive: true });
mkdirSync(ICONS_DIR, { recursive: true });

const tabIcons = [
  ['recipe', iconRecipe],
  ['search', iconSearch],
  ['log', iconLog],
  ['profile', iconProfile],
];

for (const [name, shape] of tabIcons) {
  writeFileSync(join(TABBAR_DIR, `${name}.png`), encodePng(81, 81, render(81, shape, COLOR_MUTED)));
  writeFileSync(join(TABBAR_DIR, `${name}-active.png`), encodePng(81, 81, render(81, shape, COLOR_PRIMARY)));
}

const HEART_SIZE = 60;
writeFileSync(
  join(ICONS_DIR, 'heart.png'),
  encodePng(HEART_SIZE, HEART_SIZE, render(HEART_SIZE, (x, y) => Math.abs(heartSd(x, y)) <= 2.3, COLOR_MUTED)),
);
writeFileSync(
  join(ICONS_DIR, 'heart-active.png'),
  encodePng(HEART_SIZE, HEART_SIZE, render(HEART_SIZE, (x, y) => heartSd(x, y) <= 0, COLOR_PRIMARY)),
);

console.log('图标已生成：');
console.log('  src/static/tabbar/*.png （8 个 tabBar 图标）');
console.log('  src/static/icons/heart.png / heart-active.png （收藏心形）');