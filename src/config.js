// 根据环境变量选择API地址
const ENV = import.meta.env.MODE || 'development';

const CONFIG = {
  development: {
    apiUrl: "http://fnos.youseitong.top:3000/api"
  },
  production: {
    // apiUrl: "http://192.168.68.128:3000/api"
    apiUrl: "http://fnos.youseitong.top:3000/api"
  }
};

export const API_URL = CONFIG[ENV].apiUrl;