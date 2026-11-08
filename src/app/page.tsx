import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { 
  ArrowRight, 
  Zap, 
  Clock, 
  ShieldCheck,
  Activity
} from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 overflow-hidden font-sans selection:bg-blue-500/30 selection:text-blue-200">
      
      {/* Background Effects */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-blue-600/15 rounded-full blur-[140px] mix-blend-screen" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-indigo-600/15 rounded-full blur-[140px] mix-blend-screen" />
        <div className="absolute top-[30%] left-[50%] -translate-x-1/2 w-[60%] h-[40%] bg-blue-400/5 rounded-full blur-[120px] animate-pulse" />
      </div>

      {/* Modern Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-black/60 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-3 md:px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2 md:gap-3">
            <Image 
              src="https://github.com/Tino0rcg/fotos-Onlinedesk/blob/main/ChatGPT%20Image%2026%20jun%202026%2C%2002_08_41%20a.m..png?raw=true" 
              alt="OnlineDesk Logo" 
              width={80} 
              height={80}
              className="object-contain w-[50px] h-[50px] md:w-[80px] md:h-[80px] drop-shadow-[0_0_15px_rgba(59,130,246,0.5)]"
            />
            <div className="flex flex-col">
              <span className="text-lg md:text-2xl font-black tracking-tighter text-white uppercase italic leading-none">OnlineDesk</span>
              <span className="text-[7px] md:text-[9px] font-bold tracking-[0.2em] text-blue-400 uppercase leading-none mt-1">by Online System</span>
            </div>
          </div>
          <div className="flex items-center gap-2 md:gap-4">
            <Link href="/dashboard?tour=true&step=1">
              <Button className="rounded-full bg-white text-black hover:bg-blue-50 hover:text-blue-600 hover:scale-105 font-bold px-4 md:px-7 text-xs md:text-sm h-8 md:h-10 shadow-[0_0_20px_rgba(255,255,255,0.15)] transition-all duration-300 group">
                <span className="hidden sm:inline">🚀 Iniciar Tour</span>
                <span className="sm:hidden">Tour</span>
                <ArrowRight className="w-3 h-3 md:w-4 md:h-4 ml-1 md:ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative z-10 pt-40 pb-20 px-6 max-w-7xl mx-auto flex flex-col items-center text-center">
        
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-2 mb-8 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-bold uppercase tracking-wider backdrop-blur-md shadow-[0_0_20px_rgba(59,130,246,0.2)]">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
          </span>
          Plataforma de Soporte Tecnológico
        </div>

        {/* Main Headline */}
        <h1 className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-black tracking-tighter leading-[1.08] mb-6 sm:mb-8 max-w-5xl">
          Gestión de Servicios <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 drop-shadow-sm">
            Inteligente & Rápida.
          </span>
        </h1>

        {/* Subtitle */}
        <p className="max-w-3xl mb-8 text-lg md:text-xl text-zinc-400 font-medium leading-relaxed">
          Optimiza la resolución de incidentes, controla tus SLAs en tiempo real y centraliza las operaciones de tu equipo técnico con OnlineDesk, la herramienta corporativa definitiva.
        </p>

        {/* CTAs con acceso directo sin login al igual que ICSA */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
          <Link href="/dashboard?tour=true&step=1">
            <Button className="rounded-full bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-600 hover:opacity-95 text-white font-black px-8 h-14 text-base shadow-[0_0_35px_rgba(59,130,246,0.4)] transition-all hover:scale-105 gap-2 cursor-pointer">
              🚀 Iniciar Tour Guiado (Demo en Vivo)
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </Link>
          <Link href="/dashboard?tour=true&step=1">
            <Button variant="outline" className="rounded-full border-white/20 hover:bg-white/10 text-white font-bold px-6 h-14 text-base cursor-pointer">
              Entrar al Tablero
            </Button>
          </Link>
        </div>

      </section>



      {/* Footer Minimal */}
      <footer className="relative z-10 border-t border-white/10 bg-black/40 backdrop-blur-xl mt-20">
        <div className="max-w-7xl mx-auto px-6 py-10 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
                <Image 
                  src="https://github.com/Tino0rcg/fotos-Onlinedesk/blob/main/ChatGPT%20Image%2026%20jun%202026%2C%2002_08_41%20a.m..png?raw=true" 
                  alt="OnlineDesk Logo" 
                  width={24} 
                  height={24}
                  className="object-contain opacity-50 grayscale hover:grayscale-0 hover:opacity-100 transition-all"
                />
                <span className="font-bold text-sm text-zinc-500">OnlineDesk © {new Date().getFullYear()}</span>
            </div>
            <p className="text-[11px] text-zinc-500 uppercase tracking-widest font-bold">Plataforma Asegurada y Restringida</p>
        </div>
      </footer>

    </div>
  );
}
