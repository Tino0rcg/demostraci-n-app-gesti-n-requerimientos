"use client";

import { useEffect, useState } from "react";
import { savePushSubscriptionAction } from "@/app/actions/push";
import { Button } from "@/components/ui/button";
import { BellRing, CheckCircle2, Share, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

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
  const [supported, setSupported] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission | 'unknown'>('unknown');
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const ios = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    const standalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone === true;
    
    setIsIOS(ios);
    setIsStandalone(Boolean(standalone));

    const hasPushSupport = 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
    setSupported(hasPushSupport);

    if ('Notification' in window) {
      setPermission(Notification.permission);
      if (Notification.permission === 'granted') {
        // Renovar silenciosamente la suscripción si ya está autorizado
        registerAndSubscribe(false);
      }
    }
  }, []);

  const registerAndSubscribe = async (userGesture: boolean) => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;

    try {
      if (userGesture) setIsSubscribing(true);

      const registration = await navigator.serviceWorker.register('/sw.js');
      await navigator.serviceWorker.ready;

      let currentPerm = Notification.permission;
      if (userGesture && currentPerm !== 'granted') {
        currentPerm = await Notification.requestPermission();
        setPermission(currentPerm);
      }

      if (currentPerm !== 'granted') {
        if (userGesture) {
          toast({
            title: "Permiso denegado",
            description: "No se otorgaron permisos para enviar notificaciones.",
            variant: "destructive"
          });
        }
        return;
      }

      const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!vapidPublicKey) {
        console.warn("Falta NEXT_PUBLIC_VAPID_PUBLIC_KEY");
        return;
      }

      const convertedVapidKey = urlBase64ToUint8Array(vapidPublicKey);
      let sub = await registration.pushManager.getSubscription();

      if (!sub) {
        sub = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: convertedVapidKey
        });
      }

      const res = await savePushSubscriptionAction(JSON.parse(JSON.stringify(sub)));
      if (res.success && userGesture) {
        toast({
          title: "¡Notificaciones activadas!",
          description: "Recibirás alertas en este celular cuando haya novedades en tus tickets."
        });
      }
    } catch (err: any) {
      console.error("Error al registrar notificaciones push:", err);
      if (userGesture) {
        toast({
          title: "Error de activación",
          description: err?.message || "No se pudo activar las notificaciones.",
          variant: "destructive"
        });
      }
    } finally {
      if (userGesture) setIsSubscribing(false);
    }
  };

  if (dismissed || permission === 'granted') {
    return null;
  }

  // Caso 1: Usuario en iPhone pero aún en Safari pestaña normal (debe añadir a pantalla de inicio primero)
  if (isIOS && !isStandalone) {
    return (
      <div className="flex-none mb-3 p-3 rounded-xl bg-blue-500/10 border border-blue-500/25 shadow-md">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-2.5 min-w-0">
            <div className="h-8 w-8 rounded-full bg-blue-500/20 border border-blue-500/40 flex items-center justify-center shrink-0 mt-0.5">
              <Share className="h-4 w-4 text-blue-400" />
            </div>
            <div className="flex flex-col min-w-0 text-xs">
              <span className="font-bold text-white tracking-wide">
                ¿Deseas notificaciones en tu iPhone?
              </span>
              <span className="text-[11px] text-zinc-300 mt-0.5 leading-relaxed">
                Toca el botón <strong className="text-blue-300">Compartir ⎋</strong> abajo en Safari y selecciona <strong className="text-white">"Agregar a pantalla de inicio" ➕</strong>. Ábrela desde allí para recibir alertas.
              </span>
            </div>
          </div>
          <button 
            type="button" 
            onClick={() => setDismissed(true)} 
            className="text-zinc-400 hover:text-white p-1"
            title="Cerrar"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    );
  }

  // Caso 2: Android, Desktop o iPhone PWA (permiso aún no concedido)
  return (
    <div className="flex-none mb-3 p-3 rounded-xl bg-gradient-to-r from-primary/15 via-blue-500/10 to-transparent border border-primary/30 shadow-lg">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="h-8 w-8 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center shrink-0">
            <BellRing className="h-4 w-4 text-primary animate-pulse" />
          </div>
          <div className="flex flex-col min-w-0 text-xs">
            <span className="font-bold text-white tracking-wide">
              Activar notificaciones en este celular
            </span>
            <span className="text-[11px] text-zinc-400">
              Recibe avisos inmediatos cuando el técnico responda o cambie el estado de tus requerimientos.
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button
            size="sm"
            disabled={isSubscribing}
            onClick={() => registerAndSubscribe(true)}
            className="min-h-[36px] px-3.5 text-xs font-bold bg-primary text-black hover:bg-primary/90 shadow-md cursor-pointer"
          >
            {isSubscribing ? "Activando..." : "Activar Notificaciones"}
          </Button>
          <button 
            type="button" 
            onClick={() => setDismissed(true)} 
            className="text-zinc-500 hover:text-zinc-300 p-1.5"
            title="Ahora no"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
