import axios from 'axios';

const isNative = typeof window !== 'undefined' && (window as any).Capacitor?.isNativePlatform();

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL 
    ? (process.env.NEXT_PUBLIC_API_URL.endsWith('/api') ? process.env.NEXT_PUBLIC_API_URL : `${process.env.NEXT_PUBLIC_API_URL}/api`)
    : 'http://localhost:5000/api',
});

// Add interceptor for auth token and bypass tunnel reminder
api.interceptors.request.use((config) => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  config.headers['bypass-tunnel-reminder'] = 'true';
  return config;
});

// Response interceptor for better error reporting on native platforms
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (typeof window !== 'undefined' && isNative) {
      console.log('--- SIGNAL DEGRADATION DETECTED ---');
      console.log('Target API:', error.config?.url);
      console.log('Error Type:', error.code || 'UNKNOWN_ERROR');
      console.log('Error Message:', error.message);
      if (error.response) {
        console.log('Status Code:', error.response.status);
      } else {
        console.log('Network failure or timeout. Check Signal Propagation Hub Status.');
      }
    }
    return Promise.reject(error);
  }
);

export default api;
