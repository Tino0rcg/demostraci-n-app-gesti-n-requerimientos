"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { RefreshCcw } from "lucide-react";

export function PullToRefresh({ children }: { children: React.ReactNode }) {
  const [isPulling, setIsPulling] = useState(false);
  const [pullY, setPullY] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const startY = useRef(0);
  const router = useRouter();
  
  const threshold = 90;

  useEffect(() => {
    // Solo activar en dispositivos táctiles
    if (typeof window === 'undefined' || !('ontouchstart' in window)) return;

    const handleTouchStart = (e: TouchEvent) => {
      if (window.scrollY <= 0) {
        startY.current = e.touches[0].clientY;
      } else {
        startY.current = 0;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      // Usar un pequeño margen para scrollY por si iOS tiene rubber banding
      if (startY.current > 0 && window.scrollY <= 5 && !isRefreshing) {
        const y = e.touches[0].clientY;
        const diff = y - startY.current;
        
        // Si desliza hacia abajo (pull down)
        if (diff > 0) {
          if (e.cancelable) {
              e.preventDefault(); // Prevenir el pull-to-refresh nativo del navegador
          }
          const resistanceDiff = diff * 0.55; // Menos resistencia, se siente más fluido
          setPullY(Math.min(resistanceDiff, threshold + 20));
          setIsPulling(true);
        }
      }
    };

    const handleTouchEnd = () => {
      if (pullY >= threshold && !isRefreshing) {
        setIsRefreshing(true);
        
        // El reload nativo es más agresivo y confiable para limpiar estado en PWAs
        window.location.reload();
        
        // Mantener la animación mientras recarga
        setTimeout(() => {
          setIsRefreshing(false);
          setPullY(0);
          setIsPulling(false);
        }, 1200);
      } else {
        // Regresar a 0 si no se alcanzó el límite
        setPullY(0);
        setIsPulling(false);
      }
      startY.current = 0;
    };

    // passive: false permite cancelar el reload nativo usando preventDefault
    document.addEventListener("touchstart", handleTouchStart, { passive: true });
    document.addEventListener("touchmove", handleTouchMove, { passive: false });
    document.addEventListener("touchend", handleTouchEnd, { passive: true });

    return () => {
      document.removeEventListener("touchstart", handleTouchStart);
      document.removeEventListener("touchmove", handleTouchMove);
      document.removeEventListener("touchend", handleTouchEnd);
    };
  }, [pullY, isRefreshing, router]);

  return (
    <>
      <div 
        className="fixed top-0 left-0 w-full flex justify-center items-start z-[100] pointer-events-none transition-transform duration-200"
        style={{ 
          transform: `translateY(${(isPulling || isRefreshing) ? (isRefreshing ? 70 : pullY) : -100}px)`,
          opacity: (isPulling || isRefreshing) ? Math.min(pullY / (threshold - 20), 1) : 0
        }}
      >
        <div className={`p-2.5 rounded-full bg-[#030712]/90 backdrop-blur-xl border border-white/10 shadow-[0_0_20px_rgba(0,180,255,0.15)] flex items-center justify-center ${isRefreshing ? 'animate-spin' : ''}`}>
           <RefreshCcw 
             className="h-5 w-5 text-primary" 
             style={{ transform: isRefreshing ? 'none' : `rotate(${pullY * 4}deg)` }} 
           />
        </div>
      </div>
      {children}
    </>
  );
}
