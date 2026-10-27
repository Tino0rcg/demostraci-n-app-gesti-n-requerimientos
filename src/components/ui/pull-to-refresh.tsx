"use client";

import React from "react";

/**
 * Componente passthrough inerte.
 * Se eliminaron los eventListeners globales de touch que interceptaban
 * los gestos táctiles del usuario en modales y chats.
 */
export function PullToRefresh({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
