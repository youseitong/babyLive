import { useAuthStore } from '../stores/auth';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

async function request(endpoint, options = {}) {
  const authStore = useAuthStore();
  
  // 设置默认请求头
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  // 添加认证头
  if (authStore.token) {
    headers['Authorization'] = `Bearer ${authStore.token}`;
  }

  try {
    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers,
    });

    // 处理未授权响应
    if (response.status === 401) {
      // 尝试刷新 token
      const refreshed = await authStore.refreshToken();
      if (refreshed) {
        // 使用新 token 重试请求
        headers['Authorization'] = `Bearer ${authStore.token}`;
        const retryResponse = await fetch(`${API_URL}${endpoint}`, {
          ...options,
          headers,
        });
        return handleResponse(retryResponse);
      } else {
        // 刷新 token 失败，登出用户
        authStore.logout();
        window.location.href = '/login';
        return Promise.reject(new Error('会话已过期，请重新登录'));
      }
    }

    return handleResponse(response);
  } catch (error) {
    console.error('API请求错误:', error);
    throw error;
  }
}

async function handleResponse(response) {
  const data = await response.json();
  
  if (!response.ok) {
    const error = new Error(data.message || '请求失败');
    error.status = response.status;
    error.data = data;
    throw error;
  }
  
  return data;
}

// 封装常用 HTTP 方法
export const api = {
  get: (endpoint, options = {}) => 
    request(endpoint, { ...options, method: 'GET' }),
    
  post: (endpoint, body, options = {}) =>
    request(endpoint, { ...options, method: 'POST', body: JSON.stringify(body) }),
    
  put: (endpoint, body, options = {}) =>
    request(endpoint, { ...options, method: 'PUT', body: JSON.stringify(body) }),
    
  delete: (endpoint, options = {}) =>
    request(endpoint, { ...options, method: 'DELETE' }),
    
  upload: (endpoint, formData, options = {}) => {
    const headers = {
      ...options.headers,
    };
    delete headers['Content-Type']; // 让浏览器自动设置 Content-Type 和 boundary
    
    return request(endpoint, {
      ...options,
      method: 'POST',
      body: formData,
      headers,
    });
  },
};

export default api;
