"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Global error boundary caught:", error);
  }, [error]);

  return (
    <html lang="es" className="dark">
      <body className="min-h-screen bg-[#09090b] text-white flex items-center justify-center p-6">
        <div className="max-w-md p-8 rounded-3xl bg-zinc-900/90 border border-white/10 shadow-2xl text-center space-y-4">
          <h2 className="text-xl font-black">Acceso de Demostración OnlineDesk</h2>
          <p className="text-xs text-zinc-400">
            Reiniciando la conexión segura para mostrar el tour y el tablero de control.
          </p>
          <button
            onClick={() => {
              window.location.href = "/dashboard?tour=true&step=1";
            }}
            className="bg-primary hover:bg-primary/90 text-black font-black text-xs py-3 px-6 rounded-xl cursor-pointer"
          >
            🚀 Ingresar al Tablero
          </button>
        </div>
      </body>
    </html>
  );
}
