import { apiClient } from './api';

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = window.atob(base64);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

export async function subscribeCitizenPush(sosId, phone) {
  try {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return null;
    const reg = await navigator.serviceWorker.ready;
    const perm = await Notification.requestPermission();
    if (perm !== 'granted') return null;
    const { data } = await apiClient.get('/push/vapid-public-key');
    const key = data.public_key;
    let sub = await reg.pushManager.getSubscription();
    if (!sub) {
      sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(key),
      });
    }
    const json = sub.toJSON();
    await apiClient.post('/push/subscribe', {
      endpoint: json.endpoint,
      keys: json.keys,
      sos_id: sosId || null,
      phone: phone || null,
    });
    return sub;
  } catch (e) {
    return null;
  }
}

// Fallback: show a local (in-page) notification via SW registration
export async function localNotify(title, body, tag) {
  try {
    if (!('Notification' in window)) return;
    if (Notification.permission !== 'granted') return;
    if ('serviceWorker' in navigator) {
      const reg = await navigator.serviceWorker.ready;
      reg.showNotification(title, { body, icon: '/assets/sentrasafe-logo.jpeg', badge: '/assets/sentrasafe-logo.jpeg', tag: tag || 'sentrasafe', vibrate: [200, 100, 200] });
    } else {
      new Notification(title, { body, icon: '/assets/sentrasafe-logo.jpeg' });
    }
  } catch { /* noop */ }
}
