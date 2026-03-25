import axios, { AxiosRequestConfig } from 'axios';

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
  response => response.data,
  error => Promise.reject(error)
);

// 重新导出，让 TypeScript 知道返回的是 data 类型
const api = {
  get: <T = any>(url: string, config?: AxiosRequestConfig): Promise<T> => instance.get(url, config),
  post: <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> => instance.post(url, data, config),
  put: <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> => instance.put(url, data, config),
  delete: <T = any>(url: string, config?: AxiosRequestConfig): Promise<T> => instance.delete(url, config),
};

export default api;