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
  Check,
  Smartphone
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useRouter, usePathname } from "next/navigation";

interface TourStep {
  id: string;
  badge: string;
  badgeColor: string;
  title: string;
  route?: string;
  targetSelector?: string;
  indicatorText?: string;
  actionText: string;
  detail: string;
  autoOpenTicket?: boolean;
  autoCloseTicket?: boolean;
  specialShowcase?: "sla" | "chat" | "triage" | "pwa";
}

const STEPS: TourStep[] = [
  // PASO 1: BIENVENIDA Y ROLES
  {
    id: "step-1",
    badge: "Inicio • Rol Administrador Full",
    badgeColor: "bg-sky-500/10 text-sky-400 border-sky-500/30",
    title: "1. Panel de Bienvenida y Roles de Usuario",
    route: "/dashboard",
    targetSelector: '[data-tour="tour-user-profile"]',
    indicatorText: "Tu Perfil Corporativo",
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
    route: "/dashboard",
    targetSelector: '[data-tour="kanban-board"], [data-tour="kanban-board-mobile"]',
    indicatorText: "Tablero Kanban en Vivo",
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
    route: "/dashboard",
    targetSelector: '[data-tour="sla-indicator"], [data-tour="ticket-card"]',
    indicatorText: "Semáforo y Folio SLA",
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
    route: "/dashboard",
    targetSelector: '[data-tour="ticket-sheet-content"], [data-tour="ticket-details-drawer"]',
    indicatorText: "Panel Lateral con Ficha Completa",
    actionText: "Ficha técnica completa desplegada en el panel lateral",
    detail: "Al abrir cualquier requerimiento se despliega este panel lateral optimizado para computadores y pantallas táctiles con el historial, solicitante, técnico responsable y chat en vivo.",
    autoOpenTicket: true
  },
  // PASO 5: PAUSA INTELIGENTE DEL SLA
  {
    id: "step-5",
    badge: "Función Estrella • SLA Inteligente",
    badgeColor: "bg-purple-500/10 text-purple-400 border-purple-500/30",
    title: "5. Cronómetro con Pausa Inteligente",
    route: "/dashboard",
    targetSelector: '[data-tour="ticket-sla-timer"]',
    indicatorText: "Cronómetro Pausado de SLA",
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
    route: "/dashboard",
    targetSelector: '[data-tour="ticket-chat-area"]',
    indicatorText: "Chat en Vivo de 0ms",
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
    route: "/dashboard",
    targetSelector: '[data-tour="ticket-approval-actions"], [data-tour="ticket-chat-area"]',
    indicatorText: "Aprobar o Rechazar Solución",
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
    route: "/dashboard",
    targetSelector: '[data-tour="new-ticket-btn"], [data-tour="new-ticket-sidebar-btn"]',
    indicatorText: "Crear Nuevo Ticket",
    actionText: "Haz clic aquí para ingresar una solicitud bajo SLA",
    detail: "Permite al cliente o supervisor reportar incidentes con evidencia fotográfica. El algoritmo de triaje analiza la categoría de la falla (Redes, Software, Equipos TI) y asigna automáticamente al especialista disponible con menor carga de trabajo.",
    autoCloseTicket: true,
    specialShowcase: "triage"
  },
  // PASO 9: DIRECTORIO Y CAPACIDAD TÉCNICA (VISTA EN VIVO)
  {
    id: "step-9",
    badge: "Supervisión de Cuadrilla",
    badgeColor: "bg-blue-500/10 text-blue-400 border-blue-500/30",
    title: "9. Vista en Vivo: Técnicos y Especialistas",
    route: "/dashboard/tecnicos",
    targetSelector: '[data-tour="tecnicos-view"], [data-tour="nav-tecnicos"]',
    indicatorText: "Módulo de Técnicos de Soporte",
    actionText: "Explora la cuadrilla técnica y su disponibilidad en tiempo real",
    detail: "¡Ingresamos a la vista en vivo de Técnicos! Supervisa la carga de requerimientos asignados a cada especialista, sus competencias certificadas (Redes, Servidores, Software), su estado operativo y su calificación promedio CSAT basada en valoraciones de clientes.",
    autoCloseTicket: true
  },
  // PASO 10: CLIENTES Y EMPRESAS MULTI-TENANT (VISTA EN VIVO)
  {
    id: "step-10",
    badge: "Multi-Empresa & B2B",
    badgeColor: "bg-amber-500/10 text-amber-400 border-amber-500/30",
    title: "10. Vista en Vivo: Clientes y Empresas Multi-Tenant",
    route: "/dashboard/clientes",
    targetSelector: '[data-tour="clientes-view"], [data-tour="nav-clientes"]',
    indicatorText: "Módulo de Empresas Clientes",
    actionText: "Revisa la gestión de contratos y aislamiento corporativo",
    detail: "¡Ingresamos a la vista en vivo de Clientes! Plataforma multi-empresa donde cada organización cliente opera en un entorno seguro y aislado, visualizando únicamente sus propios requerimientos, SLA contratados y administradores autorizados.",
    autoCloseTicket: true
  },
  // PASO 11: CATÁLOGO DE SERVICIOS (VISTA EN VIVO)
  {
    id: "step-11",
    badge: "ANS & Catálogo TI",
    badgeColor: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
    title: "11. Vista en Vivo: Catálogo de Servicios Contractuales",
    route: "/dashboard/servicios",
    targetSelector: '[data-tour="servicios-view"], [data-tour="nav-servicios"]',
    indicatorText: "Catálogo Maestro de Servicios",
    actionText: "Consulta los entregables contractuales y horas de SLA",
    detail: "¡Ingresamos al Catálogo de Servicios! Define los compromisos formales por tipo de servicio: horas máximas de resolución y primera respuesta (ej: 4h para fallas críticas de infraestructura de red vs 24h para configuraciones estándar de puestos de trabajo).",
    autoCloseTicket: true
  },
  // PASO 12: HISTORIAL CENTRALIZADO (VISTA EN VIVO)
  {
    id: "step-12",
    badge: "Trazabilidad y Auditoría",
    badgeColor: "bg-slate-500/10 text-slate-300 border-slate-500/30",
    title: "12. Vista en Vivo: Historial y Búsqueda Predictiva",
    route: "/dashboard/tickets/historial",
    targetSelector: '[data-tour="historial-view"], [data-tour="nav-historial"]',
    indicatorText: "Historial Centralizado",
    actionText: "Buscador predictivo y descarga de actas de servicio",
    detail: "¡Ingresamos al Historial de Requerimientos! Archivo inmutable con buscador predictivo por folio #, empresa o técnico. Permite auditar qué sucedió en cada caso, el tiempo exacto que tomó resolverlo y descargar el informe formal de conformidad para auditorías.",
    autoCloseTicket: true
  },
  // PASO 13: CUADRO DE MANDO EJECUTIVO (VISTA EN VIVO)
  {
    id: "step-13",
    badge: "Business Intelligence",
    badgeColor: "bg-purple-500/10 text-purple-400 border-purple-500/30",
    title: "13. Vista en Vivo: Cuadro de Mando Ejecutivo & SLA",
    route: "/dashboard/dashboards",
    targetSelector: '[data-tour="dashboards-view"], [data-tour="nav-dashboards"]',
    indicatorText: "Métricas y Analítica SLA",
    actionText: "Tablero analítico con métricas de rendimiento en tiempo real",
    detail: "¡Ingresamos al Tablero Analítico Ejecutivo! Gráficos interactivos que auditan el porcentaje de cumplimiento de SLA (verde/rojo), distribución de demanda por empresa cliente, técnicos más productivos y proyecciones de eficiencia para la toma de decisiones.",
    autoCloseTicket: true
  },
  // PASO 14: PWA Y PUSH (REGRESA A DASHBOARD)
  {
    id: "step-14",
    badge: "Movilidad Extrema",
    badgeColor: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
    title: "14. Aplicación Web Progresiva (PWA) & Push",
    route: "/dashboard",
    targetSelector: '[data-tour="push-manager"], [data-tour="tour-user-profile"]',
    indicatorText: "Notificaciones Web Push PWA",
    actionText: "Regresamos al panel principal: activa alertas en tu celular",
    detail: "La plataforma funciona en celulares iPhone y Android como una aplicación instalable, enviando alertas sonoras y vibratorias en tiempo real vía Web Push VAPID sin intermediarios.",
    autoCloseTicket: true,
    specialShowcase: "pwa"
  },
  // PASO 15: FIN DEL TOUR
  {
    id: "step-15",
    badge: "100% Operativo",
    badgeColor: "bg-sky-500/10 text-sky-400 border-sky-500/30",
    title: "15. ¡Recorrido Completo! Operación en Vivo Activada",
    route: "/dashboard",
    targetSelector: '[data-tour="kanban-board"], [data-tour="kanban-board-mobile"]',
    indicatorText: "Plataforma 100% Operativa",
    actionText: "Ya puedes interactuar con libertad en la plataforma",
    detail: "Has recorrido en vivo todas las vistas operativas de la plataforma. Puedes arrastrar requerimientos entre columnas, crear nuevas solicitudes, interactuar en el chat o relanzar este tour en cualquier momento desde el botón flotante inferior.",
    autoCloseTicket: true
  }
];

export function TourGuide() {
  const router = useRouter();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [targetRect, setTargetRect] = useState<{ top: number; left: number; width: number; height: number; bottom: number; right: number } | null>(null);
  const [pillVisible, setPillVisible] = useState(true);
  const [measuredCardHeight, setMeasuredCardHeight] = useState<number>(380);
  const cardRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    setMounted(true);
  }, []);

  // Medir dinámicamente la altura real de la tarjeta flotante
  useEffect(() => {
    if (!isOpen || !cardRef.current) return;
    const updateH = () => {
      if (cardRef.current) {
        const h = cardRef.current.offsetHeight;
        if (h > 100) {
          setMeasuredCardHeight(h);
        }
      }
    };
    updateH();
    const ro = new ResizeObserver(updateH);
    ro.observe(cardRef.current);
    return () => ro.disconnect();
  }, [isOpen, currentStep]);

  // Marcar el body con data-tour-active para prevenir que componentes externos como Radix Sheet se cierren
  useEffect(() => {
    if (typeof document === "undefined") return;
    if (isOpen) {
      document.body.setAttribute("data-tour-active", "true");
    } else {
      document.body.removeAttribute("data-tour-active");
    }
    return () => {
      document.body.removeAttribute("data-tour-active");
    };
  }, [isOpen]);

  const handleClose = useCallback(() => {
    setIsOpen(false);
    setTargetRect(null);

    if (typeof window !== "undefined") {
      try {
        sessionStorage.setItem("onlinedesk_tour_seen", "true");
        sessionStorage.removeItem("onlinedesk_tour_active");
        sessionStorage.removeItem("onlinedesk_tour_step");
        const url = new URL(window.location.href);
        url.searchParams.delete("tour");
        url.searchParams.delete("step");
        url.searchParams.delete("demo");
        window.history.replaceState(null, "", url.toString());
      } catch (e) {
        // Safe against private browsing storage restrictions
      }
    }

    if (pathname !== "/dashboard") {
      router.push("/dashboard");
    }

    toast({
      title: "✨ Operación Normal Activada",
      description: "Tour finalizado. Ahora puedes explorar, gestionar requerimientos, chatear y operar con total libertad."
    });
  }, [toast, pathname, router]);

  const handleStartTour = useCallback((startIndex = 0) => {
    const validIndex = Math.max(0, Math.min(startIndex, STEPS.length - 1));
    setCurrentStep(validIndex);
    setIsOpen(true);

    if (typeof window !== "undefined") {
      try {
        sessionStorage.setItem("onlinedesk_tour_active", "true");
        sessionStorage.setItem("onlinedesk_tour_step", String(validIndex));
      } catch (e) {
        // Safe against private browsing storage restrictions
      }
    }

    const targetRoute = STEPS[validIndex]?.route;
    if (targetRoute && pathname !== targetRoute) {
      router.push(targetRoute);
    }
  }, [pathname, router]);

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

  // Persistir el paso actual en sessionStorage mientras el tour esté activo
  useEffect(() => {
    if (!isOpen || typeof window !== "undefined" && !sessionStorage) return;
    try {
      sessionStorage.setItem("onlinedesk_tour_active", "true");
      sessionStorage.setItem("onlinedesk_tour_step", String(currentStep));
    } catch (e) {
      // Safe against private browsing storage restrictions
    }
  }, [isOpen, currentStep]);

  // Auto-navegar a la vista correspondiente si el paso actual define una ruta distinta a la actual
  useEffect(() => {
    if (!isOpen) return;
    const currentTourStep = STEPS[currentStep];
    if (currentTourStep?.route && pathname !== currentTourStep.route) {
      router.push(currentTourStep.route);
    }
  }, [isOpen, currentStep, pathname, router]);

  // Verificar URL o sesión guardada al montar (?tour=true o ?demo=true o ?step=X o onlinedesk_tour_active)
  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      const params = new URLSearchParams(window.location.search);
      const hasTourParam = params.get("tour") === "true" || params.get("demo") === "true";
      const stepParam = params.get("step");
      const parsedStep = stepParam ? parseInt(stepParam, 10) - 1 : 0;

      if (hasTourParam) {
        const initialIndex = Math.max(0, Math.min(parsedStep, STEPS.length - 1));
        const timer = setTimeout(() => {
          handleStartTour(initialIndex);
        }, 300);
        return () => clearTimeout(timer);
      }

      // Si no hay parámetro de URL pero el tour estaba activo en la sesión previa (ej: recarga de página)
      const isTourActiveInSession = sessionStorage.getItem("onlinedesk_tour_active") === "true";
      const savedStepStr = sessionStorage.getItem("onlinedesk_tour_step");
      if (isTourActiveInSession && savedStepStr !== null) {
        const savedIndex = parseInt(savedStepStr, 10);
        if (!isNaN(savedIndex) && savedIndex >= 0 && savedIndex < STEPS.length) {
          setCurrentStep(savedIndex);
          setIsOpen(true);
        }
      }
    } catch (e) {
      console.warn("Tour URL check error:", e);
    }
  }, [handleStartTour]);

  // Manejar apertura o cierre automático del cajón de ticket según el paso
  useEffect(() => {
    if (!isOpen) return;

    try {
      const step = STEPS[currentStep];
      if (!step) return;

      if (step.autoOpenTicket) {
        // En los pasos 4, 5, 6 y 7 requerimos un ticket en 'Espera de aprobación' para mostrar la ficha, la pausa de SLA y botones de aprobación
        if (step.id === "step-4" || step.id === "step-5" || step.id === "step-6" || step.id === "step-7") {
          window.dispatchEvent(new CustomEvent("tour:open-ticket", { detail: { status: "Espera de aprobación" } }));
          setTimeout(() => {
            const approvedCard = document.querySelector('[data-tour-status="Espera de aprobación"]') as HTMLElement;
            if (approvedCard && typeof approvedCard.click === "function") {
              approvedCard.click();
            }
          }, 80);
        } else {
          // Apertura general
          window.dispatchEvent(new CustomEvent("tour:open-ticket", {}));
          setTimeout(() => {
            const firstCard = document.querySelector('[data-tour="ticket-card"]') as HTMLElement;
            if (firstCard && typeof firstCard.click === "function") {
              firstCard.click();
            }
          }, 80);
        }

        // Si es el paso 6 (Chat en Vivo), asegurar que la pestaña activa sea Chat
        if (step.id === "step-6") {
          setTimeout(() => {
            const chatTab = document.querySelector('button[data-tab="chat"]') as HTMLElement;
            if (chatTab && typeof chatTab.click === "function") {
              chatTab.click();
            }
          }, 120);
        }
      } else if (step.autoCloseTicket) {
        window.dispatchEvent(new CustomEvent("tour:close-ticket"));
        const closeBtn = document.querySelector('button[aria-label="Close"]') as HTMLElement;
        if (closeBtn && typeof closeBtn.click === "function") {
          closeBtn.click();
        }
      }
    } catch (e) {
      console.warn("Tour sheet toggle error:", e);
    }
  }, [isOpen, currentStep]);

  // Medir y enfocar el elemento destacado con sondeo periódico inteligente
  useEffect(() => {
    if (!isOpen) {
      setTargetRect(null);
      return;
    }

    const step = STEPS[currentStep];
    let attempts = 0;
    const maxAttempts = 35; // 35 * 80ms = 2.8 segundos máximo de sondeo para transiciones de pantalla
    let pollInterval: any = null;
    let lastRect: { top: number; left: number; width: number; height: number } | null = null;
    let stableCount = 0;

    const findAndMeasure = () => {
      attempts++;
      if (!step.targetSelector) {
        setTargetRect(null);
        if (pollInterval) clearInterval(pollInterval);
        return;
      }

      // Buscar todos los elementos coincidentes y seleccionar el primer elemento visible en pantalla
      const elements = document.querySelectorAll(step.targetSelector);
      let el: HTMLElement | null = null;
      for (let i = 0; i < elements.length; i++) {
        const candidate = elements[i] as HTMLElement;
        const r = candidate.getBoundingClientRect();
        if (r.width > 0 && r.height > 0) {
          el = candidate;
          break;
        }
      }

      if (el) {
        const rect = el.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) {
          // Solo hacer scroll suave si el elemento no es fixed/sticky y no está en pantalla completa
          const style = window.getComputedStyle(el);
          if (style.position !== 'fixed' && style.position !== 'sticky') {
            if (rect.top < 60 || rect.bottom > window.innerHeight - 60) {
              el.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "nearest" });
            }
          }

          const currentTop = rect.top;
          const currentLeft = rect.left;
          const currentWidth = rect.width;
          const currentHeight = rect.height;

          setTargetRect({
            top: currentTop,
            left: currentLeft,
            width: currentWidth,
            height: currentHeight,
            bottom: rect.bottom,
            right: rect.right
          });

          // Verificar si las coordenadas se estabilizaron (terminó la animación de entrada de Radix Sheet o transición de pantalla)
          if (
            lastRect &&
            Math.abs(lastRect.left - currentLeft) < 1.5 &&
            Math.abs(lastRect.top - currentTop) < 1.5 &&
            Math.abs(lastRect.width - currentWidth) < 1.5 &&
            Math.abs(lastRect.height - currentHeight) < 1.5
          ) {
            stableCount++;
          } else {
            stableCount = 0;
          }

          lastRect = { top: currentTop, left: currentLeft, width: currentWidth, height: currentHeight };

          // Detener el sondeo tras confirmar estabilidad durante al menos 3 chequeos
          if (stableCount >= 3 && attempts >= 4) {
            if (pollInterval) {
              clearInterval(pollInterval);
              pollInterval = null;
            }
          }
          return;
        }
      }

      if (attempts >= maxAttempts) {
        if (pollInterval) {
          clearInterval(pollInterval);
          pollInterval = null;
        }
        if (step.targetSelector) {
          const fallbackList = document.querySelectorAll(step.targetSelector);
          let foundFallback: HTMLElement | null = null;
          for (let i = 0; i < fallbackList.length; i++) {
            const candidate = fallbackList[i] as HTMLElement;
            const r = candidate.getBoundingClientRect();
            if (r.width > 0 && r.height > 0) {
              foundFallback = candidate;
              break;
            }
          }
          if (foundFallback) {
            const rect = foundFallback.getBoundingClientRect();
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
        } else {
          setTargetRect(null);
        }
      }
    };

    // Medición inicial y sondeo periódico
    findAndMeasure();
    pollInterval = setInterval(findAndMeasure, 80);

    const onScrollOrResize = () => {
      if (!step.targetSelector) return;
      const elements = document.querySelectorAll(step.targetSelector);
      for (let i = 0; i < elements.length; i++) {
        const candidate = elements[i] as HTMLElement;
        const rect = candidate.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) {
          setTargetRect({
            top: rect.top,
            left: rect.left,
            width: rect.width,
            height: rect.height,
            bottom: rect.bottom,
            right: rect.right
          });
          break;
        }
      }
    };

    window.addEventListener("scroll", onScrollOrResize, { passive: true });
    window.addEventListener("resize", onScrollOrResize);

    return () => {
      if (pollInterval) clearInterval(pollInterval);
      window.removeEventListener("scroll", onScrollOrResize);
      window.removeEventListener("resize", onScrollOrResize);
    };
  }, [isOpen, currentStep, pathname]);

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

  // Vistas completas que deben mostrar el 100% de la pantalla sin sombras negras ni bloqueos
  const isFullViewStep = step?.id === "step-2" || 
                         step?.id === "step-9" || 
                         step?.id === "step-10" || 
                         step?.id === "step-11" || 
                         step?.id === "step-12" || 
                         step?.id === "step-13" || 
                         step?.id === "step-15";

  // Posicionamiento dinámico del popover anclado con flecha indicadora
  const popoverPosition = useMemo(() => {
    if (typeof window === "undefined") {
      return { top: 100, left: 20, width: 380, placement: "bottom" as const, arrowLeft: 50, arrowTop: 50 };
    }

    const isMobile = window.innerWidth < 768;
    const popoverWidth = isMobile ? Math.min(window.innerWidth - 24, 380) : 410;
    const cardHeight = Math.max(measuredCardHeight, step?.specialShowcase ? 400 : 360);

    if (!targetRect) {
      // Centrar en pantalla si no hay elemento target disponible
      return {
        top: Math.max(20, Math.round((window.innerHeight - cardHeight) / 2)),
        left: Math.max(12, Math.round((window.innerWidth - popoverWidth) / 2)),
        width: popoverWidth,
        placement: "center" as const,
        arrowLeft: popoverWidth / 2,
        arrowTop: 50
      };
    }

    // CASO 1: Si estamos en pantalla de escritorio y el target está en el panel lateral (lado derecho)
    // Solo aplica a los pasos interactivos del cajón del ticket (pasos 4, 5, 6 y 7) para no tapar el contenido ni el chat
    const isTicketDrawerStep = step?.id === "step-4" || step?.id === "step-5" || step?.id === "step-6" || step?.id === "step-7";
    if (!isMobile && isTicketDrawerStep && targetRect.left > popoverWidth + 24) {
      const placement = "left" as const;
      const left = Math.max(16, targetRect.left - popoverWidth - 16);
      
      const isFullHeight = targetRect.height > window.innerHeight * 0.7;
      const idealTop = isFullHeight
        ? Math.round((window.innerHeight - cardHeight) / 2)
        : targetRect.top;
      const maxAllowedTop = Math.max(20, window.innerHeight - cardHeight - 20);
      const top = Math.max(20, Math.min(maxAllowedTop, idealTop));

      const arrowTop = isFullHeight
        ? Math.round(cardHeight / 2)
        : Math.max(24, Math.min(cardHeight - 24, targetRect.top + targetRect.height / 2 - top));

      return {
        top,
        left,
        width: popoverWidth,
        placement,
        arrowLeft: popoverWidth,
        arrowTop
      };
    }

    // CASO 2: En escritorio y el target está en el menú lateral izquierdo (Sidebar, w-60 ~ 240px)
    // posicionamos la tarjeta a la DERECHA del elemento del menú, centrada verticalmente sin taparlo
    if (!isMobile && targetRect.right < 320 && window.innerWidth - targetRect.right > popoverWidth + 24) {
      const placement = "right" as const;
      const left = targetRect.right + 20;
      const targetCenterY = targetRect.top + targetRect.height / 2;
      
      // La tarjeta NUNCA debe sobrepasar el borde inferior visible de la pantalla
      const maxAllowedTop = Math.max(20, window.innerHeight - cardHeight - 24);
      const idealTop = targetCenterY - cardHeight / 2;
      const top = Math.max(20, Math.min(maxAllowedTop, idealTop));
      const arrowTop = Math.max(24, Math.min(cardHeight - 28, targetCenterY - top));

      return {
        top,
        left,
        width: popoverWidth,
        placement,
        arrowLeft: 0,
        arrowTop
      };
    }

    // CASO VISTAS COMPLETAS EN ESCRITORIO (Pasos 9, 10, 11, 12, 13, 15):
    // Alinear la tarjeta hacia el lado derecho del contenido para dejar 100% visible
    // toda la información de la vista (tablas, fichas de especialistas, clientes, catálogo y gráficos) a la izquierda
    if (isFullViewStep && !isMobile && window.innerWidth >= 1024 && targetRect.width > popoverWidth + 60) {
      const top = Math.max(20, Math.min(window.innerHeight - cardHeight - 20, targetRect.bottom + 14));
      const rightAlignedLeft = targetRect.right - popoverWidth - 12;
      const left = Math.max(targetRect.left + 12, Math.min(window.innerWidth - popoverWidth - 16, rightAlignedLeft));
      const arrowLeft = Math.max(24, Math.min(popoverWidth - 24, popoverWidth - 48));

      return {
        top,
        left,
        width: popoverWidth,
        placement: "bottom" as const,
        arrowLeft,
        arrowTop: 50
      };
    }

    // CASO 3: Posicionamiento vertical (móvil y elementos centrales)
    const spaceBelow = window.innerHeight - targetRect.bottom;
    const spaceAbove = targetRect.top;

    let placement: "bottom" | "top" = "bottom";
    let top = targetRect.bottom + 14;

    if (spaceBelow < cardHeight + 20 && spaceAbove > cardHeight + 20) {
      placement = "top";
      top = targetRect.top - cardHeight - 14;
    } else if (spaceBelow >= cardHeight + 20) {
      placement = "bottom";
      top = targetRect.bottom + 14;
    } else {
      if (spaceAbove >= spaceBelow) {
        placement = "top";
        top = targetRect.top - cardHeight - 14;
      } else {
        placement = "bottom";
        top = targetRect.bottom + 14;
      }
    }

    // Asegurar SIEMPRE que top no empuje el pie de la tarjeta fuera de la pantalla
    const maxTop = Math.max(16, window.innerHeight - cardHeight - 20);
    top = Math.max(16, Math.min(maxTop, top));

    let left = targetRect.left + targetRect.width / 2 - popoverWidth / 2;
    left = Math.max(12, Math.min(window.innerWidth - popoverWidth - 12, left));

    const arrowLeft = Math.max(24, Math.min(popoverWidth - 24, targetRect.left + targetRect.width / 2 - left));

    return {
      top,
      left,
      width: popoverWidth,
      placement,
      arrowLeft,
      arrowTop: 50
    };
  }, [targetRect, step?.specialShowcase, measuredCardHeight, isFullViewStep]);

  if (!mounted) return null;

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
        <div data-tour-container="true" data-tour-active={isOpen ? "true" : "false"} className="fixed inset-0 z-[10000] pointer-events-none">
          {/* Fondo interactivo: solo en pasos individuales aplica un velo suave (0.35); en vistas completas es 100% transparente para permitir ver y hacer scroll libremente en el contenido */}
          <div
            onClick={isFullViewStep ? undefined : handleClose}
            className={`fixed inset-0 z-30 transition-colors duration-300 ${
              isFullViewStep 
                ? "pointer-events-none bg-transparent" 
                : "pointer-events-auto cursor-pointer bg-black/35"
            }`}
            title={isFullViewStep ? "" : "Haz clic fuera para salir del tour"}
          />

          {/* Halo de luz / Spotlight NO oscilante (fondo sólido y estable sin parpadeo) */}
          {targetRect ? (
            <>
              {/* En vistas completas no aplicamos sombra negra exterior (0 0 0 9999px) para que toda la pantalla (tablas, tarjetas, gráficos) quede 100% visible, nítida e iluminada */}
              <div
                style={{
                  top: Math.max(0, targetRect.top - 6),
                  left: Math.max(0, targetRect.left - 6),
                  width: targetRect.width + 12,
                  height: targetRect.height + 12,
                  boxShadow: isFullViewStep
                    ? "0 0 35px rgba(59, 130, 246, 0.6), inset 0 0 15px rgba(59, 130, 246, 0.2)"
                    : "0 0 0 9999px rgba(9, 9, 11, 0.38), 0 0 25px rgba(59, 130, 246, 0.5)",
                  borderRadius: "16px",
                  border: "2px solid rgba(59, 130, 246, 0.9)"
                }}
                className="fixed z-40 pointer-events-none transition-all duration-300 ease-out"
              />

              {/* Indicador sobre el elemento destacado */}
              <div
                style={{
                  top: targetRect.top < 30 ? targetRect.top + 16 : Math.max(8, targetRect.top - 24),
                  left: Math.min(window.innerWidth - 120, Math.max(10, targetRect.left + targetRect.width / 2 - 50))
                }}
                className="fixed z-50 pointer-events-none flex flex-col items-center transition-all duration-300 ease-out"
              >
                <div className="bg-primary text-black font-black text-[10px] tracking-tight px-3 py-0.5 rounded-full shadow-xl border border-primary/50 flex items-center gap-1.5 whitespace-nowrap">
                  <MousePointerClick size={12} className="text-black" />
                  <span>{step.indicatorText || "Elemento destacado"}</span>
                </div>
              </div>
            </>
          ) : (
            /* Fondo claro y transparente en transiciones */
            <div className={`fixed inset-0 z-40 ${isFullViewStep ? "bg-transparent" : "bg-zinc-950/25"} pointer-events-none transition-opacity duration-300`} />
          )}

          {/* Tarjeta flotante anclada con flecha indicadora */}
          <div
            ref={cardRef}
            id="tour-modal-card"
            style={{
              top: `${popoverPosition.top}px`,
              left: `${popoverPosition.left}px`,
              width: `${popoverPosition.width}px`,
              maxHeight: `calc(100vh - ${popoverPosition.top + 16}px)`
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
            {popoverPosition.placement === "left" && (
              <div
                style={{ top: `${popoverPosition.arrowTop || 40}px` }}
                className="absolute -right-1.5 w-3 h-3 bg-[#0d121c] border-t border-r border-primary/40 rotate-45 transform -translate-y-1/2 z-20"
              />
            )}
            {popoverPosition.placement === "right" && (
              <div
                style={{ top: `${popoverPosition.arrowTop || 40}px` }}
                className="absolute -left-1.5 w-3 h-3 bg-[#0d121c] border-b border-l border-primary/40 rotate-45 transform -translate-y-1/2 z-20"
              />
            )}

            {/* Encabezado del Popover */}
            <div className="bg-gradient-to-r from-zinc-950 to-zinc-900 border-b border-white/10 px-4 py-2.5 flex items-center justify-between shrink-0">
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
            <div className="w-full bg-white/5 h-1 shrink-0">
              <div
                className="bg-gradient-to-r from-primary to-blue-500 h-1 transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            {/* Cuerpo del Popover */}
            <div className="p-3.5 sm:p-4 space-y-2.5 flex-1 min-h-0 overflow-y-auto custom-scrollbar">
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

              {/* SHOWCASE ESPECIAL 4: PWA Y NOTIFICACIONES PUSH */}
              {step.specialShowcase === "pwa" && (
                <div className="bg-black/40 border border-emerald-500/30 rounded-xl p-3 space-y-2 text-xs">
                  <div className="font-black text-emerald-300 uppercase tracking-wider flex items-center gap-1.5 text-[11px]">
                    <Smartphone size={14} className="text-emerald-400" />
                    <span>Movilidad Nativa & Notificaciones:</span>
                  </div>
                  <div className="grid grid-cols-2 gap-1.5 text-[10px]">
                    <div className="bg-zinc-900/80 p-2 rounded-lg border border-white/5">
                      <span className="font-bold text-white block">📱 PWA Instalable</span>
                      <span className="text-zinc-400">Instalación directa en iPhone y Android sin App Store.</span>
                    </div>
                    <div className="bg-zinc-900/80 p-2 rounded-lg border border-white/5">
                      <span className="font-bold text-emerald-400 block">🔔 Web Push VAPID</span>
                      <span className="text-zinc-400">Alertas en vivo aun con la pantalla bloqueada.</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Controles del Pie de Página */}
            <div className="bg-zinc-950/90 border-t border-white/10 px-3.5 py-2.5 flex items-center justify-between gap-2 shrink-0">
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
