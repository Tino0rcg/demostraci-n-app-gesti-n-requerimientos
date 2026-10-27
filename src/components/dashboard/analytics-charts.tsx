"use client";

import { useEffect, useState } from "react";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Cell,
  PieChart,
  Pie,
  Legend
} from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { Ticket, User } from "@/lib/definitions";

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4'];

export function AnalyticsCharts({ 
  tickets = [], 
  allUsers = [], 
  services = [] 
}: { 
  tickets?: Ticket[], 
  allUsers?: User[], 
  services?: any[] 
}) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const safeTickets = tickets || [];
  const safeUsers = allUsers || [];

  // 1. Tickets por Organización / Empresa
  const companyData = Object.entries(
    safeTickets.reduce((acc, t) => {
      const user = safeUsers.find(u => u.id === t.submitterId);
      const empresa = user?.empresa || (t as any).companies?.name || "Vanguardia";
      acc[empresa] = (acc[empresa] || 0) + 1;
      return acc;
    }, {} as Record<string, number>)
  ).map(([name, value]) => ({ name, value }))
   .sort((a, b) => b.value - a.value);

  // 2. Desempeño y Cumplimiento de Técnicos
  const assignedIds = new Set(safeTickets.map(t => t.assigneeId).filter(Boolean));
  const activeTechs = safeUsers.filter(u => u.role === 'Técnico' || assignedIds.has(u.id));

  // Obtener las categorías reales presentes en los tickets o catálogo
  const detectedCategories = Array.from(new Set(safeTickets.map(t => t.category).filter(Boolean)));
  const dynamicCategories = detectedCategories.length > 0 
    ? detectedCategories 
    : ['Equipos TI', 'Software', 'Redes', 'Seguridad'];

  const techServiceSla = activeTechs.map(tec => {
    const techTickets = safeTickets.filter(t => t.assigneeId === tec.id);
    const data: Record<string, any> = { 
      name: tec.name.split(' ')[0] || tec.name 
    };

    dynamicCategories.forEach(cat => {
      const catTickets = techTickets.filter(t => t.category === cat);
      if (catTickets.length === 0) {
        data[cat] = 0;
      } else {
        const onTime = catTickets.filter(t => {
          if (!t.resolvedAt) return new Date() <= t.dueAt;
          return t.resolvedAt <= t.dueAt;
        }).length;
        data[cat] = Math.round((onTime / catTickets.length) * 100);
      }
    });

    return data;
  });

  // 3. Distribución por Categoría de Servicio
  const rawServiceDistribution = Object.entries(
    safeTickets.reduce((acc, t) => {
      const cat = t.category || "General";
      acc[cat] = (acc[cat] || 0) + 1;
      return acc;
    }, {} as Record<string, number>)
  ).map(([name, value]) => ({ name, value }));

  const serviceDistribution = rawServiceDistribution.length > 0
    ? rawServiceDistribution
    : [{ name: "Sin tickets", value: 1 }];

  // 4. Catálogo de Servicios y Tiempos de Respuesta
  const serviceSlaData = (services && services.length > 0)
    ? services.slice(0, 8).map(s => ({
        name: s.name.length > 20 ? s.name.slice(0, 18) + '...' : s.name,
        horas: Number(s.sla_hours) || 2
      }))
    : [
        { name: 'Hardware Crítico', horas: 4 },
        { name: 'Redes y Conexión', horas: 12 },
        { name: 'Software y Apps', horas: 24 },
        { name: 'Cuentas y Accesos', horas: 48 },
      ];

  if (!isMounted) {
    return (
      <div className="grid gap-6 grid-cols-1 sm:grid-cols-2">
        <div className="h-[250px] bg-white/5 rounded-xl animate-pulse" />
        <div className="h-[250px] bg-white/5 rounded-xl animate-pulse" />
      </div>
    );
  }

  return (
    <div className="grid gap-6 grid-cols-1 sm:grid-cols-2">
      {/* Gráfico 1: Tickets por Empresa */}
      <Card className="glass-card border-white/5 bg-black/20">
        <CardHeader>
          <CardTitle className="text-sm font-bold uppercase tracking-wider text-zinc-400">Demanda por Organización</CardTitle>
          <CardDescription>Volumen total de requerimientos por cliente</CardDescription>
        </CardHeader>
        <CardContent className="h-[250px] sm:h-[300px]">
          {companyData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={companyData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" horizontal={false} />
                <XAxis type="number" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis dataKey="name" type="category" stroke="#888888" fontSize={11} tickLine={false} axisLine={false} width={110} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#18181b', border: '1px solid #ffffff10', borderRadius: '8px' }}
                  itemStyle={{ color: '#3b82f6' }}
                />
                <Bar dataKey="value" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={22} name="Requerimientos" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-xs text-zinc-500">Sin requerimientos registrados</div>
          )}
        </CardContent>
      </Card>

      {/* Gráfico 2: Desempeño Técnico vs SLA por Categoría */}
      <Card className="glass-card border-white/5 bg-black/20">
        <CardHeader>
          <CardTitle className="text-sm font-bold uppercase tracking-wider text-zinc-400">Cumplimiento SLA por Especialista</CardTitle>
          <CardDescription>% de resoluciones a tiempo según categoría</CardDescription>
        </CardHeader>
        <CardContent className="h-[250px] sm:h-[300px]">
          {techServiceSla.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={techServiceSla}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                <XAxis dataKey="name" stroke="#888888" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} unit="%" domain={[0, 100]} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#18181b', border: '1px solid #ffffff10', borderRadius: '8px' }}
                  cursor={{ fill: 'rgba(255,255,255,0.03)' }}
                />
                <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '10px' }} />
                {dynamicCategories.slice(0, 4).map((cat, idx) => (
                  <Bar key={cat} dataKey={cat} fill={COLORS[idx % COLORS.length]} radius={[4, 4, 0, 0]} name={cat} />
                ))}
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-xs text-zinc-500">Sin especialistas con tickets asignados</div>
          )}
        </CardContent>
      </Card>

      {/* Gráfico 3: Distribución por Categoría de Servicio */}
      <Card className="glass-card border-white/5 bg-black/20">
        <CardHeader>
          <CardTitle className="text-sm font-bold uppercase tracking-wider text-zinc-400">Incidencia por Categoría</CardTitle>
          <CardDescription>Tipos de servicios con mayor frecuencia</CardDescription>
        </CardHeader>
        <CardContent className="h-[250px] sm:h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={serviceDistribution}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={80}
                paddingAngle={4}
                dataKey="value"
              >
                {serviceDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ backgroundColor: '#18181b', border: '1px solid #ffffff10', borderRadius: '8px' }}
              />
              <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: '10px' }} />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Gráfico 4: Análisis de Latencia y Horas SLA del Catálogo */}
      <Card className="glass-card border-white/5 bg-black/20">
        <CardHeader>
          <CardTitle className="text-sm font-bold uppercase tracking-wider text-zinc-400">Tiempos de Respuesta (Catálogo)</CardTitle>
          <CardDescription>Horas máximas de compromiso de SLA por servicio</CardDescription>
        </CardHeader>
        <CardContent className="h-[250px] sm:h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={serviceSlaData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" horizontal={false} />
              <XAxis type="number" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} unit="h" />
              <YAxis dataKey="name" type="category" stroke="#888888" fontSize={10} tickLine={false} axisLine={false} width={110} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#18181b', border: '1px solid #ffffff10', borderRadius: '8px' }}
              />
              <Bar dataKey="horas" fill="#f59e0b" radius={[0, 4, 4, 0]} barSize={16} name="Horas SLA" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
