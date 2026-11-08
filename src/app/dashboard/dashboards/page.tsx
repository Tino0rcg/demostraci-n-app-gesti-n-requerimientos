import { AnalyticsCharts } from "@/components/dashboard/analytics-charts";
import { StatCards } from "@/components/dashboard/stat-cards";
import { ShieldCheck, BarChart3, TrendingUp } from "lucide-react";
import { getTickets, getUsers, getServices } from "@/lib/data-server";

import { redirect } from "next/navigation";
import { getCurrentUserSession } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function DashboardsPage() {
    const session = await getCurrentUserSession();
    const userRole = session.role?.trim();

    // Solo administradores (Full o de Cliente) y técnicos autorizados
    if (userRole !== 'Administrador Full' && userRole !== 'Administrador Cliente') {
        redirect("/dashboard");
    }

    const allTickets = await getTickets();
    const allUsers = await getUsers();
    const allServices = await getServices();

    // Si es Administrador Cliente, filtrar solo los requerimientos de su empresa
    const visibleTickets = (userRole === 'Administrador Cliente' && (session as any).company_id)
        ? allTickets.filter((t: any) => t.company_id === (session as any).company_id)
        : allTickets;

    return (
        <div className="flex flex-col gap-8">
            <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-widest">
                    <ShieldCheck className="h-4 w-4" />
                    Módulo de Inteligencia Operativa
                </div>
                <h1 className="text-4xl font-black tracking-tighter text-white italic uppercase">Control de Métricas ANS</h1>
                <p className="text-muted-foreground text-sm max-w-2xl mt-1">
                    Monitoreo en tiempo real de Acuerdos de Nivel de Servicio, rendimiento técnico y demanda por organización.
                </p>
            </div>

            <StatCards tickets={visibleTickets} />

            <div className="grid gap-4 mt-4">
                <div className="flex items-center gap-2 mb-2">
                    <BarChart3 className="h-5 w-5 text-primary" />
                    <h2 className="text-xl font-bold text-white uppercase tracking-tight">Visualizaciones Analíticas</h2>
                </div>
                <AnalyticsCharts tickets={visibleTickets} allUsers={allUsers} services={allServices} />
            </div>

            <div className="bg-primary/5 border border-primary/20 rounded-xl p-6 mt-4">
                <div className="flex items-center gap-3 text-primary mb-4">
                    <TrendingUp className="h-6 w-6" />
                    <h3 className="text-lg font-bold">Resumen de Eficiencia Proyectada</h3>
                </div>
                <p className="text-zinc-400 text-sm leading-relaxed">
                    Basado en los datos actuales, el tiempo promedio de resolución se mantiene en un rango óptimo. 
                    Se recomienda poner especial atención a las categorías con mayor demanda para evitar cuellos de botella 
                    en los técnicos con alta carga de tickets activos.
                </p>
            </div>
        </div>
    );
}
