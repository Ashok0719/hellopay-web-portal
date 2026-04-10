import axios from 'axios';

const isNative = typeof window !== 'undefined' && (window as any).Capacitor?.isNativePlatform();

// 🔥 Neural Warming: Wake up Render backend as soon as page loads
if (typeof window !== 'undefined') {
  fetch('https://hellopay-neural-api.onrender.com/api/health').catch(() => {});
}

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL 
    ? (process.env.NEXT_PUBLIC_API_URL.endsWith('/api') ? process.env.NEXT_PUBLIC_API_URL : `${process.env.NEXT_PUBLIC_API_URL}/api`)
    : 'http://localhost:5000/api',
  withCredentials: true,
  timeout: 60000, // 🔥 60s timeout to handle Render cold starts
});

// Response interceptor for better error reporting everywhere
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const isInitialCheck = error.config?.url?.includes('/auth/me');
    
    if (!isInitialCheck) {
      console.error('[NEURAL API FAULT]', {
        url: error.config?.url,
        code: error.code,
        message: error.message,
        status: error.response?.status
      });
    }
    return Promise.reject(error);
  }
);

// Add interceptor for auth token and bypass tunnel reminder
api.interceptors.request.use((config) => {
  let token = null;
  if (typeof window !== 'undefined') {
    const authData = localStorage.getItem('hellopay-auth-storage');
    if (authData) {
      try {
        const parsed = JSON.parse(authData);
        token = parsed.state?.token;
      } catch (e) {
        console.error('Auth Storage Corruption:', e);
      }
    }
  }
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
