import axios from 'axios';

// Render backend URL
const api = axios.create({
  baseURL: 'https://budgetbuddy-backend-0u31.onrender.com/api/', // Aapka Render backend endpoint
});

// Request Interceptor: Har request ke sath access token attach karein
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Agar token expire ho toh seedha auto-logout karein
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.clear();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;