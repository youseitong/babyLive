<template>
  <div class="login-container">
    <a-card title="婴儿喂养记录系统登录" class="login-card">
      <a-form
        :model="formState"
        name="login"
        @finish="onFinish"
        autocomplete="off"
        layout="vertical"
      >
        <a-form-item
          label="用户名"
          name="username"
          :rules="[{ required: true, message: '请输入用户名!' }]"
        >
          <a-input v-model:value="formState.username" />
        </a-form-item>

        <a-form-item
          label="密码"
          name="password"
          :rules="[{ required: true, message: '请输入密码!' }]"
        >
          <a-input-password v-model:value="formState.password" />
        </a-form-item>

        <a-form-item>
          <a-button type="primary" html-type="submit" :loading="loading" block>
            登录
          </a-button>
        </a-form-item>
      </a-form>
    </a-card>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import { message } from 'ant-design-vue';
import { useAuthStore } from '../stores/auth';

const router = useRouter();
const authStore = useAuthStore();
const loading = ref(false);

const formState = reactive({
  username: '',
  password: ''
});

const onFinish = async (values) => {
  loading.value = true;
  try {
    await authStore.login(values.username, values.password);
    message.success('登录成功');
    router.push('/');
  } catch (error) {
    message.error(error.message || '登录失败，请检查用户名和密码');
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  background-color: #f0f2f5;
}

.login-card {
  width: 400px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}
</style>