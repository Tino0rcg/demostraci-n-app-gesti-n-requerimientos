import { TicketTable } from "@/components/dashboard/ticket-table";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { getTicketsAction } from "@/app/actions/tickets";
import { getProfilesAction } from "@/app/actions/profiles";
import type { Ticket, User } from "@/lib/definitions";

export const dynamic = 'force-dynamic';

export default async function HistorialTicketsPage() {
    const ticketsRes = await getTicketsAction();
    const profilesRes = await getProfilesAction();

    const tickets = (ticketsRes.success ? ticketsRes.data : []) as Ticket[];
    const allUsers = (profilesRes.success ? profilesRes.data : []) as User[];

    const now = new Date();
    const finishedTickets = tickets.filter(t => {
        if (t.status !== 'Terminado') return false;
        if (!t.resolvedAt) return false; // En caso de tickets antiguos sin fecha
        const diffInMs = now.getTime() - new Date(t.resolvedAt).getTime();
        const diffInHours = diffInMs / (1000 * 60 * 60);
        return diffInHours > 24;
    });

    return (
        <div className="flex flex-col gap-6 w-full min-w-0">
            <div data-tour="historial-view" className="flex items-start sm:items-center gap-3 sm:gap-4">
                <Button variant="outline" size="icon" asChild className="shrink-0 mt-1 sm:mt-0 glass-card bg-black/20 border-white/10">
                    <Link href="/dashboard">
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                </Button>
                <div>
                    <h1 className="text-xl sm:text-3xl font-bold tracking-tight text-white uppercase italic leading-tight">Historial de Tickets</h1>
                    <p className="text-muted-foreground mt-1 text-xs sm:text-sm">
                        Registro histórico de todos los requerimientos finalizados y cerrados.
                    </p>
                </div>
            </div>

            <TicketTable tickets={finishedTickets} allUsers={allUsers} />
        </div>
    );
}
