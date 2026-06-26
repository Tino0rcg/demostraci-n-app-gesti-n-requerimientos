"use client";

import { useEffect, useState } from "react";
import { savePushSubscriptionAction } from "@/app/actions/push";
import { Button } from "@/components/ui/button";
import { BellRing } from "lucide-react";

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
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

export function PushManager() {
  const [showPrompt, setShowPrompt] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);

  useEffect(() => {
    // Verificar si ya tiene permisos o si está soportado
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'default') {
        setShowPrompt(true);
      } else if (Notification.permission === 'granted') {
        setIsSubscribed(true);
        // Si ya está concedido, podemos intentar registrar silenciosamente
        subscribeUser(false);
      }
    }
  }, []);

  const subscribeUser = async (requestPermission: boolean = true) => {
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js');
        
        if (requestPermission) {
            // iOS REQUERIMIENTO: requestPermission debe ser llamado por un clic del usuario
            const permission = await Notification.requestPermission();
            if (permission !== 'granted') {
                setShowPrompt(false);
                return;
            }
        }

        const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
        if (!vapidPublicKey) return;

        const convertedVapidKey = urlBase64ToUint8Array(vapidPublicKey);

        let subscription = await registration.pushManager.getSubscription();
        
        if (!subscription) {
          subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: convertedVapidKey
          });
        }

        await savePushSubscriptionAction(JSON.parse(JSON.stringify(subscription)));
        setShowPrompt(false);
        setIsSubscribed(true);

      } catch (error) {
        console.error('Error suscribiendo a push:', error);
      }
    }
  };

  if (!showPrompt || isSubscribed) return null;

  return (
    <div className="bg-primary/10 border border-primary/20 p-3 rounded-lg flex items-center justify-between mb-4 w-full glass-panel">
        <div className="flex items-center gap-3">
            <div className="bg-primary/20 p-2 rounded-full">
                <BellRing className="h-4 w-4 text-primary animate-pulse" />
            </div>
            <div>
                <p className="text-sm font-bold text-white">Activar notificaciones</p>
                <p className="text-xs text-zinc-400">Recibe alertas al instante en este dispositivo.</p>
            </div>
        </div>
        <Button size="sm" onClick={() => subscribeUser(true)} className="bg-primary text-black font-bold hover:bg-primary/90">
            Activar
        </Button>
    </div>
  );
}
