"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { login, directDemoLogin } from "./actions";
import Image from "next/image";
import { ShieldCheck, ArrowLeft, Loader2, Eye, EyeOff, Sparkles } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";

function errorToSpanish(message: string): string {
    if (message.includes("Invalid login credentials")) {
        return "El correo o la contraseña son incorrectos.";
    }
    if (message.includes("Email not confirmed")) {
        return "Por favor confirma tu correo electrónico antes de ingresar.";
    }
    if (message.includes("FetchError")) {
         return "Fallo de conexión a la base de datos.";
    }
    return `Ha ocurrido un error inesperado al intentar iniciar sesión. Detalles: ${message}`;
}

export default function LoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState("");
    const [showPassword, setShowPassword] = useState(false);

    useEffect(() => {
        if (typeof window === "undefined") return;
        // Salto automático de login: exactamente igual que en la app de ICSA
        const timer = setTimeout(() => {
            window.location.href = "/dashboard?tour=true&step=1";
        }, 120);
        return () => clearTimeout(timer);
    }, []);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setErrorMsg("");

        try {
            const formData = new FormData();
            formData.append("email", email);
            formData.append("password", password);

            const result = await login(formData);
            
            if (result?.error) {
                setErrorMsg(errorToSpanish(result.error));
                setLoading(false);
            }
        } catch (err: any) {
            // Next.js redirect lanza una excepción interna esperada
            if (err?.digest?.startsWith?.('NEXT_REDIRECT') || err?.message === 'NEXT_REDIRECT') {
                return;
            }
            console.error("Login catch:", err);
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen w-full flex items-center justify-center bg-[#09090b] px-4 relative overflow-hidden">
            {/* Background Decor */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px] pointer-events-none" />
            
            <Link href="/" className="absolute top-4 left-4 sm:top-8 sm:left-8 flex items-center gap-2 text-zinc-500 hover:text-white transition-colors text-xs sm:text-sm font-bold uppercase tracking-widest z-20">
                <ArrowLeft className="h-4 w-4" />
                Regresar
            </Link>

            <Card className="w-full max-w-md glass-card border-white/10 bg-black/40 backdrop-blur-xl shadow-2xl overflow-hidden relative z-10">
                <div className="h-1 w-full bg-gradient-to-r from-transparent via-primary to-transparent" />
                <CardHeader className="space-y-4 text-center pt-8 pb-4">
                    <div className="flex justify-center mb-2">
                        <div className="p-3 rounded-2xl bg-white border border-white/10 shadow-inner">
                            <Image 
                                src="https://github.com/Tino0rcg/fotos-Onlinedesk/blob/main/ChatGPT%20Image%2026%20jun%202026%2C%2002_08_41%20a.m..png?raw=true" 
                                alt="Online System Logo" 
                                width={120} 
                                height={120}
                                className="object-contain"
                            />
                        </div>
                    </div>
                    <div className="space-y-1">
                        <div className="flex flex-col">
                            <CardTitle className="text-2xl font-black tracking-tighter text-white uppercase italic leading-none">Acceso OnlineDesk</CardTitle>
                            <span className="text-[10px] font-bold tracking-[0.2em] text-blue-400 uppercase mt-2">by Online System</span>
                        </div>
                        <CardDescription className="text-zinc-500 font-medium italic">
                            Identifíquese para gestionar sus requerimientos.
                        </CardDescription>
                    </div>
                </CardHeader>
                <form onSubmit={handleLogin} autoComplete="off">
                    <CardContent className="space-y-4">
                        {errorMsg && (
                            <div className="p-3 text-xs font-bold text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-2">
                                <ShieldCheck className="h-4 w-4" />
                                {errorMsg}
                            </div>
                        )}
                        <div className="space-y-2">
                            <Label htmlFor="email" className="text-zinc-400 text-xs font-bold uppercase tracking-widest ml-1">Correo Corporativo</Label>
                            <Input 
                                id="email" 
                                type="email" 
                                placeholder="usuario@online-system.cl" 
                                required 
                                className="bg-black/40 border-white/10 text-white h-11 focus:border-primary/50 transition-all rounded-xl"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                autoComplete="off"
                                data-lpignore="true"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password" title="Contraseña" className="text-zinc-400 text-xs font-bold uppercase tracking-widest ml-1">Contraseña</Label>
                            <div className="relative group">
                                <Input 
                                    id="password" 
                                    type={showPassword ? "text" : "password"} 
                                    required 
                                    placeholder="••••••••"
                                    className="bg-black/40 border-white/10 text-white h-11 focus:border-primary/50 transition-all rounded-xl pr-10"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    autoComplete="new-password"
                                    data-lpignore="true"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-1 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center p-2"
                                >
                                    {showPassword ? (
                                        <EyeOff className="h-4 w-4" />
                                    ) : (
                                        <Eye className="h-4 w-4" />
                                    )}
                                </button>
                            </div>
                        </div>
                    </CardContent>
                    <CardFooter className="pt-2 pb-6 flex flex-col gap-4">
                        <Button className="w-full h-12 bg-primary hover:bg-primary/90 text-black font-black uppercase italic tracking-tighter shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] active:scale-95 rounded-xl cursor-pointer" type="submit" disabled={loading}>
                            {loading ? (
                                <div className="flex items-center gap-2">
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Autenticando...
                                </div>
                            ) : "Entrar al Sistema"}
                        </Button>

                        <div className="w-full pt-3 border-t border-white/10 flex flex-col items-center gap-2">
                            <span className="text-[11px] text-zinc-400 font-medium">
                                ¿Vienes a revisar mi portafolio profesional?
                            </span>
                            <button
                                type="button"
                                onClick={async () => {
                                    setLoading(true);
                                    setEmail("admin@vanguardia.cl");
                                    setPassword("Vanguardia_2025!");
                                    try {
                                        await directDemoLogin("admin");
                                    } catch (err: any) {
                                        if (err?.digest?.startsWith?.('NEXT_REDIRECT') || err?.message === 'NEXT_REDIRECT') return;
                                        setLoading(false);
                                    }
                                }}
                                className="w-full py-2.5 px-3 text-xs font-bold text-primary bg-primary/10 hover:bg-primary/20 border border-primary/30 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95 shadow-sm"
                            >
                                <Sparkles className="w-3.5 h-3.5" />
                                🚀 Acceso Directo de Demostración (1 Clic)
                            </button>
                            <div className="text-[10px] text-zinc-500 font-mono text-center pt-1">
                                Usuario: <span className="text-zinc-300">admin@vanguardia.cl</span> | Clave: <span className="text-zinc-300">Vanguardia_2025!</span>
                            </div>
                        </div>
                    </CardFooter>
                </form>
            </Card>
        </div>
    );
}
