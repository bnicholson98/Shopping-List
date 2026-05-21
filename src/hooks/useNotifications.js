import { useState, useEffect, useCallback } from 'react';
import { getMessaging, getToken, deleteToken } from 'firebase/messaging';
import { doc, setDoc, deleteDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../firebase';
import app from '../firebase';

const VAPID_KEY = process.env.REACT_APP_FIREBASE_VAPID_KEY;

const DEFAULT_PREFS = { notifyOnAdd: false, notifyOnRemove: false };

export default function useNotifications() {
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [preferences, setPreferences] = useState(DEFAULT_PREFS);
  const [initializing, setInitializing] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const isSupported =
    typeof Notification !== 'undefined' &&
    'serviceWorker' in navigator &&
    'PushManager' in window;

  // Check existing subscription on mount
  useEffect(() => {
    if (!isSupported) { setInitializing(false); return; }

    (async () => {
      try {
        const user = auth.currentUser;
        if (!user || Notification.permission !== 'granted') return;

        const docRef = doc(db, 'fcmTokens', user.uid);
        const snap = await getDoc(docRef);
        if (!snap.exists()) return;

        const reg = await navigator.serviceWorker.getRegistration();
        if (!reg) return;

        const messaging = getMessaging(app);
        const token = await getToken(messaging, {
          vapidKey: VAPID_KEY,
          serviceWorkerRegistration: reg
        });

        if (token) {
          setIsSubscribed(true);
          const data = snap.data();

          // Read prefs, defaulting to true if field missing (backcompat)
          const loaded = {
            notifyOnAdd: data.notifyOnAdd !== undefined ? data.notifyOnAdd : false,
            notifyOnRemove: data.notifyOnRemove !== undefined ? data.notifyOnRemove : false,
          };
          setPreferences(loaded);

          // Backfill token refresh + missing pref fields in one write
          const updates = {};
          if (data.token !== token) updates.token = token;
          if (data.notifyOnAdd === undefined) updates.notifyOnAdd = false;
          if (data.notifyOnRemove === undefined) updates.notifyOnRemove = false;

          if (Object.keys(updates).length > 0) {
            await setDoc(docRef, updates, { merge: true });
          }
        }
      } catch (e) {
        console.error('Notification check failed:', e);
      } finally {
        setInitializing(false);
      }
    })();
  }, [isSupported]);

  const subscribe = useCallback(async (initialPrefs = DEFAULT_PREFS) => {
    if (!isSupported) return false;
    try {
      setBusy(true);
      setError(null);

      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        setError(permission === 'denied'
          ? 'Blocked — enable in device settings'
          : 'Permission not granted');
        return false;
      }

      // Optimistic — flip immediately once permission is confirmed
      setIsSubscribed(true);
      setPreferences(initialPrefs);

      const reg = await navigator.serviceWorker.getRegistration();
      if (!reg) throw new Error('Service worker not available');

      const messaging = getMessaging(app);
      const token = await getToken(messaging, {
        vapidKey: VAPID_KEY,
        serviceWorkerRegistration: reg
      });
      if (!token) throw new Error('Could not get push token');

      const user = auth.currentUser;
      if (!user) throw new Error('Not signed in');

      await setDoc(doc(db, 'fcmTokens', user.uid), {
        token,
        uid: user.uid,
        createdAt: serverTimestamp(),
        ...initialPrefs,
      });

      return true;
    } catch (e) {
      console.error('Subscribe failed:', e);
      // Revert optimistic update
      setIsSubscribed(false);
      setPreferences(DEFAULT_PREFS);
      setError(e.message);
      return false;
    } finally {
      setBusy(false);
    }
  }, [isSupported]);

  const unsubscribe = useCallback(async () => {
    const prevPrefs = { ...preferences };
    try {
      setBusy(true);
      setError(null);

      // Optimistic — flip immediately
      setIsSubscribed(false);
      setPreferences(DEFAULT_PREFS);

      const messaging = getMessaging(app);
      await deleteToken(messaging);

      const user = auth.currentUser;
      if (user) await deleteDoc(doc(db, 'fcmTokens', user.uid));
    } catch (e) {
      console.error('Unsubscribe failed:', e);
      // Revert optimistic update
      setIsSubscribed(true);
      setPreferences(prevPrefs);
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }, [preferences]);

  const updatePreferences = useCallback(async (updates) => {
    const previous = { ...preferences };
    try {
      // Optimistic UI
      setPreferences(prev => ({ ...prev, ...updates }));

      const user = auth.currentUser;
      if (!user) return;

      await setDoc(doc(db, 'fcmTokens', user.uid), updates, { merge: true });
    } catch (e) {
      console.error('Preference update failed:', e);
      setPreferences(previous);
      setError(e.message);
    }
  }, [preferences]);

  return {
    isSupported,
    isSubscribed,
    preferences,
    initializing,
    busy,
    error,
    subscribe,
    unsubscribe,
    updatePreferences,
  };
}