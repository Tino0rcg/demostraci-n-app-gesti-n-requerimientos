"use server";

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendTicketNotification } from './notifications'
import { findBestTechnicianForTicket } from '@/lib/assignment-utils'
import { getCurrentUserSession } from '@/lib/session'
import { tickets as initialTickets } from '@/lib/data'

export async function createTicketAction(data: {
    subject: string;
    description: string;
    priority: string;
    category: string;
    service_id: string;
    submitter_id: string;
    due_at: string;
    image_url?: string;
}) {
    try {
        const supabaseAdmin = createAdminClient();
        
        const now = new Date().toISOString();
        
        // Si hay una imagen, la anexamos a la descripción con un marcador especial
        let finalDescription = data.description;
        if (data.image_url) {
            finalDescription += `\n\n[ADJUNTO_IMAGEN]: ${data.image_url}`;
        }

        const { image_url, category, submitter_id, ...baseData } = data; // Extraer 'category' para no incluirla en el insert

        // Obtener el company_id del usuario para asociarlo al ticket
        const { data: profile } = await supabaseAdmin.from('profiles').select('company_id').eq('id', submitter_id).single();

        // 1. Asignación Automática: Especialidad + Menor Carga (Round-Robin)
        const assignment = await findBestTechnicianForTicket(category, data.subject, supabaseAdmin);

        const { data: ticket, error: ticketError } = await supabaseAdmin.from('tickets').insert([{
            ...baseData,
            creador_id: submitter_id,
            tecnico_asignado_id: assignment.technicianId || null,
            company_id: profile?.company_id || null,
            description: finalDescription,
            status: 'Ingresado',
            created_at: now,
            updated_at: now
        }]).select('id').single();

        if (ticketError) {
            return { success: false, error: ticketError.message };
        }

        // 2. Crear registro inicial en bitácora con detalle de la asignación
        let initialNote = "[SISTEMA] Ticket creado e ingresado al catálogo de servicios operativo.";
        if (assignment.technicianId && assignment.technicianName) {
            const reason = assignment.matchType === 'specialty'
                ? `por coincidencia de especialidad (${assignment.technicianSpecialty})`
                : `por balance equitativo de carga (cobertura general)`;
            initialNote += ` Asignado automáticamente a ${assignment.technicianName} ${reason} (${assignment.activeTicketsCount} casos activos).`;
        } else {
            initialNote += " Sin técnico disponible en turno. Pendiente de asignación manual por supervisor.";
        }

        await supabaseAdmin.from('notes').insert({
            ticket_id: ticket.id,
            author_id: data.submitter_id,
            content: initialNote,
        });

        // 3. Notificación con PDF de Trazabilidad al Solicitante y al Técnico
        try {
            const eventDesc = assignment.technicianId 
                ? 'Nuevo Requerimiento Registrado y Asignado para Atención' 
                : 'Nuevo Requerimiento Registrado (Pendiente de Asignación)';
            await sendTicketNotification(ticket.id, eventDesc, assignment.technicianId ? 'both' : 'submitter');
        } catch(e) {
            console.error("Fallo de notificacion al registrar requerimiento:", e);
        }

        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message || "Error al crear ticket" };
    }
}

export async function uploadImageAction(formData: FormData) {
    try {
        const supabaseAdmin = createAdminClient();
        const file = formData.get('file') as File;
        
        if (!file) {
            return { success: false, error: "No se proporcionó ningún archivo" };
        }

        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
        const filePath = `${fileName}`;

        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        const { data, error } = await supabaseAdmin.storage
            .from('tickets')
            .upload(filePath, buffer, {
                contentType: file.type,
                upsert: false
            });

        if (error) {
            return { success: false, error: `Error subiendo imagen: ${error.message}. Asegúrate de que el bucket 'tickets' sea público.` };
        }

        const { data: { publicUrl } } = supabaseAdmin.storage
            .from('tickets')
            .getPublicUrl(filePath);

        return { success: true, url: publicUrl };
    } catch (error: any) {
        return { success: false, error: error.message || "Error en la subida" };
    }
}

export async function updateTicketAction(id: string, data: any) {
    try {
        const supabaseAdmin = createAdminClient();
        
        // Consultar el estado ANTERIOR del ticket para comparar
        const { data: oldTicket } = await supabaseAdmin.from('tickets').select('status, tecnico_asignado_id').eq('id', id).single();
        
        const { error } = await supabaseAdmin
            .from('tickets')
            .update({
                ...data,
                updated_at: new Date().toISOString()
            })
            .eq('id', id);

        if (error) {
            return { success: false, error: error.message };
        }

        // Determinar qué cambió para el mensaje de notificación
        let actionMessage = 'Actualización en el Ticket';
        const isReassignment = data.tecnico_asignado_id !== undefined && oldTicket?.tecnico_asignado_id !== data.tecnico_asignado_id;

        if (data.status && oldTicket?.status !== data.status) {
            if (data.status === 'En proceso') {
                actionMessage = oldTicket?.status === 'Espera de aprobación' 
                    ? 'Solución Rechazada por el Cliente (En Corrección)' 
                    : 'Ticket En Proceso (Inicio de Trabajo Técnico)';
            } else if (data.status === 'Espera de aprobación') {
                actionMessage = 'Solución Propuesta (En Espera de Aprobación del Cliente)';
            } else if (data.status === 'Terminado') {
                actionMessage = 'Solución Validada y Aprobada (Ticket Terminado)';
            } else {
                actionMessage = `Cambio de Estado a "${data.status}"`;
            }
        } else if (isReassignment) {
            actionMessage = 'Asignación / Reasignación de Técnico Responsable';
        }

        // Lanzar Notificación con PDF de trazabilidad a AMBOS (Solicitante y Técnico)
        try {
            await sendTicketNotification(id, actionMessage, 'both');
        } catch(e) {
            console.error("Fallo de notificacion (update):", e);
        }

        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message || "Error al actualizar ticket" };
    }
}

export async function getTicketsAction() {
    try {
        const session = await getCurrentUserSession();
        const role = session?.role?.trim() || 'Administrador Full';
        const supabaseAdmin = createAdminClient();

        let query = supabaseAdmin.from('tickets').select('*, services(category)');

        if (role === 'Técnico' && session?.id) {
            query = query.eq('tecnico_asignado_id', session.id);
        } else if (role === 'Usuario' && session?.id) {
            query = query.eq('creador_id', session.id);
        }

        const { data, error } = await query.order('created_at', { ascending: false });

        if (error || !data || data.length === 0) {
            return { 
                success: true, 
                data: initialTickets.map(t => ({
                    ...t,
                    codigo: t.codigo || (t.id ? String(t.id).split('-')[0].toUpperCase() : 'REQ'),
                    createdAt: t.createdAt.toISOString(),
                    updatedAt: t.updatedAt.toISOString(),
                    dueAt: t.dueAt.toISOString(),
                    resolvedAt: t.resolvedAt ? t.resolvedAt.toISOString() : null,
                }))
            };
        }

        const formattedData = data.map(t => ({
            ...t,
            codigo: t.codigo || (t.id ? String(t.id).split('-')[0].toUpperCase() : 'REQ'),
            createdAt: t.created_at ? new Date(t.created_at).toISOString() : new Date().toISOString(),
            updatedAt: t.updated_at ? new Date(t.updated_at).toISOString() : new Date().toISOString(),
            dueAt: t.due_at ? new Date(t.due_at).toISOString() : new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
            resolvedAt: t.resolved_at ? new Date(t.resolved_at).toISOString() : null,
            submitterId: t.creador_id || t.submitter_id,
            assigneeId: t.tecnico_asignado_id || t.assignee_id,
            category: t.services?.category || 'General'
        }));

        return { success: true, data: formattedData };
    } catch (error: any) {
        console.error("Error en getTicketsAction:", error);
        return { 
            success: true, 
            data: initialTickets.map(t => ({
                ...t,
                codigo: t.codigo || (t.id ? String(t.id).split('-')[0].toUpperCase() : 'REQ'),
                createdAt: t.createdAt.toISOString(),
                updatedAt: t.updatedAt.toISOString(),
                dueAt: t.dueAt.toISOString(),
                resolvedAt: t.resolvedAt ? t.resolvedAt.toISOString() : null,
            }))
        };
    }
}

export async function getNotesAction(ticketId: string) {
    try {
        const supabaseAdmin = createAdminClient();
        const { data, error } = await supabaseAdmin
            .from('notes')
            .select('*')
            .eq('ticket_id', ticketId)
            .order('created_at', { ascending: true });

        if (error) return { success: false, error: error.message };
        return { success: true, data };
    } catch (error: any) {
        return { success: false, error: error.message || "Error al obtener notas" };
    }
}

export async function createNoteAction(ticketId: string, authorId: string, content: string) {
    try {
        const supabaseAdmin = createAdminClient();
        const { error } = await supabaseAdmin.from('notes').insert({
            ticket_id: ticketId,
            author_id: authorId,
            content: content
        });

        if (error) return { success: false, error: error.message };

        // Enviar notificaciones por correo/push en segundo plano para no demorar el chat (Ultra-rápido)
        if (!content.trim().startsWith('[SISTEMA]')) {
            (async () => {
                try {
                    const { data: ticket } = await supabaseAdmin.from('tickets').select('creador_id, tecnico_asignado_id').eq('id', ticketId).single();
                    if (ticket) {
                        let targetRole: 'submitter' | 'assignee' = 'submitter';
                        if (authorId === ticket.creador_id && ticket.tecnico_asignado_id) {
                            targetRole = 'assignee';
                        }
                        await sendTicketNotification(ticketId, 'Nuevo Mensaje en el Chat', targetRole);
                    }
                } catch (e) {
                    console.error("Fallo de notificacion asincrona (chat):", e);
                }
            })();
        }

        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message || "Error al crear nota" };
    }
}
export async function getTicketAction(id: string) {
    try {
        const supabaseAdmin = createAdminClient();
        const { data, error } = await supabaseAdmin
            .from('tickets')
            .select('*')
            .eq('id', id)
            .single();

        if (error || !data) {
            const fallback = initialTickets.find(t => t.id === id);
            if (fallback) {
                return { 
                    success: true, 
                    data: {
                        ...fallback,
                        created_at: fallback.createdAt.toISOString(),
                        updated_at: fallback.updatedAt.toISOString(),
                        due_at: fallback.dueAt.toISOString(),
                        resolved_at: fallback.resolvedAt ? fallback.resolvedAt.toISOString() : null,
                    } 
                };
            }
            return { success: false, error: error?.message || "Ticket no encontrado" };
        }
        return { success: true, data };
    } catch (error: any) {
        const fallback = initialTickets.find(t => t.id === id);
        if (fallback) {
            return { 
                success: true, 
                data: {
                    ...fallback,
                    created_at: fallback.createdAt.toISOString(),
                    updated_at: fallback.updatedAt.toISOString(),
                    due_at: fallback.dueAt.toISOString(),
                    resolved_at: fallback.resolvedAt ? fallback.resolvedAt.toISOString() : null,
                } 
            };
        }
        return { success: false, error: error.message || "Error al obtener ticket" };
    }
}
