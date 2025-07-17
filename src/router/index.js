import { createRouter, createWebHistory } from 'vue-router'
import Home from '../views/Home.vue'
import { useAuthStore } from '../stores/auth'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: Home,
      meta: { requiresAuth: true }
    },
    {
      path: '/stats',
      name: 'stats',
      component: () => import('../views/Stats.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/login',
      name: 'login',
      component: () => import('../views/Login.vue'),
      meta: { guest: true }
    },
    {
      path: '/users',
      name: 'users',
      component: () => import('../views/UserManagement.vue'),
      meta: { requiresAuth: true, requiresAdmin: true }
    },
    {
      path: '/mobile',
      name: 'mobile',
      component: () => import('../views/MobileHome.vue'),
      meta: { requiresAuth: true, isMobile: true }
    },
  ]
})

// 检测是否为移动设备
function isMobileDevice() {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

router.beforeEach((to, from, next) => {
  const authStore = useAuthStore()
  const isMobile = isMobileDevice()
  
  // 如果是移动设备且用户已登录
  if (isMobile && authStore.isAuthenticated) {
    // 如果当前不是移动端页面，则重定向到移动版
    if (!to.meta.isMobile) {
      // 保持原有路径结构，只是将基础路径改为/mobile
      const mobilePath = to.path === '/' ? '/mobile' : `/mobile${to.path}`
      next(mobilePath)
      return
    }
  } 
  // 如果是移动设备但访问的是非移动端页面，且不是登录页
  else if (isMobile && !to.meta.isMobile && to.path !== '/login') {
    next('/mobile')
    return
  }
  
  const requiresAuth = to.matched.some(record => record.meta.requiresAuth)
  const requiresAdmin = to.matched.some(record => record.meta.requiresAdmin)
  const isGuestRoute = to.matched.some(record => record.meta.guest)

  // 需要登录但未登录
  if (requiresAuth && !authStore.isAuthenticated) {
    next({
      path: '/login',
      query: { redirect: to.fullPath } // 保存目标路径，登录后重定向回来
    })
  } 
  // 需要管理员权限但没有
  else if (requiresAdmin && !authStore.isAdmin) {
    next('/')
  } 
  // 已登录但访问的是访客页面（如登录页）
  else if (isGuestRoute && authStore.isAuthenticated) {
    next('/')
  } 
  // 其他情况正常放行
  else {
    next()
  }
})

export default router