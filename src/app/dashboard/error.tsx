"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Sparkles, RefreshCcw } from "lucide-react";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Dashboard error caught by boundary:", error);
  }, [error]);

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center">
      <div className="max-w-md p-8 rounded-3xl bg-zinc-900/90 border border-white/10 shadow-2xl backdrop-blur-xl space-y-4">
        <div className="h-12 w-12 rounded-2xl bg-primary/20 border border-primary/30 flex items-center justify-center mx-auto text-primary">
          <Sparkles className="h-6 w-6 animate-pulse" />
        </div>
        <h2 className="text-xl font-black text-white">Reanudando Tablero de Control</h2>
        <p className="text-xs text-zinc-400 leading-relaxed">
          Accediendo con la sesión garantizada de portafolio para continuar con el recorrido interactivo sin interrupciones.
        </p>
        <div className="pt-2 flex flex-col sm:flex-row gap-2 justify-center">
          <Button
            onClick={() => {
              window.location.href = "/dashboard?tour=true&step=1";
            }}
            className="bg-primary hover:bg-primary/90 text-black font-black text-xs h-10 px-6 rounded-xl cursor-pointer"
          >
            🚀 Continuar al Tour Guiado
          </Button>
          <Button
            variant="outline"
            onClick={() => reset()}
            className="border-white/10 hover:bg-white/5 text-xs h-10 px-4 rounded-xl cursor-pointer"
          >
            <RefreshCcw className="h-3.5 w-3.5 mr-1" /> Reintentar
          </Button>
        </div>
      </div>
    </div>
  );
}
