"use client";

import { useEffect, useState } from "react";
import { savePushSubscriptionAction, getVapidPublicKeyAction } from "@/app/actions/push";
import { Button } from "@/components/ui/button";
import { BellRing, CheckCircle2, Share, AlertTriangle, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const FALLBACK_VAPID_KEY = "BMsrFj0fv6tCbJ6y8-d56gfiAZTDY7AdbkUG4N0wuGfck6yLYkjaJrMXg6krqP2_qoYNysDryVJ8oJ70UFF4VF0";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/\-/g, "+").replace(/_/g, "/");

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function PushManager() {
  const [isMounted, setIsMounted] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isSecure, setIsSecure] = useState(true);
  const [permission, setPermission] = useState<NotificationPermission | "unknown">("unknown");
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    try {
      if (typeof window === "undefined") return;

      setIsMounted(true);
      setIsSecure(window.isSecureContext ?? true);

      const ios =
        /iPad|iPhone|iPod/.test(navigator.userAgent || "") ||
        ((navigator as any).platform === "MacIntel" && ((navigator as any).maxTouchPoints || 0) > 1);

      const standalone =
        (typeof window.matchMedia === "function" && window.matchMedia("(display-mode: standalone)").matches) ||
        (window.navigator as any)?.standalone === true;

      setIsIOS(Boolean(ios));
      setIsStandalone(Boolean(standalone));

      if ("Notification" in window && typeof Notification !== "undefined") {
        try {
          const perm = Notification.permission;
          setPermission(perm);
          if (perm === "granted") {
            silentSubscribe();
          }
        } catch {}
      }
    } catch (e) {
      console.warn("PushManager init warning:", e);
    }
  }, []);

  const silentSubscribe = async () => {
    try {
      if (!("serviceWorker" in navigator)) return;
      const registration = await navigator.serviceWorker.register("/sw.js");
      await navigator.serviceWorker.ready;

      let key = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || FALLBACK_VAPID_KEY;
      const convertedVapidKey = urlBase64ToUint8Array(key);
      let sub = await registration.pushManager.getSubscription();

      if (!sub) {
        sub = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: convertedVapidKey,
        });
      }

      await savePushSubscriptionAction(JSON.parse(JSON.stringify(sub)));
    } catch {
      // Fallo silencioso en fondo
    }
  };

  const handleActivateClick = async () => {
    if (typeof window === "undefined") return;

    try {
      setIsSubscribing(true);

      // Verificación 1: Contexto seguro (HTTPS)
      if (!window.isSecureContext) {
        alert(
          "⚠️ Conexión no segura (HTTP):\n\nLas notificaciones push solo funcionan a través de conexiones seguras (HTTPS). Si estás probando la app por IP local (http://...), el navegador móvil bloquea los permisos de notificación por seguridad."
        );
        return;
      }

      // Verificación 2: Soporte de Notification
      if (!("Notification" in window)) {
        if (isIOS && !isStandalone) {
          alert(
            "📱 En iPhone/iPad es necesario agregar la app a la Pantalla de Inicio:\n\n1. Toca el botón 'Compartir' (⎋) abajo en Safari.\n2. Elige 'Agregar a pantalla de inicio' (➕).\n3. Abre la app desde el nuevo icono para poder activar notificaciones."
          );
        } else {
          alert("Este navegador no tiene soporte para la API de Notificaciones.");
        }
        return;
      }

      // Verificación 3: Permiso previamente bloqueado
      if (Notification.permission === "denied") {
        alert(
          "⚠️ Permisos de notificación bloqueados:\n\nEn este dispositivo las notificaciones fueron desactivadas anteriormente.\n\nPara activarlas:\n• En iPhone: Ve a Ajustes > Notificaciones > OnlineDesk y actívalas.\n• En Android/PC: Toca el icono de candado al lado de la URL y permite las notificaciones."
        );
        return;
      }

      // ⚡ CRÍTICO PARA IOS/SAFARI: Solicitar permiso DIRECTAMENTE en el primer tick del clic
      // (Cualquier 'await' previo rompe el token de gesto de usuario en WebKit)
      let currentPerm: NotificationPermission = Notification.permission;
      if (currentPerm !== "granted") {
        try {
          currentPerm = await Notification.requestPermission();
        } catch {
          // Fallback para navegadores antiguos con callback
          currentPerm = await new Promise<NotificationPermission>((resolve) => {
            Notification.requestPermission((p) => resolve(p));
          });
        }
        setPermission(currentPerm);
      }

      if (currentPerm !== "granted") {
        toast({
          title: "Permiso no concedido",
          description: "No se activaron las notificaciones.",
          variant: "destructive",
        });
        return;
      }

      // Verificación 4: Service Worker
      if (!("serviceWorker" in navigator)) {
        alert("El navegador no soporta Service Workers.");
        return;
      }

      const registration = await navigator.serviceWorker.register("/sw.js");
      await navigator.serviceWorker.ready;

      // Obtener clave pública VAPID
      let key = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || FALLBACK_VAPID_KEY;
      if (!key) {
        const resKey = await getVapidPublicKeyAction();
        if (resKey.success && resKey.publicKey) {
          key = resKey.publicKey;
        }
      }

      const convertedVapidKey = urlBase64ToUint8Array(key);
      let sub = await registration.pushManager.getSubscription();

      if (!sub) {
        sub = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: convertedVapidKey,
        });
      }

      const res = await savePushSubscriptionAction(JSON.parse(JSON.stringify(sub)));
      if (res.success) {
        setDismissed(true);
        toast({
          title: "¡Notificaciones activadas!",
          description: "Recibirás avisos en este celular cuando haya respuestas o cambios de estado.",
        });
      } else {
        alert("Error al vincular el dispositivo: " + (res.error || "Desconocido"));
      }
    } catch (err: any) {
      console.error("Error al suscribir notificaciones:", err);
      alert("Error al suscribir notificaciones: " + (err?.message || JSON.stringify(err)));
    } finally {
      setIsSubscribing(false);
    }
  };

  if (!isMounted || dismissed || permission === "granted") {
    return null;
  }

  // Caso 1: iPhone/iPad abierto en Safari estándar (no standalone)
  if (isIOS && !isStandalone) {
    return (
      <div className="flex-none mb-3 p-3.5 rounded-xl bg-blue-500/10 border border-blue-500/25 shadow-md">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-2.5 min-w-0">
            <div className="h-8 w-8 rounded-full bg-blue-500/20 border border-blue-500/40 flex items-center justify-center shrink-0 mt-0.5">
              <Share className="h-4 w-4 text-blue-400" />
            </div>
            <div className="flex flex-col min-w-0 text-xs">
              <span className="font-bold text-white tracking-wide">
                ¿Deseas notificaciones en tu iPhone?
              </span>
              <span className="text-[11px] text-zinc-300 mt-1 leading-relaxed">
                Apple exige que agregues la app a la pantalla de inicio:
                <br />
                1. Toca el botón <strong className="text-blue-300">Compartir ⎋</strong> abajo en Safari.
                <br />
                2. Selecciona <strong className="text-white">"Agregar a pantalla de inicio" ➕</strong>.
                <br />
                3. Abre la app desde ese nuevo icono para recibir avisos al instante.
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setDismissed(true)}
            className="text-zinc-400 hover:text-white p-1"
            title="Cerrar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  // Caso 2: PWA instalada en iPhone, o celular Android, o PC
  return (
    <div data-tour="push-manager" className="flex-none mb-3 p-3.5 rounded-xl bg-gradient-to-r from-primary/15 via-blue-500/10 to-transparent border border-primary/30 shadow-lg">
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
            onClick={handleActivateClick}
            className="min-h-[36px] px-4 text-xs font-bold bg-primary text-black hover:bg-primary/90 shadow-md cursor-pointer transition-all active:scale-95"
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
