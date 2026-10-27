"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { signOut } from "@/app/login/actions";
import { LogOut, User, Building2, ChevronDown, Mail, Shield } from "lucide-react";

export interface UserNavProps {
  user: {
    name: string;
    email: string;
    role: string;
    empresa: string;
    avatarUrl: string;
  };
}

export function UserNav({ user }: UserNavProps) {
  const currentUser = user || {
    name: "Usuario",
    email: "",
    role: "Usuario",
    empresa: "",
    avatarUrl: "",
  };

  const firstName = currentUser.name?.trim().split(" ")[0] || "Mi Cuenta";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="flex items-center gap-2 pl-1.5 pr-2.5 py-1 rounded-full border border-white/20 bg-white/10 hover:bg-white/15 active:scale-95 transition-all text-white shadow-md focus:outline-none focus:ring-2 focus:ring-primary min-h-[40px] cursor-pointer shrink-0"
          title="Ver perfil y opciones de cuenta"
        >
          <Avatar className="h-7 w-7 border border-primary/40 shadow-inner">
            <AvatarImage src={currentUser.avatarUrl} alt={currentUser.name} />
            <AvatarFallback className="bg-primary/25 text-primary font-bold text-xs">
              {currentUser.name ? currentUser.name.charAt(0).toUpperCase() : "U"}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex flex-col text-left">
            <span className="text-xs font-bold leading-tight text-white max-w-[85px] sm:max-w-[120px] truncate">
              {firstName}
            </span>
            <span className="text-[9px] font-semibold text-primary uppercase tracking-wider leading-none max-w-[85px] sm:max-w-[120px] truncate">
              {currentUser.role}
            </span>
          </div>

          <ChevronDown className="h-3.5 w-3.5 text-zinc-400 shrink-0 ml-0.5" />
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        className="w-72 max-w-[92vw] bg-[#0c111a] border border-white/20 text-white shadow-2xl p-2 rounded-2xl z-50 mr-2"
        align="end"
        sideOffset={8}
      >
        {/* Cabecera del Usuario */}
        <DropdownMenuLabel className="font-normal p-3 bg-white/5 rounded-xl border border-white/10">
          <div className="flex items-center gap-3">
            <Avatar className="h-11 w-11 border-2 border-primary/40 shadow-md">
              <AvatarImage src={currentUser.avatarUrl} alt={currentUser.name} />
              <AvatarFallback className="bg-primary/30 text-primary font-bold text-sm">
                {currentUser.name ? currentUser.name.charAt(0).toUpperCase() : "U"}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col min-w-0 flex-1">
              <p className="text-sm font-bold text-white truncate leading-tight">
                {currentUser.name}
              </p>
              <div className="flex items-center gap-1 text-[11px] text-zinc-400 mt-1 truncate">
                <Mail className="h-3 w-3 shrink-0 text-zinc-500" />
                <span className="truncate">{currentUser.email || "Sin correo"}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 mt-3 pt-2.5 border-t border-white/5 flex-wrap">
            <span className="inline-flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-primary/20 text-primary border border-primary/30">
              <Shield className="h-2.5 w-2.5" />
              {currentUser.role}
            </span>
            {currentUser.empresa && (
              <span className="inline-flex items-center gap-1 text-[10px] font-medium text-zinc-300 px-2 py-0.5 rounded-full bg-white/5 border border-white/10 truncate max-w-[160px]">
                <Building2 className="h-2.5 w-2.5 text-zinc-400 shrink-0" />
                <span className="truncate">{currentUser.empresa}</span>
              </span>
            )}
          </div>
        </DropdownMenuLabel>

        <DropdownMenuSeparator className="bg-white/10 my-2" />

        {/* Botón Prominente de Cerrar Sesión */}
        <div className="pt-1">
          <form action={signOut}>
            <button
              type="submit"
              className="w-full min-h-[44px] flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-red-500/20 text-red-400 hover:bg-red-500/30 hover:text-red-300 active:scale-98 font-bold border border-red-500/30 transition-all text-sm cursor-pointer shadow-sm"
            >
              <LogOut className="h-4 w-4" />
              <span>Cerrar Sesión</span>
            </button>
          </form>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
