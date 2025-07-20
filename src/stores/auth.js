import { defineStore } from "pinia";
import { ref, computed } from "vue";
import { API_URL } from "../config";
import api from "../utils/api";

export const useAuthStore = defineStore("auth", () => {
  const user = ref(null);
  const token = ref(localStorage.getItem("token") || null);
  const isLoading = ref(false);
  const error = ref(null);

  const isAuthenticated = computed(() => !!token.value);
  const isAdmin = computed(() => user.value?.role === "admin");

  // 初始化用户信息
  async function initUser() {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      user.value = JSON.parse(storedUser);
    }
  }

  // 登录
  async function login(username, password) {
    isLoading.value = true;
    error.value = null;

    try {
      // 使用api.post替代fetch
      const data = await api.post("/auth/login", { username, password });
      token.value = data.token;
      user.value = data.user;

      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));

      return data;
    } catch (err) {
      error.value = err.message;
      throw err;
    } finally {
      isLoading.value = false;
    }
  }

  // 注销
  function logout() {
    token.value = null;
    user.value = null;
    localStorage.removeItem("token");
    localStorage.removeItem("user");
  }

  // 注册用户（仅管理员）
  async function registerUser(username, password, role) {
    isLoading.value = true;
    error.value = null;

    try {
      // 使用api.post替代fetch
      const data = await api.post("/auth/register", { username, password, role });
      return data;
    } catch (err) {
      error.value = err.message;
      throw err;
    } finally {
      isLoading.value = false;
    }
  }

  // 获取用户列表（仅管理员）
  async function getUsers() {
    isLoading.value = true;
    error.value = null;

    try {
      // 使用api.get替代fetch
      const data = await api.get("/users");
      return data;
    } catch (err) {
      error.value = err.message;
      throw err;
    } finally {
      isLoading.value = false;
    }
  }

  // 删除用户（仅管理员）
  async function deleteUser(userId) {
    isLoading.value = true;
    error.value = null;

    try {
      // 使用api.delete替代fetch
      const data = await api.delete(`/users/${userId}`);
      return data;
    } catch (err) {
      error.value = err.message;
      throw err;
    } finally {
      isLoading.value = false;
    }
  }

  // 初始化
  initUser();

  // 验证 token 是否有效
  async function validateToken() {
    if (!token.value) return false;

    try {
      // 使用api.get替代fetch
      await api.get("/auth/validate");
      return true;
    } catch (error) {
      console.error("Token 验证失败:", error);
      return false;
    }
  }

  // 刷新 token
async function refreshToken() {
  try {
    // 直接使用fetch而不是api.post，避免循环依赖
    const response = await fetch(`${API_URL}/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token.value}`
      }
    });
    
    // 检查响应状态
    if (!response.ok) {
      console.error('刷新token失败，状态码:', response.status);
      return false;
    }
    
    // 尝试解析JSON
    try {
      const data = await response.json();
      token.value = data.token;
      localStorage.setItem("token", data.token);
      return true;
    } catch (parseError) {
      console.error('刷新token响应解析失败:', parseError);
      return false;
    }
  } catch (error) {
    console.error("刷新 token 失败:", error);
    return false;
  }
}

  return {
    user,
    token,
    isLoading,
    error,
    isAuthenticated,
    isAdmin,
    login,
    logout,
    registerUser,
    getUsers,
    deleteUser,
    validateToken,
    refreshToken,
  };
});