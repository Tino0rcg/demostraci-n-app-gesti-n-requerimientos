"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
    LayoutDashboard, 
    Archive, 
    Plus, 
    Wrench,
    Users,
    Menu,
    Ticket,
    LogOut
} from "lucide-react";
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetClose } from "@/components/ui/sheet";
import { NavLinks } from "@/components/dashboard/nav-links";
import { signOut } from "@/app/login/actions";

export function BottomNav({ role }: { role?: string }) {
    const pathname = usePathname();

    const isTableroActive = pathname === "/dashboard";
    const isHistorialActive = pathname === "/dashboard/tickets/historial";
    const isNewActive = pathname === "/dashboard/tickets/new";
    
    // Ruta contextual para el cuarto botón según el rol
    const getSecondaryItem = () => {
        if (role === 'Administrador Full') {
            return {
                name: "Técnicos",
                href: "/dashboard/tecnicos",
                icon: Wrench,
                active: pathname === "/dashboard/tecnicos"
            };
        }
        if (role === 'Administrador Cliente') {
            return {
                name: "Equipo",
                href: "/dashboard/usuarios",
                icon: Users,
                active: pathname === "/dashboard/usuarios"
            };
        }
        return {
            name: "Servicios",
            href: "/dashboard/servicios",
            icon: Wrench,
            active: pathname === "/dashboard/servicios"
        };
    };

    const secondaryItem = getSecondaryItem();
    const SecondaryIcon = secondaryItem.icon;

    return (
        <div className="fixed bottom-0 left-0 right-0 z-40 sm:hidden border-t border-white/10 bg-black/85 backdrop-blur-2xl px-2 pt-1 pb-safe shadow-[0_-8px_30px_rgba(0,0,0,0.5)]">
            <div className="flex items-center justify-around h-14 max-w-md mx-auto relative">
                
                {/* 1. Tablero */}
                <Link 
                    href="/dashboard"
                    data-tour="bottom-nav-tablero"
                    className={`flex flex-col items-center justify-center flex-1 py-1 transition-all active:scale-95 ${
                        isTableroActive ? "text-primary font-bold" : "text-zinc-400 hover:text-zinc-200"
                    }`}
                >
                    <div className="relative">
                        <LayoutDashboard className="h-5 w-5" />
                        {isTableroActive && (
                            <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary" />
                        )}
                    </div>
                    <span className="text-[10px] mt-1 tracking-tight">Tablero</span>
                </Link>

                {/* 2. Historial */}
                <Link 
                    href="/dashboard/tickets/historial"
                    data-tour="bottom-nav-historial"
                    className={`flex flex-col items-center justify-center flex-1 py-1 transition-all active:scale-95 ${
                        isHistorialActive ? "text-primary font-bold" : "text-zinc-400 hover:text-zinc-200"
                    }`}
                >
                    <div className="relative">
                        <Archive className="h-5 w-5" />
                        {isHistorialActive && (
                            <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary" />
                        )}
                    </div>
                    <span className="text-[10px] mt-1 tracking-tight">Historial</span>
                </Link>

                {/* 3. Botón Central Destacado: Nuevo Ticket */}
                <div className="flex flex-col items-center justify-center flex-1 relative -top-3">
                    <Link
                        href="/dashboard/tickets/new"
                        data-tour="bottom-nav-nuevo"
                        className={`h-12 w-12 rounded-full flex items-center justify-center shadow-lg transition-transform active:scale-90 ${
                            isNewActive 
                                ? "bg-white text-black shadow-white/30 scale-105" 
                                : "bg-primary text-black shadow-primary/40 hover:scale-105"
                        }`}
                        title="Crear Nuevo Ticket"
                    >
                        <Plus className="h-6 w-6 stroke-[2.5]" />
                    </Link>
                    <span className="text-[9px] font-bold mt-1 text-primary tracking-tight">Nuevo</span>
                </div>

                {/* 4. Opción Contextual (Técnicos / Equipo / Servicios) */}
                <Link 
                    href={secondaryItem.href}
                    data-tour="bottom-nav-secondary"
                    className={`flex flex-col items-center justify-center flex-1 py-1 transition-all active:scale-95 ${
                        secondaryItem.active ? "text-primary font-bold" : "text-zinc-400 hover:text-zinc-200"
                    }`}
                >
                    <div className="relative">
                        <SecondaryIcon className="h-5 w-5" />
                        {secondaryItem.active && (
                            <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary" />
                        )}
                    </div>
                    <span className="text-[10px] mt-1 tracking-tight">{secondaryItem.name}</span>
                </Link>

                {/* 5. Menú Completo */}
                <Sheet>
                    <SheetTrigger asChild>
                        <button 
                            type="button"
                            data-tour="bottom-nav-menu"
                            className="flex flex-col items-center justify-center flex-1 py-1 text-zinc-400 hover:text-zinc-200 transition-all active:scale-95"
                        >
                            <Menu className="h-5 w-5" />
                            <span className="text-[10px] mt-1 tracking-tight">Menú</span>
                        </button>
                    </SheetTrigger>
                    <SheetContent side="bottom" className="rounded-t-3xl border-t border-white/10 bg-[#09090b]/95 backdrop-blur-2xl max-h-[85vh] p-6 pb-safe">
                        <SheetTitle className="text-white text-base font-black uppercase italic tracking-wider flex items-center gap-2 mb-4">
                            <Ticket className="h-5 w-5 text-primary" />
                            Menú de Navegación
                        </SheetTitle>
                        <div className="flex flex-col gap-1 overflow-y-auto max-h-[50vh] pr-1 custom-scrollbar">
                            <NavLinks role={role} isMobile={true} />
                        </div>
                        <div className="mt-4 pt-3 border-t border-white/10">
                            <form action={signOut}>
                                <button
                                    type="submit"
                                    className="w-full min-h-[44px] flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-red-500/20 text-red-400 hover:bg-red-500/30 active:scale-95 font-bold border border-red-500/30 transition-all text-sm cursor-pointer shadow-md"
                                >
                                    <LogOut className="h-4 w-4" />
                                    <span>Cerrar Sesión</span>
                                </button>
                            </form>
                        </div>
                    </SheetContent>
                </Sheet>

            </div>
        </div>
    );
}
