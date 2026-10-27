"use client";

import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TicketPriority, TicketStatus, Ticket } from "@/lib/definitions";

export function Reports({ tickets = [] }: { tickets?: Ticket[] }) {
  const statusCounts: Record<TicketStatus, number> = {
    Ingresado: 0,
    "En proceso": 0,
    "Espera de aprobación": 0,
    Terminado: 0,
  };

  const priorityCounts: Record<TicketPriority, number> = {
    Baja: 0,
    Media: 0,
    Alta: 0,
    Crítica: 0,
  };

  tickets.forEach(ticket => {
    if (statusCounts[ticket.status] !== undefined) {
      statusCounts[ticket.status]++;
    }
    if (priorityCounts[ticket.priority] !== undefined) {
      priorityCounts[ticket.priority]++;
    }
  });

  const statusData = Object.entries(statusCounts).map(([name, total]) => ({ name, total }));
  const priorityData = Object.entries(priorityCounts).map(([name, total]) => ({ name, total }));

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Requerimientos por Estado</CardTitle>
        </CardHeader>
        <CardContent className="pl-2">
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={statusData}>
              <XAxis
                dataKey="name"
                stroke="#888888"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="#888888"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `${value}`}
              />
              <Bar dataKey="total" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Requerimientos por Prioridad</CardTitle>
        </CardHeader>
        <CardContent className="pl-2">
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={priorityData}>
              <XAxis
                dataKey="name"
                stroke="#888888"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="#888888"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `${value}`}
              />
              <Bar dataKey="total" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
