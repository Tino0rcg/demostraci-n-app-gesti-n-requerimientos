import { Ticket } from "./definitions";

export function getSlaStatus(ticket: Ticket): { color: string; label: string } {
    const now = new Date();
    const isTerminado = ticket.status === 'Terminado';

    if (isTerminado) {
        // Si no existe fecha de resolución empírica, usamos updatedAt como fallback para el mock.
        const resolved = ticket.resolvedAt || ticket.updatedAt;
        if (resolved <= ticket.dueAt) {
            return { color: "bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.8)] animate-pulse", label: "A tiempo (Resuelto)" };
        } else {
            return { color: "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)] animate-pulse", label: "Incumplido (Resuelto tarde)" };
        }
    } else if (ticket.status === 'Espera de aprobación') {
        // Pausar SLA: Evaluar en base al momento en que el técnico lo envió a revisión (updatedAt)
        // en lugar de usar `now`, para no castigar al técnico si el cliente demora.
        if (ticket.updatedAt <= ticket.dueAt) {
            return { color: "bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.8)] animate-pulse", label: "Pausado (A tiempo, esperando cliente)" };
        } else {
            return { color: "bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.8)] animate-pulse", label: "Pausado (Atrasado antes de enviar)" };
        }
    } else {
        if (now <= ticket.dueAt) {
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

