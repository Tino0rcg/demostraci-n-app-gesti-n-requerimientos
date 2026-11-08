"use client";

import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { 
  Sparkles, 
  ChevronLeft, 
  ChevronRight, 
  X, 
  CheckCircle2, 
  Clock, 
  MessageSquare, 
  BarChart3, 
  BellRing, 
  MousePointerClick, 
  Timer,
  ShieldCheck,
  Building2,
  Wrench,
  BriefcaseBusiness,
  Archive,
  Layers,
  ArrowRight,
  Zap,
  Check
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface TourStep {
  id: string;
  badge: string;
  badgeColor: string;
  title: string;
  targetSelector?: string;
  actionText: string;
  detail: string;
  autoOpenTicket?: boolean;
  autoCloseTicket?: boolean;
  specialShowcase?: "sla" | "chat" | "triage";
}

const STEPS: TourStep[] = [
  // PASO 1: BIENVENIDA Y ROLES
  {
    id: "step-1",
    badge: "Inicio • Rol Administrador Full",
    badgeColor: "bg-sky-500/10 text-sky-400 border-sky-500/30",
    title: "1. Panel de Bienvenida y Roles de Usuario",
    targetSelector: '[data-tour="tour-user-profile"]',
    actionText: "Observa tu perfil corporativo en la cabecera",
    detail: "Estás conectado como Administrador Full con control total sobre requerimientos, acuerdos de nivel de servicio (SLA/ANS), catálogo de soluciones, directorio técnico y empresas cliente contratantes.",
    autoCloseTicket: true
  },
  // PASO 2: KANBAN BOARD EN TIEMPO REAL
  {
    id: "step-2",
    badge: "Supervisión en Tiempo Real",
    badgeColor: "bg-indigo-500/10 text-indigo-400 border-indigo-500/30",
    title: "2. Tablero de Control Kanban (4 Estados)",
    targetSelector: '[data-tour="kanban-board"], [data-tour="kanban-board-mobile"]',
    actionText: "Visualiza el flujo de trabajo de izquierda a derecha",
    detail: "Las solicitudes avanzan por 4 estados: Ingresado, En proceso, Espera de aprobación y Terminado. El tablero se actualiza al instante en segundo plano vía WebSockets sin recargar la página.",
    autoCloseTicket: true
  },
  // PASO 3: MOTOR DE SLA Y SEMAFORIZACIÓN
  {
    id: "step-3",
    badge: "Motor de SLA Contractual",
    badgeColor: "bg-amber-500/10 text-amber-400 border-amber-500/30",
    title: "3. Semáforo y Tiempos de Compromiso (SLA)",
    targetSelector: '[data-tour="sla-indicator"], [data-tour="ticket-card"]',
    actionText: "Revisa el punto de color junto al folio # del requerimiento",
    detail: "Cada requerimiento tiene un cronómetro legal según el contrato de la empresa. El semáforo avisa la urgencia: Verde (a tiempo, <70%), Amarillo (en riesgo preventivo, 70-100%) y Rojo (plazo excedido / incumplimiento de ANS).",
    autoCloseTicket: true
  },
  // PASO 4: FICHA LATERAL INTERACTIVA
  {
    id: "step-4",
    badge: "Ficha Técnica Interactiva",
    badgeColor: "bg-blue-500/10 text-blue-400 border-blue-500/30",
    title: "4. Detalle del Requerimiento en Panel Lateral",
    targetSelector: '[data-tour="ticket-card"]',
    actionText: "Pulsa sobre esta tarjeta para desplegar la ficha completa",
    detail: "Al hacer clic en cualquier requerimiento se despliega un panel lateral optimizado para computadores y pantallas táctiles con el historial, solicitante, técnico responsable y chat en vivo.",
    autoOpenTicket: true
  },
  // PASO 5: PAUSA INTELIGENTE DEL SLA
  {
    id: "step-5",
    badge: "Función Estrella • SLA Inteligente",
    badgeColor: "bg-purple-500/10 text-purple-400 border-purple-500/30",
    title: "5. Cronómetro con Pausa Inteligente",
    targetSelector: '[data-tour="ticket-sla-timer"]',
    actionText: "Observa el reloj en la cabecera del requerimiento",
    detail: "¡Pausa justa de evaluación! Cuando el técnico concluye la solución y pasa el caso a 'Espera de aprobación', el cronómetro se congela automáticamente. El tiempo que el cliente demore en revisar no castiga la puntualidad ni la evaluación del técnico.",
    autoOpenTicket: true,
    specialShowcase: "sla"
  },
  // PASO 6: CHAT EN VIVO DE 0MS
  {
    id: "step-6",
    badge: "Comunicación Inmediata",
    badgeColor: "bg-cyan-500/10 text-cyan-400 border-cyan-500/30",
    title: "6. Chat en Vivo de Latencia Cero (0ms)",
    targetSelector: '[data-tour="ticket-chat-area"]',
    actionText: "Escribe una respuesta o consulta en la bitácora",
    detail: "Entrega instantánea con interfaz optimista (0ms en pantalla) y transmisión por WebSockets. Incluye aviso sonoro, indicador de 'escribiendo...' en tiempo real y registro inmutable de auditoría para ambas partes.",
    autoOpenTicket: true,
    specialShowcase: "chat"
  },
  // PASO 7: DOBLE APROBACIÓN FORMAL
  {
    id: "step-7",
    badge: "Control de Calidad • Aprobación Dual",
    badgeColor: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
    title: "7. Flujo de Aprobación Formal del Cliente",
    targetSelector: '[data-tour="ticket-approval-actions"], [data-tour="ticket-chat-area"]',
    actionText: "El cliente valida con 'Aprobar' o 'Rechazar'",
    detail: "Garantía contractual de conformidad: Un ticket solo se da por 'Terminado' cuando el cliente valida la solución. Si la rechaza, debe registrar el motivo y el ticket vuelve automáticamente a 'En proceso' reactivando el SLA.",
    autoOpenTicket: true
  },
  // PASO 8: CREACIÓN DE TICKET Y TRIAJE CON IA
  {
    id: "step-8",
    badge: "Inteligencia Operativa",
    badgeColor: "bg-fuchsia-500/10 text-fuchsia-400 border-fuchsia-500/30",
    title: "8. Botón '+ Nuevo Ticket' & Triaje con IA",
    targetSelector: '[data-tour="new-ticket-btn"], [data-tour="new-ticket-sidebar-btn"]',
    actionText: "Haz clic aquí para ingresar una solicitud bajo SLA",
    detail: "Permite al cliente o supervisor reportar incidentes con evidencia fotográfica. El algoritmo de triaje analiza la categoría de la falla (Redes, Software, Equipos TI) y asigna automáticamente al especialista disponible con menor carga de trabajo.",
    autoCloseTicket: true,
    specialShowcase: "triage"
  },
  // PASO 9: DIRECTORIO Y CAPACIDAD TÉCNICA
  {
    id: "step-9",
    badge: "Supervisión de Cuadrilla",
    badgeColor: "bg-blue-500/10 text-blue-400 border-blue-500/30",
    title: "9. Directorio y Capacidad Técnica",
    targetSelector: '[data-tour="nav-tecnicos"]',
    actionText: "Pulsa en 'Técnicos de Soporte' en el menú",
    detail: "Supervisa la carga de trabajo activa de cada técnico, sus especialidades certificadas, su estado (Disponible, En Terreno, Fuera de turno) y su calificación de satisfacción CSAT (1.0 a 5.0 estrellas).",
    autoCloseTicket: true
  },
  // PASO 10: CLIENTES Y EMPRESAS MULTI-TENANT
  {
    id: "step-10",
    badge: "Multi-Empresa & B2B",
    badgeColor: "bg-amber-500/10 text-amber-400 border-amber-500/30",
    title: "10. Clientes y Empresas Multi-Tenant",
    targetSelector: '[data-tour="nav-clientes"]',
    actionText: "Explora el módulo de 'Clientes y Empresas'",
    detail: "Permite gestionar múltiples empresas cliente de forma aislada y segura. Cada cliente solo visualiza los requerimientos y métricas de su propia organización con soporte para Administradores de Empresa.",
    autoCloseTicket: true
  },
  // PASO 11: CATÁLOGO DE SERVICIOS
  {
    id: "step-11",
    badge: "ANS & Catálogo TI",
    badgeColor: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
    title: "11. Catálogo de Servicios Contractuales",
    targetSelector: '[data-tour="nav-servicios"]',
    actionText: "Revisa la lista de servicios y tiempos máximos",
    detail: "Define los compromisos de atención por servicio: horas máximas de resolución y tiempos de primera respuesta (ej: 4h para fallas críticas de servidor vs 24h para configuraciones estándar).",
    autoCloseTicket: true
  },
  // PASO 12: HISTORIAL CENTRALIZADO
  {
    id: "step-12",
    badge: "Trazabilidad y Auditoría",
    badgeColor: "bg-slate-500/10 text-slate-300 border-slate-500/30",
    title: "12. Historial Centralizado y Búsqueda Predictiva",
    targetSelector: '[data-tour="nav-historial"]',
    actionText: "Consulta el archivo histórico de requerimientos",
    detail: "Buscador predictivo por folio #, cliente o técnico. Permite auditar qué sucedió en cada caso, el tiempo exacto que tomó resolverlo y descargar el informe formal para cobros o auditorías.",
    autoCloseTicket: true
  },
  // PASO 13: CUADRO DE MANDO EJECUTIVO (BI)
  {
    id: "step-13",
    badge: "Business Intelligence",
    badgeColor: "bg-purple-500/10 text-purple-400 border-purple-500/30",
    title: "13. Cuadro de Mando Ejecutivo & Analítica ANS",
    targetSelector: '[data-tour="nav-dashboards"]',
    actionText: "Haz clic en 'Métricas y Análisis' para ver gráficos",
    detail: "Tablero analítico con gráficos interactivos que audita el porcentaje de cumplimiento de SLA (verde/rojo), distribución de demanda por empresa cliente, técnicos más productivos y proyección de eficiencia.",
    autoCloseTicket: true
  },
  // PASO 14: PWA Y PUSH
  {
    id: "step-14",
    badge: "Movilidad Extrema",
    badgeColor: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
    title: "14. Aplicación Web Progresiva (PWA) & Push",
    targetSelector: '[data-tour="push-manager"]',
    actionText: "Activa las notificaciones en tu celular",
    detail: "La plataforma funciona en celulares iPhone y Android como una aplicación instalable, enviando alertas sonoras y vibratorias en tiempo real vía Web Push VAPID sin intermediarios.",
    autoCloseTicket: true
  },
  // PASO 15: FIN DEL TOUR
  {
    id: "step-15",
    badge: "100% Operativo",
    badgeColor: "bg-sky-500/10 text-sky-400 border-sky-500/30",
    title: "15. ¡Recorrido Completo! Operación en Vivo Activada",
    targetSelector: '[data-tour="kanban-board"], [data-tour="kanban-board-mobile"]',
    actionText: "Ya puedes interactuar con libertad en la plataforma",
    detail: "El recorrido guiado ha concluido con éxito. Puedes mover requerimientos, registrar nuevas solicitudes, interactuar en el chat en vivo o relanzar este tour en cualquier momento desde el botón flotante inferior.",
    autoCloseTicket: true
  }
];

export function TourGuide() {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [targetRect, setTargetRect] = useState<{ top: number; left: number; width: number; height: number; bottom: number; right: number } | null>(null);
  const [pillVisible, setPillVisible] = useState(true);
  const { toast } = useToast();

  const handleClose = useCallback(() => {
    setIsOpen(false);
    setTargetRect(null);

    if (typeof window !== "undefined") {
      sessionStorage.setItem("onlinedesk_tour_seen", "true");
      const url = new URL(window.location.href);
      url.searchParams.delete("tour");
      url.searchParams.delete("step");
      url.searchParams.delete("demo");
      window.history.replaceState(null, "", url.toString());
    }

    toast({
      title: "✨ Operación Normal Activada",
      description: "Tour finalizado. Ahora puedes explorar, gestionar requerimientos, chatear y operar con total libertad."
    });
  }, [toast]);

  const handleStartTour = useCallback((startIndex = 0) => {
    const validIndex = Math.max(0, Math.min(startIndex, STEPS.length - 1));
    setCurrentStep(validIndex);
    setIsOpen(true);
  }, []);

  const handleNext = useCallback(() => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      handleClose();
    }
  }, [currentStep, handleClose]);

  const handlePrev = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  }, [currentStep]);

  // Verificar URL al montar (?tour=true o ?demo=true o ?step=X)
  useEffect(() => {
    if (typeof window === "undefined") return;

    const params = new URLSearchParams(window.location.search);
    const hasTourParam = params.get("tour") === "true" || params.get("demo") === "true";
    const stepParam = params.get("step");
    const parsedStep = stepParam ? parseInt(stepParam, 10) - 1 : 0;
    const initialIndex = Math.max(0, Math.min(parsedStep, STEPS.length - 1));

    if (hasTourParam) {
      const timer = setTimeout(() => {
        handleStartTour(initialIndex);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [handleStartTour]);

  // Manejar apertura o cierre automático del cajón de ticket según el paso
  useEffect(() => {
    if (!isOpen) return;

    const step = STEPS[currentStep];
    if (!step) return;

    if (step.autoOpenTicket) {
      // Si el ticket aún no está abierto, hacer clic en el primer ticket del tablero
      const isSheetOpen = Boolean(document.querySelector('[role="dialog"]') || document.querySelector('[data-chat-container="true"]'));
      if (!isSheetOpen) {
        const firstCard = document.querySelector('[data-tour="ticket-card"]') as HTMLElement;
        if (firstCard) {
          firstCard.click();
        }
      }
    } else if (step.autoCloseTicket) {
      // Si el cajón de ticket está abierto, cerrarlo para ver el fondo general
      const isSheetOpen = Boolean(document.querySelector('[role="dialog"]') || document.querySelector('[data-chat-container="true"]'));
      if (isSheetOpen) {
        // Simular clic en el botón de cerrar del sheet o presionar Escape
        const closeBtn = document.querySelector('button[aria-label="Close"]') as HTMLElement;
        if (closeBtn) {
          closeBtn.click();
        } else {
          window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
        }
      }
    }
  }, [isOpen, currentStep]);

  // Medir y enfocar el elemento destacado
  useEffect(() => {
    if (!isOpen) {
      setTargetRect(null);
      return;
    }

    const step = STEPS[currentStep];

    const updateRect = () => {
      if (!step.targetSelector) {
        setTargetRect(null);
        return;
      }

      // Buscar el selector en el documento (soporta selectores compuestos)
      const el = document.querySelector(step.targetSelector) as HTMLElement | null;
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center", inline: "nearest" });
        const rect = el.getBoundingClientRect();
        setTargetRect({
          top: rect.top,
          left: rect.left,
          width: rect.width,
          height: rect.height,
          bottom: rect.bottom,
          right: rect.right
        });
      } else {
        setTargetRect(null);
      }
    };

    // Tiempo prudente para dar margen a animaciones y renderizado del DOM
    const timer = setTimeout(updateRect, 220);

    const onScrollOrResize = () => {
      if (!step.targetSelector) return;
      const el = document.querySelector(step.targetSelector) as HTMLElement | null;
      if (el) {
        const rect = el.getBoundingClientRect();
        setTargetRect({
          top: rect.top,
          left: rect.left,
          width: rect.width,
          height: rect.height,
          bottom: rect.bottom,
          right: rect.right
        });
      }
    };

    window.addEventListener("scroll", onScrollOrResize, { passive: true });
    window.addEventListener("resize", onScrollOrResize);

    return () => {
      clearTimeout(timer);
      window.removeEventListener("scroll", onScrollOrResize);
      window.removeEventListener("resize", onScrollOrResize);
    };
  }, [isOpen, currentStep]);

  // Navegación por teclado
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") handleNext();
      if (e.key === "ArrowLeft") handlePrev();
      if (e.key === "Escape") handleClose();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, handleNext, handlePrev, handleClose]);

  const step = STEPS[currentStep];
  const progressPercent = Math.round(((currentStep + 1) / STEPS.length) * 100);

  // Posicionamiento dinámico del popover anclado con flecha indicadora
  const popoverPosition = useMemo(() => {
    if (typeof window === "undefined") {
      return { top: 100, left: 20, width: 380, placement: "bottom" as const, arrowLeft: 50 };
    }

    const isMobile = window.innerWidth < 768;
    const popoverWidth = isMobile ? Math.min(window.innerWidth - 24, 380) : 410;
    const estimatedHeight = step?.specialShowcase ? 380 : 260;

    if (!targetRect) {
      // Centrar en pantalla si no hay elemento target disponible
      return {
        top: Math.max(20, (window.innerHeight - estimatedHeight) / 2),
        left: Math.max(12, (window.innerWidth - popoverWidth) / 2),
        width: popoverWidth,
        placement: "center" as const,
        arrowLeft: popoverWidth / 2
      };
    }

    const spaceBelow = window.innerHeight - targetRect.bottom;
    const spaceAbove = targetRect.top;

    let placement: "bottom" | "top" = "bottom";
    let top = targetRect.bottom + 14;

    if (spaceBelow < estimatedHeight + 16 && spaceAbove > estimatedHeight + 16) {
      placement = "top";
      top = targetRect.top - estimatedHeight - 14;
    } else if (spaceBelow < estimatedHeight + 16 && spaceAbove < estimatedHeight + 16) {
      // Pantalla pequeña o elemento alto: fijar al borde inferior visible
      top = Math.max(16, window.innerHeight - estimatedHeight - 16);
      placement = "bottom";
    }

    let left = targetRect.left + targetRect.width / 2 - popoverWidth / 2;
    // Evitar que se desborde del viewport
    left = Math.max(12, Math.min(window.innerWidth - popoverWidth - 12, left));

    // Flecha apunta exactamente al centro del elemento destacado
    const arrowLeft = Math.max(24, Math.min(popoverWidth - 24, targetRect.left + targetRect.width / 2 - left));

    return {
      top,
      left,
      width: popoverWidth,
      placement,
      arrowLeft
    };
  }, [targetRect, step?.specialShowcase]);

  return (
    <>
      {/* Botón Flotante Permanente para Iniciar Tour (Presentación de Portafolio) */}
      {!isOpen && pillVisible && (
        <div id="tour-floating-btn" className="fixed bottom-20 sm:bottom-6 right-4 sm:right-6 z-40 animate-fade-in flex items-center gap-1.5 p-1 rounded-full bg-zinc-950/90 border border-primary/40 shadow-[0_0_25px_rgba(59,130,246,0.25)] backdrop-blur-md">
          <Button
            onClick={() => handleStartTour(0)}
            className="rounded-full bg-gradient-to-r from-primary to-blue-500 hover:opacity-95 text-black font-black text-xs px-4 h-9 gap-2 shadow-lg cursor-pointer tracking-tight active:scale-95 transition-all"
            title="Iniciar Recorrido Guiado Paso a Paso (15 Etapas)"
          >
            <Sparkles className="w-3.5 h-3.5 text-black animate-pulse" />
            <span>✨ Tour Guiado (15 Pasos)</span>
          </Button>
          <button
            type="button"
            onClick={() => setPillVisible(false)}
            title="Ocultar acceso de presentación"
            className="text-zinc-500 hover:text-zinc-300 p-1.5 rounded-full hover:bg-white/5 transition-colors cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Capa de Tour Interactivo (Overlay) */}
      {isOpen && (
        <div className="fixed inset-0 z-[10000] pointer-events-none">
          {/* Fondo interactivo: clic en cualquier zona oscura para salir */}
          <div
            onClick={handleClose}
            className="fixed inset-0 z-30 pointer-events-auto cursor-pointer"
            title="Haz clic en cualquier zona oscura para salir del tour y usar la app libremente"
          />

          {/* Halo de luz / Spotlight NO oscilante (fondo sólido y estable sin parpadeo) */}
          {targetRect ? (
            <>
              {/* Corte con sombra estática de 9999px (sin animate-pulse para evitar titileo) */}
              <div
                style={{
                  top: Math.max(0, targetRect.top - 6),
                  left: Math.max(0, targetRect.left - 6),
                  width: targetRect.width + 12,
                  height: targetRect.height + 12,
                  boxShadow: "0 0 0 9999px rgba(9, 9, 11, 0.82), 0 0 25px rgba(59, 130, 246, 0.4)",
                  borderRadius: "16px",
                  border: "2px solid rgba(59, 130, 246, 0.9)"
                }}
                className="fixed z-40 pointer-events-none transition-all duration-300 ease-out"
              />

              {/* Indicador de clic directo sobre el elemento */}
              <div
                style={{
                  top: Math.max(8, targetRect.top - 24),
                  left: Math.min(window.innerWidth - 110, Math.max(10, targetRect.left + targetRect.width / 2 - 50))
                }}
                className="fixed z-50 pointer-events-none flex flex-col items-center transition-all duration-300 ease-out"
              >
                <div className="bg-primary text-black font-black text-[10px] tracking-tight px-3 py-0.5 rounded-full shadow-xl border border-primary/50 flex items-center gap-1.5 whitespace-nowrap">
                  <MousePointerClick size={12} className="text-black" />
                  <span>Haz clic aquí</span>
                </div>
              </div>
            </>
          ) : (
            /* Fondo oscuro estable si el selector no está en el viewport */
            <div className="fixed inset-0 z-40 bg-zinc-950/85 pointer-events-none transition-opacity duration-300" />
          )}

          {/* Tarjeta flotante anclada con flecha indicadora */}
          <div
            style={{
              top: `${popoverPosition.top}px`,
              left: `${popoverPosition.left}px`,
              width: `${popoverPosition.width}px`
            }}
            className="fixed z-50 pointer-events-auto bg-[#0d121c] text-white rounded-2xl shadow-[0_25px_60px_rgba(0,0,0,0.6)] border border-primary/40 overflow-hidden flex flex-col transition-all duration-300 backdrop-blur-xl animate-in zoom-in-95 duration-200"
          >
            {/* Flecha apuntando al elemento destacado */}
            {popoverPosition.placement === "bottom" && (
              <div
                style={{ left: `${popoverPosition.arrowLeft}px` }}
                className="absolute -top-1.5 w-3 h-3 bg-[#0d121c] border-t border-l border-primary/40 rotate-45 transform -translate-x-1/2 z-20"
              />
            )}
            {popoverPosition.placement === "top" && (
              <div
                style={{ left: `${popoverPosition.arrowLeft}px` }}
                className="absolute -bottom-1.5 w-3 h-3 bg-[#0d121c] border-b border-r border-primary/40 rotate-45 transform -translate-x-1/2 z-20"
              />
            )}

            {/* Encabezado del Popover */}
            <div className="bg-gradient-to-r from-zinc-950 to-zinc-900 border-b border-white/10 px-4 py-2.5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="flex h-2 w-2 rounded-full bg-primary animate-ping" />
                <span className="font-black text-[11px] tracking-wider uppercase text-zinc-300">
                  Paso {currentStep + 1} de {STEPS.length}
                </span>
              </div>
              <button
                type="button"
                onClick={handleClose}
                className="text-zinc-400 hover:text-white hover:bg-white/10 rounded-full p-1 transition-colors flex items-center gap-1 text-[11px] font-bold cursor-pointer"
                title="Cerrar tour y operar con libertad"
              >
                <span className="hidden sm:inline">Cerrar</span>
                <X size={14} />
              </button>
            </div>

            {/* Barra de progreso */}
            <div className="w-full bg-white/5 h-1">
              <div
                className="bg-gradient-to-r from-primary to-blue-500 h-1 transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            {/* Cuerpo del Popover */}
            <div className="p-4 space-y-2.5 max-h-[62vh] overflow-y-auto custom-scrollbar">
              {/* Badge de Categoría y Porcentaje */}
              <div className="flex items-center justify-between">
                <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${step.badgeColor}`}>
                  {step.badge}
                </span>
                <span className="text-[10px] font-mono font-bold text-zinc-400">
                  {progressPercent}% completado
                </span>
              </div>

              {/* Título del Paso */}
              <h3 className="text-sm sm:text-base font-black text-white tracking-tight leading-snug">
                {step.title}
              </h3>

              {/* Instrucción Accionable en Caja Ámbar */}
              <div className="bg-amber-500/10 border border-amber-500/25 rounded-xl p-2.5 text-xs text-amber-300 font-bold flex items-start gap-2 shadow-inner">
                <span className="shrink-0 text-sm">👉</span>
                <span className="leading-snug">{step.actionText}</span>
              </div>

              {/* Detalle Operativo para No-Técnicos / Evaluadores */}
              <p className="text-xs text-zinc-300 leading-relaxed font-normal">
                {step.detail}
              </p>

              {/* SHOWCASE ESPECIAL 1: MOTOR DE SLA Y PAUSA */}
              {step.specialShowcase === "sla" && (
                <div className="bg-black/40 border border-purple-500/30 rounded-xl p-3 space-y-2 text-xs">
                  <div className="font-black text-purple-300 uppercase tracking-wider flex items-center gap-1.5 text-[11px]">
                    <Clock size={14} className="text-purple-400" />
                    <span>Lógica de Congelamiento del ANS (SLA):</span>
                  </div>
                  <div className="grid grid-cols-2 gap-1.5 text-[10px]">
                    <div className="bg-zinc-900/80 p-2 rounded-lg border border-white/5">
                      <span className="font-bold text-green-400 block">En Proceso</span>
                      <span className="text-zinc-400">Reloj corriendo hacia el límite contractual.</span>
                    </div>
                    <div className="bg-zinc-900/80 p-2 rounded-lg border border-purple-500/30">
                      <span className="font-bold text-purple-400 block">Espera de Aprobación</span>
                      <span className="text-zinc-400">¡Cronómetro en pausa! No perjudica al técnico.</span>
                    </div>
                  </div>
                </div>
              )}

              {/* SHOWCASE ESPECIAL 2: CHAT 0MS OPTIMISTA */}
              {step.specialShowcase === "chat" && (
                <div className="bg-black/40 border border-cyan-500/30 rounded-xl p-3 space-y-2 text-xs">
                  <div className="font-black text-cyan-300 uppercase tracking-wider flex items-center gap-1.5 text-[11px]">
                    <Zap size={14} className="text-cyan-400" />
                    <span>Ventajas del Chat en Vivo Integrado:</span>
                  </div>
                  <div className="grid grid-cols-3 gap-1.5 text-[10px] text-center">
                    <div className="bg-zinc-900/80 p-1.5 rounded-lg border border-white/5">
                      <span className="font-bold text-cyan-400 block">0 ms</span>
                      <span className="text-zinc-400 text-[9px]">Optimistic UI</span>
                    </div>
                    <div className="bg-zinc-900/80 p-1.5 rounded-lg border border-white/5">
                      <span className="font-bold text-emerald-400 block">WebSockets</span>
                      <span className="text-zinc-400 text-[9px]">En vivo directo</span>
                    </div>
                    <div className="bg-zinc-900/80 p-1.5 rounded-lg border border-white/5">
                      <span className="font-bold text-primary block">Trazabilidad</span>
                      <span className="text-zinc-400 text-[9px]">Auditoría legal</span>
                    </div>
                  </div>
                </div>
              )}

              {/* SHOWCASE ESPECIAL 3: TRIAJE CON IA */}
              {step.specialShowcase === "triage" && (
                <div className="bg-black/40 border border-fuchsia-500/30 rounded-xl p-3 space-y-2 text-xs">
                  <div className="font-black text-fuchsia-300 uppercase tracking-wider flex items-center gap-1.5 text-[11px]">
                    <Sparkles size={14} className="text-fuchsia-400" />
                    <span>Asignación Inteligente de Especialistas:</span>
                  </div>
                  <p className="text-[10px] text-zinc-300 leading-normal">
                    1. Coincidencia por especialidad técnica (Software, Redes, Equipos TI).<br />
                    2. Balance equitativo al técnico disponible con <strong>menor número de tickets activos</strong>.
                  </p>
                </div>
              )}
            </div>

            {/* Controles del Pie de Página */}
            <div className="bg-zinc-950/90 border-t border-white/10 px-3.5 py-2.5 flex items-center justify-between gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrev}
                disabled={currentStep === 0}
                className="font-bold text-[11px] rounded-lg h-8 px-2.5 border-white/10 text-zinc-300 hover:text-white hover:bg-white/5 disabled:opacity-40 cursor-pointer"
              >
                <ChevronLeft size={14} className="mr-0.5" /> Ant.
              </Button>

              {/* Puntos de Paso */}
              <div className="flex items-center gap-1">
                {STEPS.map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setCurrentStep(i)}
                    className={`h-1.5 rounded-full transition-all cursor-pointer ${
                      i === currentStep
                        ? "w-4 bg-primary"
                        : i < currentStep
                        ? "w-1.5 bg-primary/40 hover:bg-primary/60"
                        : "w-1.5 bg-zinc-700 hover:bg-zinc-500"
                    }`}
                    title={`Paso ${i + 1}`}
                  />
                ))}
              </div>

              <Button
                size="sm"
                onClick={handleNext}
                className="bg-primary hover:bg-primary/90 text-black font-black text-[11px] rounded-lg h-8 px-3 shadow-md gap-1 cursor-pointer active:scale-95 transition-all"
              >
                {currentStep === STEPS.length - 1 ? (
                  <>
                    <CheckCircle2 size={13} />
                    <span>🎉 Finalizar</span>
                  </>
                ) : (
                  <>
                    <span>Sig.</span>
                    <ChevronRight size={14} />
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
