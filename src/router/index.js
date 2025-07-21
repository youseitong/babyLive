import { createRouter, createWebHistory } from "vue-router";
import Home from "../views/Home.vue";
import { useAuthStore } from "../stores/auth";
import MobileFeedingRecordView from "../components/MobileFeedingRecordView.vue";
const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: "/",
      name: "home",
      component: Home,
      meta: { requiresAuth: true },
    },
    {
      path: "/stats",
      name: "stats",
      component: () => import("../views/Stats.vue"),
      meta: { requiresAuth: true },
    },
    {
      path: "/login",
      name: "login",
      component: () => import("../views/Login.vue"),
      meta: { guest: true },
    },
    {
      path: "/users",
      name: "users",
      component: () => import("../views/UserManagement.vue"),
      meta: { requiresAuth: true, requiresAdmin: true },
    },
    {
      path: "/mobile",
      name: "mobile",
      component: () => import("../views/MobileHome.vue"),
      meta: { requiresAuth: true, isMobile: true },
    },
    {
      path: "/mobile/feeding-records",
      name: "MobileFeedingRecords",
      component: MobileFeedingRecordView,
      meta: { requiresAuth: true, isMobile: true },
    },
  ],
});

// 检测是否为移动设备
function isMobileDevice() {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );
}

router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore();
  const isMobile = isMobileDevice();
  const requiresAuth = to.matched.some((record) => record.meta.requiresAuth);
  const isGuest = to.matched.some((record) => record.meta.guest);

  // 如果路由需要认证
  if (requiresAuth) {
    // 检查 token 是否存在
    if (!authStore.token) {
      next("/login");
      return;
    }

    // 验证 token 是否有效
    const isValid = await authStore.validateToken();
    if (!isValid) {
      // 尝试刷新 token
      const refreshed = await authStore.refreshToken();
      if (!refreshed) {
        // 刷新失败，清除认证信息并重定向到登录页
        authStore.logout();
        next("/login");
        return;
      }
    }
  }

  // 已登录用户访问登录页时重定向到首页
  if (isGuest && authStore.isAuthenticated) {
    next("/");
    return;
  }

  // 移动端重定向
  if (isMobile && to.path === "/") {
    next("/mobile");
    return;
  }

  next();
});

export default router;
