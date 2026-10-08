// Utility functions for Web Push Notification synchronization & recovery

export const FALLBACK_VAPID_KEY =
  "BFX4DWhXbZcIGVG_AzLcljZcTGydrXgIGBpSNRDjoNFIH5rKdHsbDkYrxXQshLD_y6sKwBh1d5N6m1z4LiG_Wk0";

export function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");

  const rawData = window.atob(base64);
  const buffer = new ArrayBuffer(rawData.length);
  const outputArray = new Uint8Array(buffer);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function detectDeviceType(): "android" | "ios" | "desktop" {
  if (typeof window === "undefined") return "desktop";
  const ua = (window.navigator.userAgent || "").toLowerCase();
  const platform = (window.navigator.platform || "").toLowerCase();
  const maxTouchPoints = window.navigator.maxTouchPoints || 0;
  const uaDataPlatform = (((window.navigator as any).userAgentData?.platform || "") as string).toLowerCase();

  if (/iphone|ipad|ipod/.test(ua) || (platform.includes("macintel") && maxTouchPoints > 1)) {
    return "ios";
  }
  if (/android/.test(ua) || /android/.test(uaDataPlatform)) {
    return "android";
  }
  return "desktop";
}

/**
 * Checks the true physical subscription state from the browser ServiceWorker,
 * rather than relying solely on localStorage flags.
 */
export async function getActualPushSubscription(): Promise<PushSubscription | null> {
  if (typeof window === "undefined" || !("serviceWorker" in navigator) || !("PushManager" in window)) {
    return null;
  }
  try {
    const registration = await navigator.serviceWorker.ready;
    return await registration.pushManager.getSubscription();
  } catch {
    return null;
  }
}

/**
 * Synchronizes and auto-heals the push subscription between the browser and backend database.
 * If permission is granted but the subscription was expired or lost, it creates a fresh one.
 * If a subscription exists, it sends it to /api/push/subscribe to ensure the DB record is active.
 */
export async function syncPushSubscription(options?: {
  forceReSubscribe?: boolean;
}): Promise<{ success: boolean; isSubscribed: boolean; error?: string }> {
  if (typeof window === "undefined" || !("Notification" in window) || !("serviceWorker" in navigator)) {
    return { success: false, isSubscribed: false, error: "Push notifications not supported in this browser." };
  }

  const { forceReSubscribe = false } = options || {};

  // If permission is denied, clear any local flags
  if (Notification.permission === "denied") {
    localStorage.removeItem("fcmierda_push_v2_subscribed");
    return { success: false, isSubscribed: false, error: "Notification permission is blocked in browser settings." };
  }

  // If not granted yet, we cannot background-sync without user interaction
  if (Notification.permission !== "granted") {
    return { success: false, isSubscribed: false };
  }

  try {
    // 1. Ensure service worker is registered
    await navigator.serviceWorker.register("/sw.js").catch(() => {});
    const registration = await navigator.serviceWorker.ready;

    let sub = await registration.pushManager.getSubscription();

    // 2. Fetch VAPID key
    let vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    if (!vapidPublicKey) {
      try {
        const res = await fetch("/api/push/vapid-key");
        const json = await res.json();
        vapidPublicKey = json.publicKey;
      } catch {
        vapidPublicKey = FALLBACK_VAPID_KEY;
      }
    }
    if (!vapidPublicKey) vapidPublicKey = FALLBACK_VAPID_KEY;

    // 3. If forcing resubscribe or no active subscription, subscribe now
    if (forceReSubscribe && sub) {
      try {
        await sub.unsubscribe();
        sub = null;
      } catch (unsubErr) {
        console.warn("Unsubscribe warning:", unsubErr);
      }
    }

    if (!sub) {
      const convertedKey = urlBase64ToUint8Array(vapidPublicKey);
      sub = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: convertedKey as unknown as BufferSource,
      });
    }

    if (!sub) {
      return { success: false, isSubscribed: false, error: "Could not create push subscription." };
    }

    // 4. Save/upsert to database
    const rawSub = sub.toJSON();
    const deviceType = detectDeviceType();
    const ua = window.navigator.userAgent || "";

    const res = await fetch("/api/push/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        endpoint: sub.endpoint,
        keys: {
          p256dh: rawSub.keys?.p256dh,
          auth: rawSub.keys?.auth,
        },
        deviceType,
        userAgent: ua,
      }),
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      return { success: false, isSubscribed: true, error: errData.error || "Failed to save subscription to database." };
    }

    localStorage.setItem("fcmierda_push_v2_subscribed", "true");
    localStorage.removeItem("fcmierda_push_dismissed_at");

    return { success: true, isSubscribed: true };
  } catch (err: any) {
    console.error("syncPushSubscription error:", err);
    return { success: false, isSubscribed: false, error: err.message || "Failed to sync push subscription." };
  }
}

/**
 * Sends an immediate test notification to the user's current device endpoint.
 */
export async function sendTestNotification(): Promise<{ success: boolean; error?: string }> {
  try {
    const sub = await getActualPushSubscription();
    if (!sub) {
      // Try to re-sync first
      const syncResult = await syncPushSubscription();
      if (!syncResult.success) {
        return { success: false, error: "No active push subscription found on this device. Please enable notifications first." };
      }
    }

    const currentSub = await getActualPushSubscription();
    if (!currentSub) {
      return { success: false, error: "Could not retrieve device push subscription." };
    }

    const res = await fetch("/api/push/test", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        endpoint: currentSub.endpoint,
      }),
    });

    const data = await res.json().catch(() => ({}));
    if (res.ok && data.success) {
      return { success: true };
    } else {
      return { success: false, error: data.error || "Server could not dispatch test push." };
    }
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to trigger test notification." };
  }
}
