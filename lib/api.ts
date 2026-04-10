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

// Response interceptor for better error reporting and auth handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const isInitialCheck = error.config?.url?.includes('/auth/me');
    
    // 🔥 Neural Safety: Clear session on 401 Unauthorized
    // ⚠ BUG FIX: Only flush if we actually SENT a token that was rejected.
    // If we didn't send a token, it might just be a hydration delay — don't kill the session!
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      const sentToken = error.config?.headers?.Authorization;
      if (sentToken) {
        console.warn('[NEURAL] Identity Expired or Unauthorized. Flushing Session...');
        localStorage.removeItem('hellopay-auth-storage');
        localStorage.removeItem('token');
      } else {
        console.log('[NEURAL] 401 Blocked (No token sent) - Retrying sync instead of logout.');
      }
    }

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
    // Priority 1: Simple Token Key
    token = localStorage.getItem('token');
    
    // Priority 2: Neural Storage (Zustand)
    if (!token) {
      const authData = localStorage.getItem('hellopay-auth-storage');
      if (authData) {
        try {
          const parsed = JSON.parse(authData);
          token = parsed.state?.token;
        } catch (e) {}
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
