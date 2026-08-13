'use client';

import { useState, useEffect } from 'react';

// Utility to convert VAPID public key
function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

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
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Check if user is on iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIosDevice);

    // Check if installed (standalone mode)
    const isPWA = window.matchMedia('(display-mode: standalone)').matches || 
                  (window.navigator as any).standalone === true;
    setIsStandalone(isPWA);

    // Check if already subscribed or denied
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      navigator.serviceWorker.register('/sw.js').then((registration) => {
        registration.pushManager.getSubscription().then((subscription) => {
          if (!subscription && Notification.permission !== 'denied') {
            // Check local storage to avoid spamming the user
            const hasSeenModal = localStorage.getItem('push_modal_seen');
            if (!hasSeenModal) {
              setShowModal(true);
            }
          }
        });
      }).catch(err => console.error('Service Worker registration failed:', err));
    }
  }, []);

  const handleSubscribe = async () => {
    setLoading(true);
    try {
      if (isIOS && !isStandalone) {
        alert('To receive notifications, please add this website to your Home Screen first (Share > Add to Home Screen), then open the app and accept notifications.');
        setLoading(false);
        return;
      }

      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        const registration = await navigator.serviceWorker.ready;
        
        // Ensure you have NEXT_PUBLIC_VAPID_PUBLIC_KEY in your .env
        const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
        if (!vapidPublicKey) {
          console.error('VAPID public key is missing');
          setLoading(false);
          return;
        }

        const convertedVapidKey = urlBase64ToUint8Array(vapidPublicKey);
        
        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: convertedVapidKey
        });

        // Send to backend
        await fetch('/api/subscribe', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(subscription)
        });

        setShowModal(false);
        localStorage.setItem('push_modal_seen', 'true');
      } else {
        setShowModal(false);
        localStorage.setItem('push_modal_seen', 'true');
      }
    } catch (error) {
      console.error('Failed to subscribe:', error);
    }
    setLoading(false);
  };

  const handleDismiss = () => {
    setShowModal(false);
    localStorage.setItem('push_modal_seen', 'true');
  };

  if (!showModal) return null;

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-white text-black p-6 rounded-lg shadow-xl max-w-sm w-full">
        <h2 className="text-xl font-bold mb-4">Stay Updated! ⚽</h2>
        <p className="mb-4 text-gray-700">
          Want to receive notifications on your phone for next match details and results? Stay tuned!
        </p>
        
        {isIOS && !isStandalone && (
          <div className="mb-4 p-3 bg-yellow-100 text-yellow-800 rounded text-sm font-semibold">
            Note for iOS users: You must add this website to your home screen first to receive notifications.
          </div>
        )}

        <div className="flex justify-end gap-3">
          <button 
            onClick={handleDismiss}
            className="px-4 py-2 text-gray-600 font-medium hover:bg-gray-100 rounded"
          >
            Not now
          </button>
          <button 
            onClick={handleSubscribe}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white font-medium rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Subscribing...' : 'Yes, notify me'}
          </button>
        </div>
      </div>
    </div>
  );
}
