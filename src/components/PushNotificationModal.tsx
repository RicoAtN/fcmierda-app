"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

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

export default function PushNotificationModal() {
  const [showModal, setShowModal] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Detect device environment
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    const isMobileDevice = /iphone|ipad|ipod|android|mobile/.test(userAgent);
    setIsIOS(isIosDevice);
    setIsDesktop(!isMobileDevice);

    // Check if running as installed PWA (standalone mode)
    const isPWA =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone === true;
    setIsStandalone(isPWA);

    // Check for query parameter to force open for testing e.g. ?prompt=true or ?notify=true
    const urlParams = new URLSearchParams(window.location.search);
    const forcePrompt = urlParams.get("prompt") === "true" || urlParams.get("notify") === "true";

    // If user has already dismissed or accepted in localStorage (and not forcing via URL param)
    const hasSeen = localStorage.getItem("fcmierda_push_modal_seen");
    if (hasSeen === "true" && !forcePrompt) {
      return;
    }

    // If user already explicitly denied notifications in browser settings, do not annoy
    if ("Notification" in window && Notification.permission === "denied" && !forcePrompt) {
      return;
    }

    // Register service worker in background if supported
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch((err) => {
        console.warn("ServiceWorker registration info:", err);
      });
    }

    // Show popup with a slight delay for smooth page entrance
    const timer = setTimeout(() => {
      setShowModal(true);
    }, 900);

    return () => clearTimeout(timer);
  }, []);

  const handleSubscribe = async () => {
    setLoading(true);
    try {
      // iOS Safari requires adding to Home Screen first to use Web Push
      if (isIOS && !isStandalone) {
        alert(
          "📱 To enable notifications on your iPhone/iPad:\n\n1. Tap the Share button (square with arrow) at the bottom of Safari.\n2. Tap 'Add to Home Screen'.\n3. Open FC Mierda from your Home Screen to activate notifications."
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
          const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

          if (!vapidPublicKey) {
            console.error("VAPID public key is missing in client environment");
            alert("VAPID public key missing. Check your environment settings.");
            setLoading(false);
            return;
          }

          const convertedKey = urlBase64ToUint8Array(vapidPublicKey);

          // Clean up any old subscription with a previous/different VAPID key if present
          try {
            const existingSub = await registration.pushManager.getSubscription();
            if (existingSub) {
              await existingSub.unsubscribe();
            }
          } catch (unsubErr) {
            console.warn("Notice: clearing old subscription key:", unsubErr);
          }

          const subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: convertedKey,
          });

          // Save subscription to backend
          await fetch("/api/push/subscribe", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(subscription),
          });
        }

        localStorage.setItem("fcmierda_push_modal_seen", "true");
        setShowModal(false);

        // Refer visitor directly to the fixtures page as requested
        router.push("/fixtures");
      } else {
        // User clicked Deny in browser prompt
        localStorage.setItem("fcmierda_push_modal_seen", "true");
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
    localStorage.setItem("fcmierda_push_modal_seen", "true");
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
          {/* Animated Football / Bell badge */}
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-green-700 to-green-950 border border-green-400/60 flex items-center justify-center mb-4 text-3xl shadow-lg animate-bounce">
            🔔
          </div>

          <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-wide mb-2">
            Get FC Mierda Updates! ⚽
          </h2>
          <p className="text-sm sm:text-base text-gray-300 mb-5 leading-relaxed">
            Never miss an upcoming match schedule, score update, or player attendance news on your {isDesktop ? "computer" : "phone"}!
          </p>

          {/* iOS Safari instruction banner */}
          {isIOS && !isStandalone && (
            <div className="w-full mb-5 p-3.5 rounded-xl bg-amber-950/70 border border-amber-500/50 text-amber-200 text-xs sm:text-sm text-left shadow-inner">
              <span className="font-bold block mb-1 text-amber-300">📱 iPhone & iPad Step:</span>
              Tap <strong>Share</strong> (⬆️) in Safari ➔ <strong>&ldquo;Add to Home Screen&rdquo;</strong>, then open FC Mierda from your Home Screen to enable notifications.
            </div>
          )}

          {/* Desktop notice */}
          {isDesktop && (
            <div className="w-full mb-4 px-3 py-2 rounded-lg bg-gray-800/80 border border-gray-700 text-gray-300 text-xs">
              💻 Works natively on Chrome, Edge, Firefox, and Safari on Desktop.
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
