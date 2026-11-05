"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Ticket, User, TicketPriority, TicketStatus } from "@/lib/definitions";
import { format } from "date-fns";
import { Clock, AlertCircle, PlusCircle } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { TicketDetailsInfo } from "@/components/dashboard/ticket-details-info";
import { getSlaStatus } from "@/lib/sla-utils";
import React, { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getProfilesAction } from "@/app/actions/profiles";
import { getTicketsAction } from "@/app/actions/tickets";

const COLUMNS: TicketStatus[] = ['Ingresado', 'En proceso', 'Espera de aprobación', 'Terminado'];

const priorityColorMap: { [key in TicketPriority]: string } = {
    Baja: "bg-green-500/20 text-green-400 border border-green-500/30",
    Media: "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30",
    Alta: "bg-orange-500/20 text-orange-400 border border-orange-500/30",
    Crítica: "bg-red-500/20 text-red-400 border border-red-500/30",
};

function TicketCard({ ticket, submitter, onClick }: { ticket: Ticket, submitter?: User, onClick: () => void }) {
    return (
        <Card 
            onClick={onClick}
            data-tour="ticket-card"
            className="cursor-pointer glass-card border-none hover:-translate-y-1 transition-all shadow-md group"
        >
            <CardHeader className="p-4 pb-2 space-y-2">
                <div className="flex justify-between items-start gap-2">
                    <Badge variant="outline" className={priorityColorMap[ticket.priority as TicketPriority]}>
                        {ticket.priority}
                    </Badge>
                    <div className="flex items-center gap-1.5" data-tour="sla-indicator">
                        <div 
                            title={getSlaStatus(ticket).label} 
                            className={`h-2.5 w-2.5 rounded-full ${getSlaStatus(ticket).color} shadow-[0_0_8px_rgba(255,255,255,0.2)]`} 
                        />
                        <span className="text-xs text-muted-foreground font-mono font-bold text-primary">#{ticket.codigo || ticket.id.split('-')[0].toUpperCase()}</span>
                    </div>
                </div>
                <CardTitle className="text-sm font-bold leading-tight group-hover:text-primary transition-colors">
                    {ticket.subject}
                </CardTitle>
                <div className="flex flex-col pt-1">
                    <span className="text-[11px] text-white/90 font-medium">{submitter?.name || 'Desconocido'}</span>
                    <span className="text-[9px] text-primary uppercase font-black tracking-widest opacity-80">{submitter?.empresa || 'Empresa externa'}</span>
                </div>
            </CardHeader>
            <CardContent className="p-4 pt-0">
                <p className="text-xs text-zinc-400 line-clamp-2 mt-1 mb-3 leading-relaxed">
                    {ticket.description}
                </p>
                <div className="flex items-center justify-between text-[10px] text-zinc-500 font-medium font-mono uppercase tracking-tighter">
                    <div className="flex items-center gap-1.5">
                        <AlertCircle className="h-3 w-3 text-zinc-600" />
                        <span>{ticket.category}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <Clock className="h-3 w-3 text-zinc-600" />
                        <span>{format(ticket.updatedAt, "MMM dd")}</span>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

export default function DashboardRootPage() {
    const supabase = createClient();
    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [profiles, setProfiles] = useState<User[]>([]);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshCount, setRefreshCount] = useState(0);

    const fetchData = React.useCallback(async (isInitial = false) => {
        try {
            if (isInitial) setLoading(true);
            const resultTickets = await getTicketsAction();
            if (resultTickets.success && resultTickets.data) {
                const now = new Date();
                const processedTickets = (resultTickets.data as Ticket[])
                    .filter(t => {
                        // Si está terminado, solo mostrar si fue resuelto hace menos de 24 horas
                        if (t.status === 'Terminado' && t.resolvedAt) {
                            const diffInMs = now.getTime() - t.resolvedAt.getTime();
                            const diffInHours = diffInMs / (1000 * 60 * 60);
                            return diffInHours <= 24;
                        }
                        return true;
                    });
                
                setTickets(processedTickets);
            }
            
            const resultProfiles = await getProfilesAction();
            if (resultProfiles.success && resultProfiles.data) {
                setProfiles(resultProfiles.data as User[]);
            }
        } catch (err) {
            console.error("Error fetching Kanban data:", err);
        } finally {
            if (isInitial) setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData(true);
        const pollInterval = setInterval(() => {
            fetchData(false);
        }, 5000);
        return () => clearInterval(pollInterval);
    }, [fetchData, refreshCount]);

    const handleUpdate = React.useCallback(() => {
        setRefreshCount(c => c + 1);
    }, []);

    const getSubmitter = (id: string) => profiles.find(u => u.id === id);

    return (
        <div className="flex flex-col gap-8 h-full pb-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl sm:text-4xl font-black tracking-tighter text-white uppercase italic">Tablero de Control</h1>
                    <p className="text-zinc-500 font-medium text-xs sm:text-sm">
                        Bienvenido. Visualiza y gestiona el flujo de requerimientos contractuales en tiempo real.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <Button asChild size="sm" data-tour="new-ticket-btn" className="bg-primary hover:bg-primary/90 text-black font-bold shadow-[0_0_20px_rgba(59,130,246,0.3)]">
                        <Link href="/dashboard/tickets/new" className="flex items-center gap-2">
                            <PlusCircle className="h-4 w-4" />
                            Nueva Solicitud (SLA)
                        </Link>
                    </Button>
                </div>
            </div>

            {/* Desktop View: Grid Layout */}
            <div data-tour="kanban-board" className="hidden lg:grid grid-cols-4 gap-4 h-full">
                {COLUMNS.map((columnStatus) => (
                    <div key={columnStatus} className="flex flex-col bg-black/20 backdrop-blur-sm rounded-2xl p-4 gap-4 border border-white/5 ring-1 ring-white/5">
                        <div className="flex items-center justify-between px-1">
                            <h3 className="font-bold text-xs uppercase tracking-[0.2em] text-zinc-400">{columnStatus}</h3>
                            <Badge variant="secondary" className="rounded-full bg-white/5 text-zinc-400 border-none px-2 py-0">
                                {tickets.filter(t => t.status === columnStatus).length}
                            </Badge>
                        </div>

                        <div className="flex flex-col gap-3 flex-1 overflow-y-auto min-h-[500px] custom-scrollbar pr-1">
                            {tickets.filter(t => t.status === columnStatus).map(ticket => (
                                <TicketCard 
                                    key={ticket.id} 
                                    ticket={ticket} 
                                    submitter={getSubmitter(ticket.submitterId)} 
                                    onClick={() => setSelectedId(ticket.id)} 
                                />
                            ))}
                            {!loading && tickets.filter(t => t.status === columnStatus).length === 0 && (
                                <div className="flex-1 flex items-center justify-center border-2 border-dashed border-white/5 rounded-2xl p-6">
                                    <span className="text-[10px] uppercase font-bold tracking-widest text-zinc-600 text-center">Sin requerimientos</span>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* Mobile/Tablet View: Tabs Layout */}
            <div className="lg:hidden flex flex-col h-full">
                <Tabs defaultValue="Ingresado" className="w-full">
                    <TabsList className="w-full grid grid-cols-2 sm:grid-cols-4 bg-black/40 border border-white/10 p-1 mb-4 h-auto gap-1">
                        {COLUMNS.map(col => (
                            <TabsTrigger key={col} value={col} className="text-[10px] font-bold uppercase tracking-wider h-auto py-2 whitespace-normal text-center">
                                {col} ({tickets.filter(t => t.status === col).length})
                            </TabsTrigger>
                        ))}
                    </TabsList>
                    {COLUMNS.map(col => (
                        <TabsContent key={col} value={col} className="mt-0 space-y-3">
                             {tickets.filter(t => t.status === col).map(ticket => (
                                <TicketCard 
                                    key={ticket.id} 
                                    ticket={ticket} 
                                    submitter={getSubmitter(ticket.submitterId)} 
                                    onClick={() => setSelectedId(ticket.id)} 
                                />
                            ))}
                            {!loading && tickets.filter(t => t.status === col).length === 0 && (
                                <div className="flex items-center justify-center border-2 border-dashed border-white/5 rounded-2xl p-10">
                                    <span className="text-xs font-bold uppercase tracking-widest text-zinc-600">Sin requerimientos</span>
                                </div>
                            )}
                        </TabsContent>
                    ))}
                </Tabs>
            </div>

            <Sheet open={!!selectedId} onOpenChange={(val) => !val && setSelectedId(null)}>
                <SheetContent className="w-full max-w-none sm:max-w-md md:max-w-2xl glass-panel border-l-primary/20 p-0 overflow-hidden">
                    <SheetTitle className="sr-only">Detalles del Requerimiento</SheetTitle>
                    {selectedId && (
                        <div className="h-full flex flex-col p-3 sm:p-6 pt-[max(1.25rem,env(safe-area-inset-top)+0.5rem)] sm:pt-6">
                            <TicketDetailsInfo ticketId={selectedId} onUpdate={handleUpdate} />
                        </div>
                    )}
                </SheetContent>
            </Sheet>
        </div>
    );
}
