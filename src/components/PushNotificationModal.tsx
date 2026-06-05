'use client';

import { useState, useEffect } from 'react';

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export default function PushNotificationModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [subscriptionError, setSubscriptionError] = useState<string | null>(null);

  useEffect(() => {
    // Check if running on an iOS device
    setIsIOS(/iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream);

    // Check if service workers and push are supported
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      navigator.serviceWorker.ready.then(registration => {
        registration.pushManager.getSubscription().then(subscription => {
          if (subscription) {
            setIsSubscribed(true);
          } else {
            // Only show modal if not subscribed and notifications are not denied
            if (Notification.permission !== 'denied') {
              setIsOpen(true);
            }
          }
        });
      });
    }
  }, []);

  const subscribeUser = async () => {
    if (!('serviceWorker' in navigator)) {
      setSubscriptionError('Service Workers not supported by this browser.');
      return;
    }

    try {
      const registration = await navigator.serviceWorker.register('/sw.js');
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!),
      });

      await fetch('/api/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(subscription),
      });

      setIsSubscribed(true);
      setIsOpen(false);
    } catch (error) {
      console.error('Failed to subscribe the user: ', error);
      if (error instanceof Error && error.name === 'NotAllowedError') {
        setSubscriptionError('Permission for notifications was denied. Please enable it in your browser settings.');
      } else {
        setSubscriptionError('Failed to subscribe. Please try again.');
      }
      setIsOpen(false);
    }
  };

  if (!isOpen || isSubscribed) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-gray-800 text-white p-6 rounded-lg shadow-lg max-w-sm w-full mx-4">
        <h2 className="text-xl font-bold mb-4">Stay Updated!</h2>
        <p className="mb-4">Want to receive notifications on your phone for next match details and results? Stay tuned!</p>
        
        {isIOS && (
          <div className="bg-blue-900 border border-blue-700 text-blue-100 px-4 py-3 rounded relative mb-4" role="alert">
            <strong className="font-bold">For iOS Users: </strong>
            <span className="block sm:inline">To enable notifications, please add this website to your Home Screen from the Share menu.</span>
          </div>
        )}

        {subscriptionError && <p className="text-red-400 mb-4">{subscriptionError}</p>}

        <div className="flex justify-end gap-4">
          <button onClick={() => setIsOpen(false)} className="px-4 py-2 rounded text-gray-300 hover:bg-gray-700">
            Maybe Later
          </button>
          <button onClick={subscribeUser} className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded font-semibold">
            Accept
          </button>
        </div>
      </div>
    </div>
  );
}