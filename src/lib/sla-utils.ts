import { Ticket } from "./definitions";

export function getSlaStatus(ticket?: Partial<Ticket> | null): { color: string; label: string } {
    if (!ticket) {
        return { color: "bg-zinc-500", label: "Sin estado" };
    }
    const now = new Date();
    const isTerminado = ticket.status === 'Terminado';
    const dueTime = ticket.dueAt ? new Date(ticket.dueAt).getTime() : now.getTime() + 86400000;
    const updatedTime = ticket.updatedAt ? new Date(ticket.updatedAt).getTime() : now.getTime();
    const resolvedTime = ticket.resolvedAt ? new Date(ticket.resolvedAt).getTime() : updatedTime;

    if (isTerminado) {
        if (resolvedTime <= dueTime) {
            return { color: "bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.8)] animate-pulse", label: "A tiempo (Resuelto)" };
        } else {
            return { color: "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)] animate-pulse", label: "Incumplido (Resuelto tarde)" };
        }
    } else if (ticket.status === 'Espera de aprobación') {
        if (updatedTime <= dueTime) {
            return { color: "bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.8)] animate-pulse", label: "Pausado (A tiempo, esperando cliente)" };
        } else {
            return { color: "bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.8)] animate-pulse", label: "Pausado (Atrasado antes de enviar)" };
        }
    } else {
        if (now.getTime() <= dueTime) {
            return { color: "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.8)] animate-pulse", label: "A tiempo (Vigente)" };
        } else {
            return { color: "bg-yellow-500 shadow-[0_0_8px_rgba(234,179,8,0.8)] animate-pulse", label: "Riesgo (Excediendo SLA)" };
        }
    }
}

export const SERVICE_RESPONSE_SLA_MAP: Record<string, string> = {
    'Computadores y notebooks': '2 h',
    'Impresoras y periféricos': '2 h',
    'Sistemas operativos': '2 h',
    'Aplicaciones y software corporativo': '2 h',
    'Internet y conectividad': '1 h',
    'Redes LAN y Wi-Fi': '1 h',
    'VPN y acceso remoto': '1 h',
    'Correo electrónico y Microsoft 365 / Google Workspace': '1 h',
    'Cuentas de usuario y contraseñas': '1 h',
    'Permisos y accesos': '2 h',
    'Servidores e infraestructura TI': '1 h',
    'Respaldos y recuperación de datos': '1 h',
    'Antivirus y seguridad informática': '30 min',
    'ERP, CRM y sistemas corporativos': '2 h',
    'Aplicaciones web y servicios cloud': '2 h',
};

export function getServiceResponseSla(serviceName: string): string {
    return SERVICE_RESPONSE_SLA_MAP[serviceName] || '1 h';
}

