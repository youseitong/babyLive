<template>
  <a-config-provider :locale="locale">
    <div v-if="authStore.isAuthenticated">
      <!-- 移动端布局 - 无导航栏 -->
      <div v-if="isMobileRoute">
        <a-layout class="mobile-layout">
          <a-layout-content class="mobile-content">
            <router-view></router-view>
          </a-layout-content>
        </a-layout>
      </div>
      <!-- 桌面端布局 - 有导航栏 -->
      <a-layout v-else class="layout">
        <a-layout-header class="header">
          <div class="logo">婴儿喂养记录</div>
          <a-menu
            v-model:selectedKeys="selectedKeys"
            theme="dark"
            mode="horizontal"
            :style="{ lineHeight: '64px' }"
          >
            <a-menu-item key="home">
              <router-link to="/">吃奶记录</router-link>
            </a-menu-item>
            <a-menu-item key="stats">
              <router-link to="/stats">吃奶统计</router-link>
            </a-menu-item>
            <a-menu-item key="mobile">
              <router-link to="/mobile">手机版</router-link>
            </a-menu-item>
            <a-menu-item key="users" v-if="authStore.isAdmin">
              <router-link to="/users">用户管理</router-link>
            </a-menu-item>
            <a-menu-item key="logout" @click="logout">
              <span>退出登录</span>
            </a-menu-item>
          </a-menu>
        </a-layout-header>
        <a-layout-content class="content">
          <div class="content-container">
            <router-view></router-view>
          </div>
        </a-layout-content>
        <a-layout-footer class="footer">
          婴儿喂养记录 ©2023 Created with Vue 3 + Ant Design
        </a-layout-footer>
      </a-layout>
    </div>
    <div v-else>
      <router-view></router-view>
    </div>
  </a-config-provider>
</template>

<script setup>
import { ref, watch, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import zhCN from 'ant-design-vue/es/locale/zh_CN'
import { useAuthStore } from './stores/auth'

const locale = zhCN
const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const selectedKeys = ref(['home'])

// 判断当前是否为移动端路由
const isMobileRoute = computed(() => {
  return route.meta.isMobile === true
})

// 添加路由检查
if (route) {
  watch(
    () => route.path,
    (path) => {
      if (path === '/') selectedKeys.value = ['home']
      else if (path === '/stats') selectedKeys.value = ['stats']
      else if (path === '/users') selectedKeys.value = ['users']
      else if (path === '/excretion') selectedKeys.value = ['excretion']
      else if (path === '/excretion-stats') selectedKeys.value = ['excretionStats']
      else if (path === '/combined') selectedKeys.value = ['combined']
      else if (path === '/mobile') selectedKeys.value = ['mobile']
    },
    { immediate: true }
  )
}

function logout() {
  authStore.logout()
  router.push('/login')
}
</script>

<style>
.layout {
  min-height: 100vh;
}

.header {
  display: flex;
  align-items: center;
}

.logo {
  color: white;
  font-size: 20px;
  font-weight: bold;
  margin-right: 30px;
}

.content {
  padding: 0 50px;
}

.content-container {
  background: #fff;
  padding: 24px;
  min-height: 280px;
  margin-top: 16px;
}

/* 移动端样式 */
.mobile-layout {
  min-height: 100vh;
}

.mobile-content {
  padding: 0;
  background: #fff;
}
</style>