"use client";

import React, { useState, useEffect } from "react";
import {
  syncPushSubscription,
  getActualPushSubscription,
  sendTestNotification,
  detectDeviceType,
} from "@/lib/push-sync";

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

  // Manage / troubleshooting modal
  const [showManageModal, setShowManageModal] = useState(false);
  const [testSending, setTestSending] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);
  const [resyncing, setResyncing] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const ua = window.navigator.userAgent.toLowerCase();
    setIsIOS(/iphone|ipad|ipod/.test(ua));
    setIsStandalone(
      window.matchMedia("(display-mode: standalone)").matches ||
        (window.navigator as any).standalone === true
    );

    // Initial check from localStorage for fast render
    const subFlag = localStorage.getItem("fcmierda_push_v2_subscribed") === "true";
    if ("Notification" in window && Notification.permission === "granted" && subFlag) {
      setIsSubscribed(true);
    }

    // Auto-heal and verify active subscription in background
    if ("Notification" in window && Notification.permission === "granted") {
      syncPushSubscription().then((res) => {
        if (res.isSubscribed) {
          setIsSubscribed(true);
        } else {
          // If browser has permission but push was cleared
          getActualPushSubscription().then((sub) => {
            setIsSubscribed(!!sub);
          });
        }
      });
    }
  }, []);

  const handleClick = async () => {
    if (isSubscribed) {
      // If already subscribed, open manage/troubleshoot modal
      setShowManageModal(true);
      return;
    }

    setLoading(true);
    setStatusMessage(null);

    try {
      if (isIOS && !isStandalone) {
        alert(
          "📱 To enable notifications on your iPhone/iPad:\n\n1. Tap the Share button (square with arrow) in Safari.\n2. Tap 'Add to Home Screen'.\n3. Open FC Mierda from your Home Screen to activate notifications."
        );
        setLoading(false);
        return;
      }

      if (!("Notification" in window) || !("serviceWorker" in navigator)) {
        alert("Push notifications are not supported in this browser.");
        setLoading(false);
        return;
      }

      const res = await syncPushSubscription({ forceReSubscribe: true });
      if (res.success && res.isSubscribed) {
        setIsSubscribed(true);
        setStatusMessage("✓ Successfully subscribed to match alerts!");
        setTimeout(() => setStatusMessage(null), 5000);
      } else if (res.error) {
        setStatusMessage(res.error);
        setTimeout(() => setStatusMessage(null), 5000);
      }
    } catch (err: any) {
      console.error("Subscription failed:", err);
      setStatusMessage("Could not complete subscription. Ensure you are on HTTPS.");
      setTimeout(() => setStatusMessage(null), 4000);
    } finally {
      setLoading(false);
    }
  };

  const handleSendTest = async () => {
    setTestSending(true);
    setTestResult(null);
    try {
      const res = await sendTestNotification();
      if (res.success) {
        setTestResult("✓ Test notification dispatched! Check your notification tray.");
      } else {
        setTestResult(`⚠️ ${res.error || "Failed to dispatch test notification."}`);
      }
    } catch (err: any) {
      setTestResult(`⚠️ Error: ${err.message}`);
    } finally {
      setTestSending(false);
    }
  };

  const handleResync = async () => {
    setResyncing(true);
    setTestResult(null);
    try {
      const res = await syncPushSubscription({ forceReSubscribe: true });
      if (res.success && res.isSubscribed) {
        setIsSubscribed(true);
        setTestResult("✓ Successfully refreshed subscription token with the server!");
      } else {
        setTestResult(`⚠️ Refresh failed: ${res.error}`);
      }
    } catch (err: any) {
      setTestResult(`⚠️ Error: ${err.message}`);
    } finally {
      setResyncing(false);
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

  const device = detectDeviceType();

  return (
    <>
      <div className="flex flex-col items-center gap-1.5 w-full sm:w-auto">
        <button
          type="button"
          onClick={handleClick}
          disabled={loading}
          className={`group inline-flex items-center justify-center gap-2.5 font-bold text-sm sm:text-base px-6 py-3.5 rounded-full transition-all duration-200 cursor-pointer disabled:opacity-60 ${getButtonStyles()} ${className}`}
          title={isSubscribed ? "Click to manage notifications or send a test alert" : "Get instant notifications for matches and results"}
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
              <span className="text-[11px] bg-emerald-800/60 text-emerald-200 px-1.5 py-0.5 rounded-full ml-1">Settings</span>
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

      {/* Manage & Troubleshoot Notifications Modal */}
      {showManageModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="relative w-full max-w-md bg-gray-900 border border-gray-700/80 rounded-2xl p-6 text-white shadow-2xl">
            <button
              onClick={() => setShowManageModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white p-1 rounded-lg transition-colors"
              aria-label="Close"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-xl shrink-0">
                🔔
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Notificatie Beheer</h3>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-xs text-emerald-300 font-semibold capitalize">
                    Actief op dit apparaat ({device})
                  </span>
                </div>
              </div>
            </div>

            <p className="text-sm text-gray-300 mb-5 leading-relaxed">
              Je apparaat is aangemeld voor FC Mierda match alerts, selectie oproepen en uitslagen.
            </p>

            {testResult && (
              <div className={`p-3 rounded-xl mb-4 text-xs font-medium ${
                testResult.startsWith("✓")
                  ? "bg-emerald-950/80 border border-emerald-500/40 text-emerald-300"
                  : "bg-red-950/80 border border-red-500/40 text-red-200"
              }`}>
                {testResult}
              </div>
            )}

            <div className="space-y-2.5 mb-5">
              <button
                type="button"
                onClick={handleSendTest}
                disabled={testSending || resyncing}
                className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold py-2.5 px-4 rounded-xl text-sm transition-all shadow-md active:scale-98"
              >
                {testSending ? (
                  <>
                    <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                    <span>Testmelding versturen...</span>
                  </>
                ) : (
                  <>
                    <span>🚀</span>
                    <span>Stuur een testmelding</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleResync}
                disabled={testSending || resyncing}
                className="w-full flex items-center justify-center gap-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 disabled:opacity-50 text-gray-200 hover:text-white font-semibold py-2.5 px-4 rounded-xl text-sm transition-all active:scale-98"
              >
                {resyncing ? (
                  <>
                    <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                    <span>Herstellen &amp; synchroniseren...</span>
                  </>
                ) : (
                  <>
                    <span>🔄</span>
                    <span>Meldingen opnieuw synchroniseren</span>
                  </>
                )}
              </button>
            </div>

            {/* Android & Mobile troubleshooting tip */}
            <div className="bg-black/40 border border-gray-800 rounded-xl p-3.5 text-xs text-gray-400 leading-relaxed">
              <div className="font-semibold text-gray-200 mb-1 flex items-center gap-1.5">
                <span>💡</span>
                <span>Ontvang je niks op Android?</span>
              </div>
              <ul className="list-disc list-inside space-y-1 text-gray-400 pl-0.5">
                <li>Controleer in <strong className="text-gray-300">Android Instellingen &gt; Apps &gt; Chrome &gt; Meldingen</strong> of meldingen zijn toegestaan.</li>
                <li>Zorg dat de batterijbesparing voor Chrome op &apos;Onbeperkt&apos; of &apos;Geoptimaliseerd&apos; staat zodat meldingen op de achtergrond binnenkomen.</li>
              </ul>
            </div>

            <div className="mt-4 pt-3 border-t border-gray-800 text-right">
              <button
                type="button"
                onClick={() => setShowManageModal(false)}
                className="text-xs text-gray-400 hover:text-gray-200 underline cursor-pointer"
              >
                Sluiten
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
