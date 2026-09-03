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

export type DeviceType = "android" | "ios" | "desktop";

export function detectDeviceType(): DeviceType {
  if (typeof window === "undefined") return "desktop";
  const ua = (window.navigator.userAgent || "").toLowerCase();
  const platform = (window.navigator.platform || "").toLowerCase();
  const maxTouchPoints = window.navigator.maxTouchPoints || 0;
  const uaDataPlatform = (((window.navigator as any).userAgentData?.platform || "") as string).toLowerCase();

  // 1. Check iOS / iPadOS
  if (/iphone|ipad|ipod/.test(ua) || (platform.includes("macintel") && maxTouchPoints > 1)) {
    return "ios";
  }

  // 2. Check Android
  if (/android/.test(ua) || /android/.test(uaDataPlatform)) {
    return "android";
  }

  // 3. Desktop
  return "desktop";
}

interface AvailabilityPushModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AvailabilityPushModal({ isOpen, onClose }: AvailabilityPushModalProps) {
  const router = useRouter();
  const [step, setStep] = useState<"ask" | "instructions">("ask");
  const [detectedPlatform, setDetectedPlatform] = useState<DeviceType>("desktop");
  const [selectedTab, setSelectedTab] = useState<DeviceType>("desktop");
  const [isStandaloneIOS, setIsStandaloneIOS] = useState(false);
  const [loading, setLoading] = useState(false);
  const [subscribeStatus, setSubscribeStatus] = useState<"idle" | "success" | "denied" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (typeof window === "undefined") return;
    const detected = detectDeviceType();
    setDetectedPlatform(detected);
    setSelectedTab(detected);

    const isPWA =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone === true;
    setIsStandaloneIOS(isPWA);
  }, []);

  if (!isOpen) return null;

  const handleNoThanks = () => {
    onClose();
    router.push("/fixtures#next-game");
  };

  const handleSayYes = () => {
    setStep("instructions");
  };

  const handleEnableNotifications = async () => {
    setLoading(true);
    setSubscribeStatus("idle");
    setErrorMessage("");

    try {
      if (!("Notification" in window)) {
        setSubscribeStatus("error");
        setErrorMessage("Push notifications are not supported by this browser.");
        return;
      }

      const permission = await Notification.requestPermission();
      if (permission === "granted") {
        if ("serviceWorker" in navigator) {
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

          if (!vapidPublicKey) {
            vapidPublicKey = FALLBACK_VAPID_KEY;
          }

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
        }

        localStorage.setItem("fcmierda_push_v2_subscribed", "true");
        localStorage.removeItem("fcmierda_push_subscribed");
        localStorage.removeItem("fcmierda_push_dismissed_at");

        setSubscribeStatus("success");
        setTimeout(() => {
          onClose();
          router.push("/fixtures#next-game");
        }, 1600);
      } else if (permission === "denied") {
        setSubscribeStatus("denied");
      }
    } catch (err: any) {
      console.error("Failed to enable notifications:", err);
      setSubscribeStatus("error");
      setErrorMessage("Could not complete subscription. Ensure HTTPS is used.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div
        className="relative w-full max-w-lg p-5 sm:p-7 rounded-2xl bg-gradient-to-b from-gray-800 via-gray-900 to-black border border-green-600/70 shadow-2xl text-white transform transition-all duration-300 max-h-[92vh] overflow-y-auto"
        style={{
          boxShadow: "0 20px 50px -10px rgba(0, 100, 0, 0.6), 0 0 25px rgba(34, 197, 94, 0.25)",
        }}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={handleNoThanks}
          className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors p-1.5 rounded-full hover:bg-gray-800 focus:outline-none"
          aria-label="Close modal"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {step === "ask" ? (
          /* STEP 1: Call to Action Prompt */
          <div className="flex flex-col items-center text-center">
            {/* Availability check badge */}
            <div className="relative mb-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-green-600 to-emerald-900 border border-green-400 flex items-center justify-center text-3xl shadow-lg">
                ✅
              </div>
              <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-blue-600 border-2 border-gray-900 flex items-center justify-center text-sm shadow">
                🔔
              </div>
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-950/80 border border-green-500/40 text-green-400 text-xs font-semibold uppercase tracking-wider mb-2.5">
              Availability Saved
            </div>

            <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight mb-2">
              Stay Updated on Match Day! ⚽
            </h2>

            <p className="text-sm sm:text-base text-gray-300 mb-5 leading-relaxed max-w-md">
              Now that you&apos;ve registered your availability, stay in the loop! Subscribe to instant notifications for:
            </p>

            {/* Feature list */}
            <div className="w-full space-y-2 mb-6 text-left text-xs sm:text-sm">
              <div className="flex items-center gap-3 p-2.5 rounded-lg bg-gray-800/80 border border-gray-700/70">
                <span className="text-base sm:text-lg">⏰</span>
                <span className="text-gray-200">
                  <strong className="text-green-400 font-semibold">Kickoff & Meetup Reminders</strong> — Never miss the gathering time
                </span>
              </div>
              <div className="flex items-center gap-3 p-2.5 rounded-lg bg-gray-800/80 border border-gray-700/70">
                <span className="text-base sm:text-lg">📋</span>
                <span className="text-gray-200">
                  <strong className="text-green-400 font-semibold">Lineup & Squad Updates</strong> — Know who is playing and who is bench
                </span>
              </div>
              <div className="flex items-center gap-3 p-2.5 rounded-lg bg-gray-800/80 border border-gray-700/70">
                <span className="text-base sm:text-lg">🏆</span>
                <span className="text-gray-200">
                  <strong className="text-green-400 font-semibold">Final Score & Man of the Match</strong> — Live recaps straight to your phone
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3 w-full">
              <button
                type="button"
                onClick={handleNoThanks}
                className="w-full sm:flex-1 py-3 px-4 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white font-semibold text-sm transition-all border border-gray-700 cursor-pointer order-2 sm:order-1"
              >
                No thanks, later
              </button>
              <button
                type="button"
                onClick={handleSayYes}
                className="w-full sm:flex-1 py-3 px-4 rounded-xl bg-green-600 hover:bg-green-500 text-white font-bold text-sm transition-all shadow-lg hover:shadow-green-600/40 border border-green-500 flex items-center justify-center gap-2 cursor-pointer order-1 sm:order-2"
              >
                <span>🔔 Yes, notify me!</span>
              </button>
            </div>
          </div>
        ) : (
          /* STEP 2: Device-Specific Instructions */
          <div className="flex flex-col text-left">
            {/* Header */}
            <div className="flex items-center justify-between gap-2 mb-3">
              <div className="flex items-center gap-2">
                <span className="text-2xl">🔔</span>
                <h2 className="text-lg sm:text-xl font-bold text-white">
                  Enable Match Notifications
                </h2>
              </div>
              <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-green-950 border border-green-500/50 text-green-300">
                Detected: {detectedPlatform === "android" ? "Android 🤖" : detectedPlatform === "ios" ? "iPhone / iPad 🍏" : "Desktop 💻"}
              </span>
            </div>

            <p className="text-xs sm:text-sm text-gray-300 mb-4">
              Follow the quick guide below for your device to start receiving push alerts:
            </p>

            {/* Device tabs */}
            <div className="grid grid-cols-3 gap-1.5 p-1 bg-gray-950 rounded-xl border border-gray-700/80 mb-4">
              <button
                type="button"
                onClick={() => setSelectedTab("android")}
                className={`py-2 px-2 rounded-lg font-semibold text-xs sm:text-sm transition-all flex items-center justify-center gap-1.5 ${
                  selectedTab === "android"
                    ? "bg-green-600 text-white shadow"
                    : "text-gray-400 hover:text-white hover:bg-gray-800"
                }`}
              >
                <span>🤖</span>
                <span>Android</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedTab("ios")}
                className={`py-2 px-2 rounded-lg font-semibold text-xs sm:text-sm transition-all flex items-center justify-center gap-1.5 ${
                  selectedTab === "ios"
                    ? "bg-green-600 text-white shadow"
                    : "text-gray-400 hover:text-white hover:bg-gray-800"
                }`}
              >
                <span>🍏</span>
                <span>iOS</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedTab("desktop")}
                className={`py-2 px-2 rounded-lg font-semibold text-xs sm:text-sm transition-all flex items-center justify-center gap-1.5 ${
                  selectedTab === "desktop"
                    ? "bg-green-600 text-white shadow"
                    : "text-gray-400 hover:text-white hover:bg-gray-800"
                }`}
              >
                <span>💻</span>
                <span>Desktop</span>
              </button>
            </div>

            {/* TAB CONTENT: ANDROID */}
            {selectedTab === "android" && (
              <div className="space-y-3.5 mb-5 text-xs sm:text-sm">
                <div className="p-3.5 rounded-xl bg-gray-800/80 border border-gray-700 space-y-2.5">
                  <div className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-green-600 text-white font-bold flex items-center justify-center text-xs flex-shrink-0 mt-0.5">
                      1
                    </span>
                    <p className="text-gray-200">
                      Tap the <strong className="text-green-400">Enable Notifications</strong> button below to open your browser prompt.
                    </p>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-green-600 text-white font-bold flex items-center justify-center text-xs flex-shrink-0 mt-0.5">
                      2
                    </span>
                    <p className="text-gray-200">
                      When asked <span className="italic text-white">&ldquo;fcmierda wants to send notifications&rdquo;</span>, tap <strong className="text-green-400">Allow</strong>.
                    </p>
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-gray-900/90 border border-gray-700/70 text-gray-300 text-[11px] sm:text-xs">
                  <span className="font-semibold text-yellow-400 block mb-1">💡 Troubleshooting / If previously blocked:</span>
                  Tap the lock or tune icon (🔒) in Chrome&apos;s address bar next to the URL ➔ tap <strong>Permissions</strong> ➔ turn <strong>Notifications</strong> to <strong>Allowed</strong>.
                </div>
              </div>
            )}

            {/* TAB CONTENT: IOS (IPHONE / IPAD) */}
            {selectedTab === "ios" && (
              <div className="space-y-3.5 mb-5 text-xs sm:text-sm">
                {!isStandaloneIOS ? (
                  <>
                    <div className="p-3 rounded-xl bg-amber-950/70 border border-amber-500/50 text-amber-200 text-xs">
                      <strong className="text-amber-300 block mb-0.5">📱 Apple iOS Requirement:</strong>
                      Apple requires web apps to be added to your iPhone/iPad Home Screen to receive Web Push notifications.
                    </div>

                    <div className="p-3.5 rounded-xl bg-gray-800/80 border border-gray-700 space-y-2.5">
                      <div className="flex items-start gap-2.5">
                        <span className="w-5 h-5 rounded-full bg-green-600 text-white font-bold flex items-center justify-center text-xs flex-shrink-0 mt-0.5">
                          1
                        </span>
                        <p className="text-gray-200">
                          In Safari, tap the <strong className="text-blue-400">Share button</strong> (the square with arrow ⬆️ at the bottom toolbar).
                        </p>
                      </div>
                      <div className="flex items-start gap-2.5">
                        <span className="w-5 h-5 rounded-full bg-green-600 text-white font-bold flex items-center justify-center text-xs flex-shrink-0 mt-0.5">
                          2
                        </span>
                        <p className="text-gray-200">
                          Scroll down the share menu and tap <strong className="text-white font-semibold">&ldquo;Add to Home Screen&rdquo;</strong> (➕).
                        </p>
                      </div>
                      <div className="flex items-start gap-2.5">
                        <span className="w-5 h-5 rounded-full bg-green-600 text-white font-bold flex items-center justify-center text-xs flex-shrink-0 mt-0.5">
                          3
                        </span>
                        <p className="text-gray-200">
                          Tap <strong className="text-green-400">Add</strong> (top right), then open <strong className="text-green-400">FC Mierda</strong> from your Home Screen to activate alerts!
                        </p>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="p-3.5 rounded-xl bg-gray-800/80 border border-gray-700 space-y-2">
                    <p className="text-gray-200">
                      You are running FC Mierda from your Home Screen! Tap <strong className="text-green-400">Enable Notifications</strong> below and choose <strong className="text-green-400">Allow</strong> when prompted by iOS.
                    </p>
                    <p className="text-[11px] text-gray-400">
                      If previously blocked, check your device <strong>Settings ➔ FC Mierda ➔ Notifications ➔ Allow Notifications</strong>.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* TAB CONTENT: DESKTOP */}
            {selectedTab === "desktop" && (
              <div className="space-y-3.5 mb-5 text-xs sm:text-sm">
                <div className="p-3.5 rounded-xl bg-gray-800/80 border border-gray-700 space-y-2.5">
                  <div className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-green-600 text-white font-bold flex items-center justify-center text-xs flex-shrink-0 mt-0.5">
                      1
                    </span>
                    <p className="text-gray-200">
                      Click <strong className="text-green-400">Enable Notifications</strong> below.
                    </p>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-green-600 text-white font-bold flex items-center justify-center text-xs flex-shrink-0 mt-0.5">
                      2
                    </span>
                    <p className="text-gray-200">
                      When your browser prompt appears at the top left near the address bar, click <strong className="text-green-400">Allow</strong>.
                    </p>
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-gray-900/90 border border-gray-700/70 text-gray-300 text-[11px] sm:text-xs">
                  <span className="font-semibold text-yellow-400 block mb-1">💡 If you don&apos;t see the prompt or clicked block:</span>
                  Click the lock icon (🔒) right next to the web address ➔ change <strong>Notifications</strong> to <strong>Allow</strong> ➔ refresh the page.
                </div>
              </div>
            )}

            {/* Status Feedback */}
            {subscribeStatus === "success" && (
              <div className="mb-4 p-3 rounded-xl bg-green-950/90 border border-green-500 text-green-300 text-xs sm:text-sm flex items-center gap-2">
                <span className="text-lg">🎉</span>
                <span><strong>All set!</strong> You are now subscribed to match notifications. Redirecting...</span>
              </div>
            )}

            {subscribeStatus === "denied" && (
              <div className="mb-4 p-3 rounded-xl bg-red-950/90 border border-red-500 text-red-300 text-xs sm:text-sm">
                <span>⚠️ Notification permission was blocked. Please enable notifications in your browser or site settings (lock icon in address bar) to receive alerts.</span>
              </div>
            )}

            {subscribeStatus === "error" && (
              <div className="mb-4 p-3 rounded-xl bg-red-950/90 border border-red-500 text-red-300 text-xs sm:text-sm">
                <span>⚠️ {errorMessage || "Could not complete subscription. Please try again."}</span>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 w-full">
              <button
                type="button"
                onClick={handleNoThanks}
                className="w-full sm:w-auto px-4 py-3 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white font-semibold text-xs sm:text-sm transition-all border border-gray-700 cursor-pointer order-2 sm:order-1"
              >
                Done / Go to fixtures
              </button>

              {/* Show enable button for Android, Desktop, or standalone iOS */}
              {(selectedTab !== "ios" || isStandaloneIOS) ? (
                <button
                  type="button"
                  onClick={handleEnableNotifications}
                  disabled={loading || subscribeStatus === "success"}
                  className="w-full sm:flex-1 py-3 px-4 rounded-xl bg-green-600 hover:bg-green-500 text-white font-bold text-xs sm:text-sm transition-all shadow-lg hover:shadow-green-600/40 border border-green-500 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer order-1 sm:order-2"
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                      </svg>
                      <span>Enabling...</span>
                    </>
                  ) : subscribeStatus === "success" ? (
                    "Subscribed! ✓"
                  ) : (
                    "🔔 Enable Notifications"
                  )}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleNoThanks}
                  className="w-full sm:flex-1 py-3 px-4 rounded-xl bg-green-600 hover:bg-green-500 text-white font-bold text-xs sm:text-sm transition-all shadow-lg hover:shadow-green-600/40 border border-green-500 flex items-center justify-center gap-2 cursor-pointer order-1 sm:order-2"
                >
                  <span>Got it! Add to Home Screen</span>
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
