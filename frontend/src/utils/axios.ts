import axios from 'axios';

const instance = axios.create({
  baseURL: '',
  timeout: 30000,
});

// 请求拦截器
instance.interceptors.request.use(config => {
  if (config.url && !config.url.startsWith('http')) {
    config.url = '/api' + config.url;
  }
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 响应拦截器：处理统一响应格式
instance.interceptors.response.use(
  response => {
    const data = response.data;
    // 假设后端返回 { success: boolean, code: number, data: any, message: string }
    if (data && typeof data === 'object' && 'success' in data) {
      if (data.success === true) {
        // 成功时返回实际数据（data.data）
        return data.data;
      } else {
        // 失败时抛出异常，包含错误信息
        return Promise.reject(new Error(data.message || '请求失败'));
      }
    }
    // 如果接口没有 success 字段（如一些非标准接口），直接返回数据
    return data;
  },
  error => Promise.reject(error)
);

export default instance;