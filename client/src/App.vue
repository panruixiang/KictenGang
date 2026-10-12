<script setup lang="ts">
// 纯前端静态页面版本：全局初始化留白
// （后续接微信云开发时，登录 / 当前空间加载等逻辑放在这里）
import { onLaunch } from '@dcloudio/uni-app';
import { getUnread, store } from '@/store';

// 启动时按当前空间未读数给"厨房群"tab（index=2，中间格）挂红点
function showUnreadBadge() {
  const unread = getUnread(store.spaceName);
  if (unread > 0) {
    uni.setTabBarBadge({
      index: 2,
      text: String(unread),
      fail: () => {
        /* 平台不支持或时机过早时静默 */
      },
    });
  }
}

onLaunch(() => {
  showUnreadBadge();
  // H5 端 tabBar 偶尔晚于 onLaunch 就绪，延迟再幂等挂一次
  setTimeout(showUnreadBadge, 500);
});
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
