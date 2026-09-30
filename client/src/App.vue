<script setup lang="ts">
// 纯前端静态页面版本：全局初始化留白
// （后续接微信云开发时，登录 / 当前空间加载等逻辑放在这里）
</script>

<style lang="scss">
@import './styles/common.scss';

/* 设计 token 的 CSS 变量形式（与 uni.scss 中的 SCSS 变量同源） */
page,
:root {
  --bg: #{$c-bg};
  --primary: #{$c-primary};
  --text: #{$c-text};
  --text-muted: #{$c-text-muted};
  --radius: #{$radius};
}

/* 页面基础样式（H5 端 page 会被编译为页面根节点） */
page {
  background-color: $c-bg;
  color: $c-text;
  font-family: $font-family;
  font-size: 28rpx;
}
</style>