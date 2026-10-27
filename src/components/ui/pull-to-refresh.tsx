"use client";

import React, { useState, useEffect, useRef } from "react";
import { RefreshCcw } from "lucide-react";

interface PullToRefreshProps {
  children: React.ReactNode;
}

/**
 * Componente Pull-to-Refresh inteligente para dispositivos móviles.
 * Activo en vistas principales cuando el usuario está en la parte superior (scrollY <= 0).
 * Se deshabilita AUTOMÁTICAMENTE cuando:
 * 1. Hay un chat o modal/sheet abierto en pantalla.
 * 2. El usuario toca dentro de un contenedor con scroll interno (mensajes de chat, tablas, etc.).
 * 3. Se interactúa con campos de texto, botones o controles.
 */
export function PullToRefresh({ children }: { children: React.ReactNode }) {
  const [isPulling, setIsPulling] = useState(false);
  const [pullY, setPullY] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const startY = useRef<number | null>(null);
  const isEligible = useRef(false);

  const threshold = 85;

  useEffect(() => {
    // Solo operar en entornos con soporte táctil
    if (typeof window === "undefined" || !("ontouchstart" in window)) return;

    // Función que verifica si el gesto debe ser ignorado (por estar en chat, modal o scroll interno)
    const isExcluded = (target: HTMLElement | null): boolean => {
      // 1. Si existe cualquier modal, Sheet, Dialog o chat activo en el DOM
      const hasActiveModalOrChat = document.querySelector(
        '[role="dialog"], [data-no-pull-to-refresh="true"], [data-chat-container="true"], [data-chat-messages="true"], [data-radix-portal]'
      );
      if (hasActiveModalOrChat) return true;

      if (!target) return true;

      // 2. Si el toque ocurrió dentro de un componente excluido
      const insideExcluded = target.closest(
        '[role="dialog"], [data-no-pull-to-refresh="true"], [data-chat-container="true"], [data-chat-messages="true"], textarea, input, select, button'
      );
      if (insideExcluded) return true;

      // 3. Si el toque ocurrió dentro de un contenedor con scroll interno
      let current: HTMLElement | null = target;
      while (current && current !== document.body && current !== document.documentElement) {
        const style = window.getComputedStyle(current);
        if (
          (style.overflowY === "auto" || style.overflowY === "scroll") &&
          current.scrollHeight > current.clientHeight
        ) {
          return true;
        }
        current = current.parentElement;
      }

      return false;
    };

    const handleTouchStart = (e: TouchEvent) => {
      // Un solo dedo y no estar refrescando
      if (e.touches.length !== 1 || isRefreshing) {
        isEligible.current = false;
        startY.current = null;
        return;
      }

      const target = e.target as HTMLElement | null;

      // Exclusión total si estamos en chat, modal o scroll interno
      if (isExcluded(target)) {
        isEligible.current = false;
        startY.current = null;
        return;
      }

      // Solo si estamos exactamente en la parte superior de la página
      if (window.scrollY <= 0) {
        startY.current = e.touches[0].clientY;
        isEligible.current = true;
      } else {
        isEligible.current = false;
        startY.current = null;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isEligible.current || startY.current === null || isRefreshing) return;

      // Doble comprobación: si se abrió un modal o la página se desplazó, cancelar
      const target = e.target as HTMLElement | null;
      if (isExcluded(target) || window.scrollY > 0) {
        isEligible.current = false;
        startY.current = null;
        setIsPulling(false);
        setPullY(0);
        return;
      }

      const currentY = e.touches[0].clientY;
      const diff = currentY - startY.current;

      // Si el dedo va hacia arriba (scroll normal hacia abajo de la página), cancelar pull
      if (diff <= 0) {
        isEligible.current = false;
        startY.current = null;
        setIsPulling(false);
        setPullY(0);
        return;
      }

      // Si arrastra hacia abajo desde el tope absoluto de la página principal
      if (diff > 5) {
        if (e.cancelable) {
          e.preventDefault();
        }
        const resistance = diff * 0.45;
        const boundedY = Math.min(resistance, threshold + 25);
        setPullY(boundedY);
        setIsPulling(true);
      }
    };

    const handleTouchEnd = () => {
      if (!isEligible.current || startY.current === null) {
        isEligible.current = false;
        startY.current = null;
        return;
      }

      if (pullY >= threshold && !isRefreshing) {
        setIsRefreshing(true);
        setIsPulling(false);
        setPullY(65); // Mantener el indicador visible girando

        setTimeout(() => {
          window.location.reload();
        }, 300);
      } else {
        setIsPulling(false);
        setPullY(0);
      }

      isEligible.current = false;
      startY.current = null;
    };

    // passive: false solo en touchmove para poder cancelar el rebote del navegador con e.preventDefault()
    document.addEventListener("touchstart", handleTouchStart, { passive: true });
    document.addEventListener("touchmove", handleTouchMove, { passive: false });
    document.addEventListener("touchend", handleTouchEnd, { passive: true });
    document.addEventListener("touchcancel", handleTouchEnd, { passive: true });

    return () => {
      document.removeEventListener("touchstart", handleTouchStart);
      document.removeEventListener("touchmove", handleTouchMove);
      document.removeEventListener("touchend", handleTouchEnd);
      document.removeEventListener("touchcancel", handleTouchEnd);
    };
  }, [pullY, isRefreshing]);

  return (
    <>
      {/* Indicador animado de Pull to Refresh */}
      <div
        className="fixed top-0 left-0 w-full flex justify-center items-start z-[100] pointer-events-none transition-transform duration-200"
        style={{
          transform: `translateY(${
            isPulling || isRefreshing ? (isRefreshing ? 60 : pullY) : -90
          }px)`,
          opacity: isPulling || isRefreshing ? Math.min(pullY / 45, 1) : 0,
        }}
      >
        <div
          className={`p-2.5 rounded-full bg-[#030712]/95 backdrop-blur-xl border border-white/10 shadow-[0_0_24px_rgba(0,180,255,0.25)] flex items-center justify-center ${
            isRefreshing ? "animate-spin" : ""
          }`}
        >
          <RefreshCcw
            className="h-5 w-5 text-primary transition-transform"
            style={{
              transform: isRefreshing ? "none" : `rotate(${pullY * 4}deg)`,
            }}
          />
        </div>
      </div>
      {children}
    </>
  );
}
