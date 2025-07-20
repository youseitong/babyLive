import { createApp } from 'vue'
import { createPinia } from 'pinia'
import Antd from 'ant-design-vue'
import App from './App.vue'
import router from './router'
import 'ant-design-vue/dist/antd.css'
import { eventBus, AUTH_EVENTS } from './utils/eventBus'

const app = createApp(App)

app.use(createPinia())
app.use(router)
app.use(Antd)

// 监听认证错误事件
eventBus.config.globalProperties.$eventBus = eventBus;
eventBus.config.globalProperties.$eventBus.on(AUTH_EVENTS.AUTH_ERROR, () => {
  router.push('/login');
});

app.mount('#app')