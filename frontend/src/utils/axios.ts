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

// 响应拦截器：直接返回 response.data
instance.interceptors.response.use(
  response => {
    const data = response.data;
    // 假设后端统一格式：{ success: boolean, data: any, message: string }
    if (data && typeof data === 'object' && 'success' in data) {
      if (data.success === true) {
        return data.data;   // 成功时返回实际数据
      } else {
        // 失败时抛出异常，进入 catch
        return Promise.reject(new Error(data.message || '请求失败'));
      }
    }
    // 非标准格式，直接返回数据
    return data;
  },
  error => Promise.reject(error)
);

export default instance;