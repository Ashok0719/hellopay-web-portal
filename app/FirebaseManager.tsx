'use client';

import { useEffect } from 'react';
import { PushNotifications } from '@capacitor/push-notifications';
import { Capacitor } from '@capacitor/core';
import api from '@/lib/api';
import { useAuthStore } from '@/hooks/useAuth';

export default function FirebaseManager() {
  const { token, setUser, logout } = useAuthStore();

  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      initPushNotifications();
    }

    // 🔥 Neural Warming: Wake up Render backend immediately
    api.get('/health').catch(() => {});
    
    // Auth Restoration: Persistent Login (Cookie-first fallback)
    api.get('/auth/me')
      .then(({ data }) => {
        if (data.token) {
          // Sync token to store if we recovered via cookie
          useAuthStore.getState().setToken(data.token);
        }
        setUser(data);
        console.log('[Auth] Persistent Session Restored via Neural Cookie');
      })
      .catch((err) => {
        const status = err.response?.status;
        if (status === 401 || status === 403) {
            // Silently clear session if invalid, no warning needed for initial load
            logout();
        }
      });
  }, []);

  const initPushNotifications = async () => {
    try {
      // 1. Request Permission
      let permStatus = await PushNotifications.checkPermissions();

      if (permStatus.receive === 'prompt') {
        permStatus = await PushNotifications.requestPermissions();
      }

      if (permStatus.receive !== 'granted') {
        throw new Error('User denied permissions!');
      }

      // 2. Register with FCM
      await PushNotifications.register();

      // 3. Listen for successful registration & send token to backend
      await PushNotifications.addListener('registration', token => {
        console.log('Push Registration Success, token:', token.value);
        // Register token with our backend for this user
        api.post('/auth/update-fcm-token', { fcmToken: token.value })
          .catch(err => console.error('Error updating FCM token:', err));
      });

      // 4. Handle errors
      await PushNotifications.addListener('registrationError', err => {
        console.error('Push Registration Error:', err.error);
      });

      // 5. Handle incoming notifications while app is open
      await PushNotifications.addListener('pushNotificationReceived', notification => {
        console.log('Notification Received:', notification);
      });

      // 6. Handle notification click actions
      await PushNotifications.addListener('pushNotificationActionPerformed', notification => {
        console.log('Notification Action:', notification.actionId, notification.notification);
      });

    } catch (e) {
      console.error('Firebase Initialization Failed:', e);
    }
  };

  return null;
}
