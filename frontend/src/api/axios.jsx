import axios from 'axios';

const api = axios.create({
  baseURL: 'http://127.0.0.1:8000/api/',
});

// Interceptor: Public routes (login/register) par purana token nahi bhejega
api.interceptors.request.use(
  (config) => {
    const isPublic = config.url.includes('token/') || config.url.includes('register/');
    const token = localStorage.getItem('token');

    if (token && !isPublic) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default api;