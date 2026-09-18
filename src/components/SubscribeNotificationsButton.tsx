"use client";

import React, { useState, useEffect } from "react";

const FALLBACK_VAPID_KEY =
  "BFX4DWhXbZcIGVG_AzLcljZcTGydrXgIGBpSNRDjoNFIH5rKdHsbDkYrxXQshLD_y6sKwBh1d5N6m1z4LiG_Wk0";

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

function detectDeviceType(): "android" | "ios" | "desktop" {
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

interface SubscribeButtonProps {
  className?: string;
  variant?: "primary" | "secondary" | "subtle";
  label?: string;
  subscribedLabel?: string;
  showIcon?: boolean;
}

export default function SubscribeNotificationsButton({
  className = "",
  variant = "primary",
  label = "Enable Match Notifications",
  subscribedLabel = "Notifications Active",
  showIcon = true,
}: SubscribeButtonProps) {
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const ua = window.navigator.userAgent.toLowerCase();
    setIsIOS(/iphone|ipad|ipod/.test(ua));
    setIsStandalone(
      window.matchMedia("(display-mode: standalone)").matches ||
        (window.navigator as any).standalone === true
    );

    // Check if user is already subscribed
    const subFlag = localStorage.getItem("fcmierda_push_v2_subscribed") === "true";
    if ("Notification" in window && Notification.permission === "granted" && subFlag) {
      setIsSubscribed(true);
    }
  }, []);

  const handleSubscribe = async () => {
    if (isSubscribed) {
      setStatusMessage("You are already subscribed to FC Mierda match alerts!");
      setTimeout(() => setStatusMessage(null), 4000);
      return;
    }

    setLoading(true);
    setStatusMessage(null);

    try {
      if (isIOS && !isStandalone) {
        alert(
          "📱 To enable notifications on your iPhone/iPad:\n\n1. Tap the Share button in Safari.\n2. Tap 'Add to Home Screen'.\n3. Open FC Mierda from your Home Screen to activate notifications."
        );
        setLoading(false);
        return;
      }

      if (!("Notification" in window) || !("serviceWorker" in navigator)) {
        alert("Push notifications are not supported in this browser.");
        setLoading(false);
        return;
      }

      const permission = await Notification.requestPermission();
      if (permission === "granted") {
        await navigator.serviceWorker.register("/sw.js").catch(() => {});
        const registration = await navigator.serviceWorker.ready;

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

        const convertedKey = urlBase64ToUint8Array(vapidPublicKey);

        let subscription = await registration.pushManager.getSubscription();
        if (!subscription) {
          subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: convertedKey,
          });
        }

        const rawSub = subscription.toJSON();
        const deviceType = detectDeviceType();
        const ua = window.navigator.userAgent || "";

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
          }),
        });

        localStorage.setItem("fcmierda_push_v2_subscribed", "true");
        localStorage.removeItem("fcmierda_push_dismissed_at");
        setIsSubscribed(true);
        setStatusMessage("✓ Successfully subscribed to match alerts!");
        setTimeout(() => setStatusMessage(null), 5000);
      } else {
        setStatusMessage("Permission was not granted in your browser settings.");
        setTimeout(() => setStatusMessage(null), 4000);
      }
    } catch (err: any) {
      console.error("Subscription failed:", err);
      setStatusMessage("Could not complete subscription. Ensure you are on HTTPS.");
      setTimeout(() => setStatusMessage(null), 4000);
    } finally {
      setLoading(false);
    }
  };

  const getButtonStyles = () => {
    if (isSubscribed) {
      return "bg-emerald-950/80 hover:bg-emerald-900/80 text-emerald-300 border border-emerald-500/50 shadow-inner";
    }
    if (variant === "secondary") {
      return "bg-gray-800 hover:bg-gray-700 text-white border border-gray-700 hover:border-gray-600 shadow-md";
    }
    if (variant === "subtle") {
      return "bg-black/50 hover:bg-black/70 text-gray-200 hover:text-white border border-white/20";
    }
    // Default primary
    return "bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/25 hover:shadow-emerald-500/40 hover:-translate-y-0.5 active:translate-y-0";
  };

  return (
    <div className="flex flex-col items-center gap-1.5 w-full sm:w-auto">
      <button
        type="button"
        onClick={handleSubscribe}
        disabled={loading}
        className={`group inline-flex items-center justify-center gap-2.5 font-bold text-sm sm:text-base px-6 py-3.5 rounded-full transition-all duration-200 cursor-pointer disabled:opacity-60 ${getButtonStyles()} ${className}`}
        title={isSubscribed ? "You are subscribed to match updates" : "Get instant notifications for matches and results"}
      >
        {loading ? (
          <>
            <svg className="animate-spin h-4 w-4 text-white shrink-0" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
            <span>Subscribing...</span>
          </>
        ) : isSubscribed ? (
          <>
            {showIcon && <span className="text-emerald-400">✓</span>}
            <span>{subscribedLabel}</span>
          </>
        ) : (
          <>
            {showIcon && (
              <span className="group-hover:scale-110 transition-transform">🔔</span>
            )}
            <span>{label}</span>
          </>
        )}
      </button>

      {statusMessage && (
        <span className="text-xs font-semibold text-emerald-400 animate-fadeIn text-center">
          {statusMessage}
        </span>
      )}
    </div>
  );
}
