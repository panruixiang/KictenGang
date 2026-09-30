# 01 — 工程初始化与全局样式骨架

> 参考：[00-总览与约定.md](../00-总览与约定.md) · [design-v0-plan.md](../../../../docs/design-v0-plan.md)

**What to build:** 在 `client/` 建起可运行的 uni-app（Vue3 + TypeScript）工程：H5 可启动预览，底部 tabBar 四格（菜谱 / 反查 / 记录 / 我的）可切换，设计 token 与全局样式落地，后续所有工单都复用它。

**Blocked by:** 无 — 可立即开始

**Status:** ready-for-agent

## 规格要点

- 用 CLI 模板初始化：`npx degit dcloudio/uni-preset-vue#vite-ts client`（Node ≥ 18）；`npm i` 后 `npm run dev:h5` 可用、`npm run build:h5` 通过；移除模板示例内容。
- `pages.json`：tabBar 四格（菜谱 / 反查 / 记录 / 我的，中文文案，带图标与选中态）；同时登记后续所有页面路由（各先建空壳页，标题占位即可）：菜谱详情、做菜引导、记一笔、记录浏览、反查结果、常备维护、录入表单、收藏、加入确认。
- 全局 `navigationStyle: custom`：各页自绘标题区（含返回），为状态栏留出安全区。
- 设计 token 按 00-总览 落地（SCSS 变量 + CSS 变量双份）：`#FAF8F5` 底 / `#E8590C` 主色 / `#1F1B16` 主文字 / `#6B6259` 次级文字 / 圆角 14px；间距刻度 4 / 8 / 12 / 16 / 24；字体 `PingFang SC, system-ui`。
- 目录骨架按 00-总览 约定：`src/{pages,components,mock,store,utils,types,static,styles}`。
- tabBar 图标：8 个 PNG（选中 / 未选中各 4，放 `src/static/tabbar/`），线性风格，未选中灰、选中主色。
- 代码注释用中文。

## 验收标准

- [ ] `npm run dev:h5` 启动，四个 tab 可切换，tabBar 图标与选中态正确
- [ ] token 在 SCSS 与 `var(--primary)` 两种方式下均可用
- [ ] `npm run build:h5` 无报错
- [ ] 目录结构与空壳路由齐全（后续工单可直接接管目标页）