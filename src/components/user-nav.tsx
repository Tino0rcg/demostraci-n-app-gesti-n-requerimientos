"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { signOut } from "@/app/login/actions";
import { LogOut, Settings, User } from "lucide-react";

export interface UserNavProps {
  user: {
    name: string;
    email: string;
    role: string;
    empresa: string;
    avatarUrl: string;
  }
}

export function UserNav({ user }: UserNavProps) {
  const currentUser = user || {
    name: "Cargando...",
    email: "",
    role: "User",
    empresa: "",
    avatarUrl: "",
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-9 w-9 rounded-full border border-white/10 p-0 hover:bg-white/5 transition-all">
          <Avatar className="h-9 w-9">
            <AvatarImage src={currentUser.avatarUrl} alt={currentUser.name} />
            <AvatarFallback className="bg-primary/20 text-primary font-bold">{currentUser.name ? currentUser.name.charAt(0) : 'U'}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-64 bg-zinc-900/90 backdrop-blur-xl border-white/10 text-white" align="end" forceMount>
        <DropdownMenuLabel className="font-normal py-4 px-4 bg-white/5 border-b border-white/5">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-bold leading-none">{currentUser.name}</p>
            <p className="text-[10px] uppercase font-black tracking-widest text-primary mt-0.5">
                {currentUser.role} - {currentUser.empresa}
            </p>
            <p className="text-xs leading-none text-zinc-500 mt-2 italic">
              {currentUser.email}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-white/5" />
        <DropdownMenuGroup className="p-1">
          <DropdownMenuItem className="gap-2 focus:bg-primary/20 focus:text-primary cursor-pointer py-2.5">
            <User className="h-4 w-4" />
            <span>Perfil de Usuario</span>
          </DropdownMenuItem>

        </DropdownMenuGroup>
        <DropdownMenuSeparator className="bg-white/5" />
        <div className="p-1">
            <DropdownMenuItem 
                onClick={() => signOut()}
                className="gap-2 focus:bg-red-500/20 focus:text-red-400 text-red-400 font-bold cursor-pointer py-2.5"
            >
                <LogOut className="h-4 w-4" />
                <span>Cerrar Sesión</span>
            </DropdownMenuItem>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
