"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

// Fallback VAPID public key
const FALLBACK_VAPID_KEY =
  "BFX4DWhXbZcIGVG_AzLcljZcTGydrXgIGBpSNRDjoNFIH5rKdHsbDkYrxXQshLD_y6sKwBh1d5N6m1z4LiG_Wk0";

// Utility to convert VAPID public key from base64 to Uint8Array
function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

// Helper to detect device platform accurately
function detectDeviceType(): "android" | "ios" | "desktop" {
  if (typeof window === "undefined") return "desktop";
  const ua = (window.navigator.userAgent || "").toLowerCase();
  const platform = (window.navigator.platform || "").toLowerCase();
  const maxTouchPoints = window.navigator.maxTouchPoints || 0;
  const uaDataPlatform = (((window.navigator as any).userAgentData?.platform || "") as string).toLowerCase();

  // 1. Check iOS / iPadOS
  if (/iphone|ipad|ipod/.test(ua) || (platform.includes("macintel") && maxTouchPoints > 1)) {
    return "ios";
  }

  // 2. Check Android (Chrome, Firefox, Samsung Internet, Edge, etc.)
  if (/android/.test(ua) || /android/.test(uaDataPlatform)) {
    return "android";
  }

  // 3. Desktop
  return "desktop";
}

// Background sync function to update existing subscribers' device type in DB
async function syncExistingSubscription(): Promise<boolean> {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) return false;
  try {
    const registration = await navigator.serviceWorker.ready;
    const sub = await registration.pushManager.getSubscription();
    if (sub) {
      const rawSub = sub.toJSON();
      const deviceType = detectDeviceType();
      const ua = window.navigator.userAgent || "";

      await fetch("/api/push/subscribe", {
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

      localStorage.setItem("fcmierda_push_v2_subscribed", "true");
      return true;
    }
  } catch (err) {
    // Non-critical background sync error
  }
  return false;
}

export default function PushNotificationModal() {
  const [showModal, setShowModal] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Detect device environment
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIosDevice);

    // Check if running as installed PWA (standalone mode)
    const isPWA =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone === true;
    setIsStandalone(isPWA);

    // Force prompt check via URL parameter e.g. ?prompt=true
    const urlParams = new URLSearchParams(window.location.search);
    const forcePrompt = urlParams.get("prompt") === "true" || urlParams.get("notify") === "true";

    // Clean up legacy v1 key
    localStorage.removeItem("fcmierda_push_subscribed");

    // Register service worker and sync existing subscription device type in background
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .then(async () => {
          const synced = await syncExistingSubscription();
          if (synced && !forcePrompt) {
            setShowModal(false);
          }
        })
        .catch((err) => {
          console.warn("ServiceWorker registration notice:", err);
        });
    }

    // If browser notifications are already granted or denied, don't show modal
    if ("Notification" in window) {
      if (Notification.permission === "granted" && !forcePrompt) {
        return;
      }
      if (Notification.permission === "denied" && !forcePrompt) {
        return;
      }
    }

    // If user is already subscribed with platform tracking (v2), don't show
    const isSubscribedV2 = localStorage.getItem("fcmierda_push_v2_subscribed") === "true";
    if (isSubscribedV2 && !forcePrompt) {
      return;
    }

    // If user clicked 'Not now', only ask again after 7 days (1 week)
    const dismissedAt = localStorage.getItem("fcmierda_push_dismissed_at");
    if (dismissedAt && !forcePrompt) {
      const ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000;
      const timePassed = Date.now() - parseInt(dismissedAt, 10);
      if (timePassed < ONE_WEEK_MS) {
        return;
      }
    }

    // Show modal with a short smooth entrance delay
    const timer = setTimeout(() => {
      if ("Notification" in window && Notification.permission === "granted" && !forcePrompt) {
        return;
      }
      setShowModal(true);
    }, 800);

    return () => clearTimeout(timer);
  }, []);

  const handleSubscribe = async () => {
    setLoading(true);
    try {
      // iOS Safari requires adding to Home Screen first for Web Push support
      if (isIOS && !isStandalone) {
        alert(
          "📱 To enable notifications on your iPhone/iPad:\n\n1. Tap the Share button (square with arrow) in Safari.\n2. Tap 'Add to Home Screen'.\n3. Open FC Mierda from your Home Screen to activate notifications."
        );
        setLoading(false);
        return;
      }

      // Check Notification API support
      if (!("Notification" in window)) {
        alert("Push notifications are not supported in this browser.");
        setShowModal(false);
        return;
      }

      // Request browser permission
      const permission = await Notification.requestPermission();
      if (permission === "granted") {
        if ("serviceWorker" in navigator) {
          const registration = await navigator.serviceWorker.ready;

          // Retrieve VAPID public key with multi-layer fallback
          let vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
          if (!vapidPublicKey) {
            try {
              const res = await fetch("/api/push/vapid-key");
              const json = await res.json();
              vapidPublicKey = json.publicKey;
            } catch (keyErr) {
              console.warn("Using fallback VAPID key:", keyErr);
              vapidPublicKey = FALLBACK_VAPID_KEY;
            }
          }

          if (!vapidPublicKey) {
            vapidPublicKey = FALLBACK_VAPID_KEY;
          }

          const convertedKey = urlBase64ToUint8Array(vapidPublicKey);

          let subscription = await registration.pushManager.getSubscription();
          let oldEndpoint: string | undefined;

          // If no subscription exists, create one
          if (!subscription) {
            subscription = await registration.pushManager.subscribe({
              userVisibleOnly: true,
              applicationServerKey: convertedKey,
            });
          }

          const rawSub = subscription.toJSON();
          const deviceType = detectDeviceType();
          const ua = window.navigator.userAgent || "";

          // Save subscription in database
          await fetch("/api/push/subscribe", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              endpoint: subscription.endpoint,
              keys: {
                p256dh: rawSub.keys?.p256dh,
                auth: rawSub.keys?.auth,
              },
              deviceType,
              userAgent: ua,
              oldEndpoint,
            }),
          });
        }

        localStorage.setItem("fcmierda_push_v2_subscribed", "true");
        localStorage.removeItem("fcmierda_push_subscribed");
        localStorage.removeItem("fcmierda_push_dismissed_at");
        setShowModal(false);

        // Redirect visitor to the fixtures page
        router.push("/fixtures");
      } else {
        // User chose to deny/block in browser prompt
        localStorage.setItem("fcmierda_push_dismissed_at", Date.now().toString());
        setShowModal(false);
      }
    } catch (error) {
      console.error("Failed to subscribe to push notifications:", error);
      alert("Could not complete subscription. Please make sure you are accessing via HTTPS.");
    } finally {
      setLoading(false);
    }
  };

  const handleDismiss = () => {
    setShowModal(false);
    // Remember dismissal timestamp to re-prompt in 1 week
    localStorage.setItem("fcmierda_push_dismissed_at", Date.now().toString());
  };

  if (!showModal) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fade-in">
      <div
        className="relative w-full max-w-md p-6 sm:p-8 rounded-2xl bg-gradient-to-b from-gray-800 via-gray-900 to-black border border-green-600/70 shadow-2xl text-white transform transition-all duration-300"
        style={{
          boxShadow: "0 20px 50px -10px rgba(0, 100, 0, 0.5), 0 0 25px rgba(34, 197, 94, 0.25)",
        }}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={handleDismiss}
          className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors p-1.5 rounded-full hover:bg-gray-800 focus:outline-none"
          aria-label="Close modal"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Content */}
        <div className="flex flex-col items-center text-center">
          {/* Bell badge */}
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-green-700 to-green-950 border border-green-400/60 flex items-center justify-center mb-4 text-3xl shadow-lg animate-bounce">
            🔔
          </div>

          <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-wide mb-2">
            Never Miss a Match! ⚽
          </h2>
          <p className="text-sm sm:text-base text-gray-300 mb-5 leading-relaxed">
            Get instant match schedules, live score updates, and team announcements directly on your device.
          </p>

          {/* iOS Safari instruction banner */}
          {isIOS && !isStandalone && (
            <div className="w-full mb-5 p-3.5 rounded-xl bg-amber-950/70 border border-amber-500/50 text-amber-200 text-xs sm:text-sm text-left shadow-inner">
              <span className="font-bold block mb-1 text-amber-300">📱 iPhone & iPad Step:</span>
              Tap <strong>Share</strong> (⬆️) in Safari ➔ <strong>&ldquo;Add to Home Screen&rdquo;</strong>, then open FC Mierda from your Home Screen to enable notifications.
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 w-full mt-1">
            <button
              type="button"
              onClick={handleDismiss}
              className="w-full sm:flex-1 py-3 px-4 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white font-semibold text-sm transition-all border border-gray-700 cursor-pointer"
            >
              Not now
            </button>
            <button
              type="button"
              onClick={handleSubscribe}
              disabled={loading}
              className="w-full sm:flex-1 py-3 px-4 rounded-xl bg-green-600 hover:bg-green-500 text-white font-bold text-sm transition-all shadow-lg hover:shadow-green-600/40 border border-green-500 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  <span>Subscribing...</span>
                </>
              ) : (
                "Yes, notify me"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
