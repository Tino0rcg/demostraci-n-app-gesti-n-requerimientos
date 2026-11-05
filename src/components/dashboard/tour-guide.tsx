"use client";

import React, { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { 
  Sparkles, 
  ChevronRight, 
  ChevronLeft, 
  X, 
  Compass, 
  CheckCircle2, 
  Clock, 
  MessageSquare, 
  BarChart3, 
  BellRing,
  RotateCcw
} from "lucide-react";

interface TourStep {
  targetSelector: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  position?: "top" | "bottom" | "left" | "right" | "center";
}

const TOUR_STEPS: TourStep[] = [
  {
    targetSelector: '[data-tour="kanban-board"]',
    title: "1. Tablero de Control en Tiempo Real",
    description: "Las solicitudes avanzan por 4 estados: Ingresado, En proceso, Espera de aprobación y Terminado. El tablero se actualiza al instante en segundo plano sin recargar la página.",
    icon: <Compass className="w-5 h-5 text-primary" />,
    position: "bottom"
  },
  {
    targetSelector: '[data-tour="ticket-card"]',
    title: "2. Motor de SLA y Pausa Inteligente",
    description: "Cada requerimiento tiene un cronómetro de compromiso. El semáforo indica si está a tiempo (verde), en riesgo (amarillo) o excedido (rojo). Si el técnico envía la solución a revisión, el reloj se congela para no perjudicar su evaluación.",
    icon: <Clock className="w-5 h-5 text-yellow-400" />,
    position: "bottom"
  },
  {
    targetSelector: '[data-tour="new-ticket-btn"]',
    title: "3. Solicitud con Asignación Inteligente",
    description: "Al ingresar un caso con evidencia fotográfica, un algoritmo analiza la especialidad de la falla (redes, software, hardware) y la asigna automáticamente al técnico disponible con menor carga de trabajo.",
    icon: <Sparkles className="w-5 h-5 text-primary" />,
    position: "bottom"
  },
  {
    targetSelector: '[data-tour="live-chat-card"]',
    title: "4. Chat en Vivo de Latencia Cero",
    description: "Al hacer clic en cualquier ticket se abre el chat directo con entrega en 0 milisegundos, aviso de 'escribiendo...' y un botón interactivo para que el usuario acepte o rechace la solución técnica.",
    icon: <MessageSquare className="w-5 h-5 text-blue-400" />,
    position: "bottom"
  },
  {
    targetSelector: '[data-tour="nav-dashboards"]',
    title: "5. Métricas y Analítica Gerencial",
    description: "Panel de control con gráficos interactivos que audita el porcentaje de puntualidad por técnico, el volumen de tickets por empresa cliente y reportes ejecutivos.",
    icon: <BarChart3 className="w-5 h-5 text-purple-400" />,
    position: "right"
  },
  {
    targetSelector: '[data-tour="push-manager"]',
    title: "6. Notificaciones Push Móviles (PWA)",
    description: "La plataforma funciona en celulares iPhone y Android como una app nativa, enviando alertas sonoras y vibratorias en tiempo real cuando hay respuestas o cambios de estado.",
    icon: <BellRing className="w-5 h-5 text-emerald-400" />,
    position: "bottom"
  }
];

export function TourGuide() {
  const [isActive, setIsActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [pillVisible, setPillVisible] = useState(true);

  // Comprobar si se solicitó activar el tour mediante la URL (?tour=true o ?demo=true)
  useEffect(() => {
    if (typeof window === "undefined") return;

    const params = new URLSearchParams(window.location.search);
    const hasTourParam = params.get("tour") === "true" || params.get("demo") === "true";

    if (hasTourParam) {
      // Pequeño timeout para dar tiempo al render inicial del DOM
      const timer = setTimeout(() => {
        setIsActive(true);
        setCurrentStep(0);
      }, 700);
      return () => clearTimeout(timer);
    }
  }, []);

  // Actualizar la posición del foco cuando cambia el paso
  const updatePosition = useCallback(() => {
    if (!isActive) return;

    const step = TOUR_STEPS[currentStep];
    if (!step) return;

    const el = document.querySelector(step.targetSelector);
    if (el) {
      const rect = el.getBoundingClientRect();
      setTargetRect(rect);

      // Scroll suave hacia el elemento si está fuera del viewport
      const isInView = (
        rect.top >= 0 &&
        rect.bottom <= (window.innerHeight || document.documentElement.clientHeight)
      );

      if (!isInView) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    } else {
      // Si el selector no se encuentra (ej: en móvil o sin tickets), centramos el cuadro
      setTargetRect(null);
    }
  }, [isActive, currentStep]);

  useEffect(() => {
    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition);
    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition);
    };
  }, [updatePosition]);

  // Manejar tecla Escape para salir
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isActive) {
        setIsActive(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isActive]);

  const handleStartTour = () => {
    setCurrentStep(0);
    setIsActive(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleNext = () => {
    if (currentStep < TOUR_STEPS.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      setIsActive(false);
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleClose = () => {
    setIsActive(false);
  };

  const step = TOUR_STEPS[currentStep];

  // Cálculo de coordenadas seguras para el cuadro flotante
  const getPopoverStyle = (): React.CSSProperties => {
    if (!targetRect || typeof window === "undefined") {
      return {
        position: "fixed",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        zIndex: 10001,
      };
    }

    const margin = 16;
    const popoverWidth = Math.min(380, window.innerWidth - 32);
    let top = targetRect.bottom + margin;
    let left = Math.max(16, Math.min(targetRect.left, window.innerWidth - popoverWidth - 16));

    // Si se sale por abajo de la ventana, lo mostramos arriba del elemento
    if (top + 240 > window.innerHeight) {
      top = Math.max(16, targetRect.top - 240 - margin);
    }

    return {
      position: "fixed",
      top: `${Math.max(16, top)}px`,
      left: `${left}px`,
      width: `${popoverWidth}px`,
      zIndex: 10001,
    };
  };

  return (
    <>
      {/* Botón Flotante Permanente para Iniciar Tour (Presentación de Portafolio) */}
      {!isActive && pillVisible && (
        <div className="fixed bottom-20 sm:bottom-6 right-4 sm:right-6 z-40 flex items-center gap-1.5 p-1 rounded-full bg-zinc-900/90 border border-primary/40 shadow-[0_0_25px_rgba(59,130,246,0.25)] backdrop-blur-md animate-in fade-in slide-in-from-bottom-4 duration-300">
          <Button
            size="sm"
            onClick={handleStartTour}
            className="rounded-full bg-primary hover:bg-primary/90 text-black font-black text-xs px-3.5 h-8 gap-2 shadow-md cursor-pointer tracking-tight"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Tour Guiado (Portafolio)</span>
          </Button>
          <button
            type="button"
            onClick={() => setPillVisible(false)}
            title="Ocultar acceso de presentación"
            className="text-zinc-500 hover:text-zinc-300 p-1.5 rounded-full hover:bg-white/5 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Capa de Tour Interactivo (Overlay) */}
      {isActive && (
        <div className="fixed inset-0 z-[10000] pointer-events-auto">
          {/* Fondo semi-oscurecido */}
          <div 
            onClick={handleClose} 
            className="absolute inset-0 bg-black/75 backdrop-blur-[2px] transition-all duration-300" 
          />

          {/* Halo de luz / Spotlight sobre el elemento destacado */}
          {targetRect && (
            <div
              style={{
                position: "fixed",
                top: `${targetRect.top - 8}px`,
                left: `${targetRect.left - 8}px`,
                width: `${targetRect.width + 16}px`,
                height: `${targetRect.height + 16}px`,
                boxShadow: "0 0 0 9999px rgba(0, 0, 0, 0.70), 0 0 25px rgba(59, 130, 246, 0.8)",
                borderRadius: "16px",
                pointerEvents: "none",
                transition: "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
                border: "2px solid rgba(59, 130, 246, 0.9)",
                zIndex: 10000,
              }}
            />
          )}

          {/* Tarjeta con la Explicación del Paso */}
          <div 
            style={getPopoverStyle()} 
            className="bg-zinc-950/95 border border-primary/50 text-white p-5 rounded-2xl shadow-2xl backdrop-blur-xl animate-in zoom-in-95 duration-200"
          >
            {/* Encabezado del paso */}
            <div className="flex items-start justify-between gap-3 mb-2.5">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                  {step.icon}
                </div>
                <div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-primary">
                    Paso {currentStep + 1} de {TOUR_STEPS.length}
                  </span>
                  <h4 className="text-sm font-bold text-white leading-tight">
                    {step.title}
                  </h4>
                </div>
              </div>
              <button
                type="button"
                onClick={handleClose}
                className="text-zinc-400 hover:text-white p-1 rounded-md hover:bg-white/5 transition-colors"
                title="Salir del tour"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Contenido descriptivo para no-técnicos */}
            <p className="text-xs text-zinc-300 leading-relaxed mb-4">
              {step.description}
            </p>

            {/* Barra de progreso con puntos */}
            <div className="flex items-center justify-between pt-3 border-t border-white/10">
              <div className="flex items-center gap-1.5">
                {TOUR_STEPS.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentStep(i)}
                    className={`h-1.5 rounded-full transition-all ${
                      i === currentStep 
                        ? "w-5 bg-primary" 
                        : "w-1.5 bg-zinc-700 hover:bg-zinc-500"
                    }`}
                    title={`Ir al paso ${i + 1}`}
                  />
                ))}
              </div>

              {/* Botones de navegación */}
              <div className="flex items-center gap-2">
                {currentStep > 0 && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={handlePrev}
                    className="h-8 px-2 text-xs text-zinc-400 hover:text-white hover:bg-white/5"
                  >
                    <ChevronLeft className="w-3.5 h-3.5 mr-0.5" />
                    Atrás
                  </Button>
                )}

                <Button
                  size="sm"
                  onClick={handleNext}
                  className="h-8 px-3.5 text-xs font-bold bg-primary hover:bg-primary/90 text-black shadow-md cursor-pointer"
                >
                  {currentStep === TOUR_STEPS.length - 1 ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                      Listo
                    </>
                  ) : (
                    <>
                      Siguiente
                      <ChevronRight className="w-3.5 h-3.5 ml-1" />
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
