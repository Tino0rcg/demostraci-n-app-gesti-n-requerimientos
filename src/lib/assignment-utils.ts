export interface BestTechnicianResult {
    technicianId: string | null;
    technicianName: string | null;
    technicianSpecialty: string | null;
    activeTicketsCount: number;
    matchType: 'specialty' | 'general_fallback' | 'none';
}

function normalizeText(text: string): string {
    return text
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .trim();
}

/**
 * Determina si la especialidad del técnico concuerda con la categoría o servicio solicitado.
 */
export function matchesSpecialty(specialty: string, category: string, serviceName: string = ''): boolean {
    if (!specialty) return false;

    const normSpecialty = normalizeText(specialty);
    const normCategory = normalizeText(category);
    const normService = normalizeText(serviceName);

    // 1. Coincidencia directa o mutua
    if (normSpecialty.includes(normCategory) || normCategory.includes(normSpecialty)) {
        return true;
    }

    if (normService && (normSpecialty.includes(normService) || normService.includes(normSpecialty))) {
        return true;
    }

    // 2. Mapeo semántico de categorías oficiales de TI a especialidades
    const specialtyKeywordMap: Record<string, string[]> = {
        'equipos ti': ['equipo', 'equipos', 'computador', 'notebook', 'laptop', 'impresora', 'periferico', 'hardware'],
        'hardware': ['equipo', 'equipos', 'computador', 'notebook', 'laptop', 'impresora', 'periferico', 'hardware'],
        'software': ['software', 'sistema', 'sistemas', 'windows', 'macos', 'linux', 'ofimatica', 'office', 'aplicacion', 'driver'],
        'redes': ['red', 'redes', 'conectividad', 'internet', 'lan', 'wifi', 'wi-fi', 'vpn', 'router', 'switch', 'enlace'],
        'cuentas y colaboracion': ['cuenta', 'usuario', 'contrasena', 'credencial', 'permiso', 'acceso', 'correo', 'm365', 'google', 'teams'],
        'cuentas': ['cuenta', 'usuario', 'contrasena', 'permiso', 'acceso'],
        'infraestructura y seguridad': ['servidor', 'servidores', 'infraestructura', 'respaldo', 'backup', 'recuperacion', 'antivirus', 'seguridad', 'firewall'],
        'seguridad': ['antivirus', 'seguridad', 'ciberseguridad', 'firewall', 'amenaza'],
        'sistemas empresariales': ['erp', 'crm', 'facturacion', 'web', 'cloud', 'saas', 'base de datos', 'corporativo'],
    };

    for (const [keyCategory, keywords] of Object.entries(specialtyKeywordMap)) {
        if (normCategory.includes(keyCategory) || normService.includes(keyCategory)) {
            const hasKeyword = keywords.some(kw => normSpecialty.includes(kw));
            if (hasKeyword) return true;
        }
    }

    return false;
}

/**
 * Encuentra el mejor técnico disponible combinando concordancia de especialidad
 * y balance equitativo de carga (Round-Robin / Least-Loaded).
 */
export async function findBestTechnicianForTicket(
    category: string,
    serviceName: string,
    supabaseAdmin: any
): Promise<BestTechnicianResult> {
    try {
        // 1. Obtener todos los técnicos activos que no estén fuera de turno
        const { data: technicians, error: techError } = await supabaseAdmin
            .from('profiles')
            .select('id, name, email, specialty, status')
            .eq('role', 'Técnico');

        if (techError || !technicians || technicians.length === 0) {
            return {
                technicianId: null,
                technicianName: null,
                technicianSpecialty: null,
                activeTicketsCount: 0,
                matchType: 'none'
            };
        }

        // Filtrar técnicos disponibles (excluyendo explícitamente a los "Fuera de turno")
        const availableTechs = technicians.filter((t: any) => {
            const status = (t.status || '').toLowerCase().trim();
            return status !== 'fuera de turno';
        });

        const activeRoster = availableTechs.length > 0 ? availableTechs : technicians;

        // 2. Filtrar por especialidad
        const specialists = activeRoster.filter((tech: any) =>
            matchesSpecialty(tech.specialty || '', category, serviceName)
        );

        const candidates = specialists.length > 0 ? specialists : activeRoster;
        const matchType = specialists.length > 0 ? 'specialty' : 'general_fallback';

        // 3. Consultar carga de trabajo activa de los candidatos
        const candidateIds = candidates.map((c: any) => c.id);

        const { data: activeTickets, error: ticketsError } = await supabaseAdmin
            .from('tickets')
            .select('id, tecnico_asignado_id, created_at')
            .in('tecnico_asignado_id', candidateIds)
            .in('status', ['Ingresado', 'En proceso', 'Espera de aprobación']);

        const ticketsList = (!ticketsError && activeTickets) ? activeTickets : [];

        // 4. Calcular métricas por candidato (conteo de tickets y fecha del último asignado para Round-Robin)
        const candidatesWithStats = candidates.map((tech: any) => {
            const techTickets = ticketsList.filter((t: any) => t.tecnico_asignado_id === tech.id);
            const activeCount = techTickets.length;

            let latestAssignedTimestamp = 0;
            techTickets.forEach((t: any) => {
                const ts = t.created_at ? new Date(t.created_at).getTime() : 0;
                if (ts > latestAssignedTimestamp) latestAssignedTimestamp = ts;
            });

            return {
                tech,
                activeCount,
                latestAssignedTimestamp
            };
        });

        // 5. Ordenar:
        //    Prioridad 1: Menor número de tickets activos (Least-Loaded)
        //    Prioridad 2: Asignado hace más tiempo o nunca (Round-Robin tie-breaker)
        candidatesWithStats.sort((a: any, b: any) => {
            if (a.activeCount !== b.activeCount) {
                return a.activeCount - b.activeCount;
            }
            return a.latestAssignedTimestamp - b.latestAssignedTimestamp;
        });

        const selected = candidatesWithStats[0];

        return {
            technicianId: selected.tech.id,
            technicianName: selected.tech.name,
            technicianSpecialty: selected.tech.specialty || 'General',
            activeTicketsCount: selected.activeCount,
            matchType
        };
    } catch (err) {
        console.error("Error en findBestTechnicianForTicket:", err);
        return {
            technicianId: null,
            technicianName: null,
            technicianSpecialty: null,
            activeTicketsCount: 0,
            matchType: 'none'
        };
    }
}
