import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Ticket } from "@/lib/definitions";
import { CheckCircle, CircleDot, AlertTriangle, Ticket as TicketIcon } from "lucide-react";

export function StatCards({ tickets = [] }: { tickets?: Ticket[] }) {
  const safeTickets = tickets || [];
  const openTickets = safeTickets.filter(t => t.status === 'Ingresado').length;
  const inProgressTickets = safeTickets.filter(t => t.status === 'En proceso' || t.status === 'Espera de aprobación').length;
  const resolvedTickets = safeTickets.filter(t => t.status === 'Terminado').length;
  
  // Calcular tickets que excedieron o están excediendo el tiempo contractual de SLA
  const criticalTickets = safeTickets.filter(t => {
    if (t.status === 'Terminado') {
      const resolved = t.resolvedAt || t.updatedAt;
      return resolved > t.dueAt;
    }
    const now = new Date();
    return now > t.dueAt;
  }).length;

  return (
    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
      <Card className="glass-card border-none bg-blue-500/5 hover:bg-blue-500/10 transition-colors">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-xs font-bold uppercase tracking-wider text-blue-400">Nuevos</CardTitle>
          <CircleDot className="h-4 w-4 text-blue-400" />
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-black text-white">{openTickets}</div>
          <p className="text-[10px] text-zinc-500 mt-1">Requerimientos por asignar</p>
        </CardContent>
      </Card>

      <Card className="glass-card border-none bg-yellow-500/5 hover:bg-yellow-500/10 transition-colors">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-xs font-bold uppercase tracking-wider text-yellow-500">En Curso</CardTitle>
          <TicketIcon className="h-4 w-4 text-yellow-500" />
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-black text-white">{inProgressTickets}</div>
          <p className="text-[10px] text-zinc-500 mt-1">Siendo trabajados hoy</p>
        </CardContent>
      </Card>

      <Card className="glass-card border-none bg-emerald-500/5 hover:bg-emerald-500/10 transition-colors">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-xs font-bold uppercase tracking-wider text-emerald-400">Completos</CardTitle>
          <CheckCircle className="h-4 w-4 text-emerald-400" />
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-black text-white">{resolvedTickets}</div>
          <p className="text-[10px] text-zinc-500 mt-1">Resoluciones históricas totales</p>
        </CardContent>
      </Card>

      <Card className="glass-card border-none bg-red-500/5 hover:bg-red-500/10 transition-colors">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-xs font-bold uppercase tracking-wider text-red-500">Alertas SLA</CardTitle>
          <AlertTriangle className="h-4 w-4 text-red-500 animate-pulse" />
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-black text-white">{criticalTickets}</div>
          <p className="text-[10px] text-zinc-500 mt-1">Tickets fuera de tiempo legal</p>
        </CardContent>
      </Card>
    </div>
  );
}
