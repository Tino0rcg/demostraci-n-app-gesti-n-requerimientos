"use server";

import { createClient as createSupabaseJS } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'
import { sendTicketNotification } from './notifications'
import { findBestTechnicianForTicket } from '@/lib/assignment-utils'

function createAdminClient() {
  return createSupabaseJS(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

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

        // 3. Notificación por Correo al Solicitante
        try {
            await sendTicketNotification(ticket.id, 'Nuevo Requerimiento Registrado', 'submitter');
        } catch(e) {
            console.error("Fallo de notificacion al solicitante:", e);
        }

        // 4. Si fue asignado a un técnico, notificar al técnico de inmediato
        if (assignment.technicianId) {
            try {
                await sendTicketNotification(ticket.id, 'Nuevo Requerimiento Asignado para Atención', 'assignee');
            } catch(e) {
                console.error("Fallo de notificacion al tecnico asignado:", e);
            }
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
        if (data.status && oldTicket?.status !== data.status) {
            actionMessage = `Cambio de Estado a ${data.status}`;
        } else if (data.tecnico_asignado_id !== undefined && oldTicket?.tecnico_asignado_id !== data.tecnico_asignado_id) {
            actionMessage = 'Reasignación de Técnico';
        }

        // Lanzar Notificación al Cliente
        try {
            await sendTicketNotification(id, actionMessage, 'submitter');
        } catch(e) {
            console.error("Fallo de notificacion (update):", e);
        }

        // Si es reasignación de técnico, notificar también al nuevo técnico responsable
        if (data.tecnico_asignado_id && oldTicket?.tecnico_asignado_id !== data.tecnico_asignado_id) {
            try {
                await sendTicketNotification(id, 'Has sido reasignado como responsable de este caso', 'assignee');
            } catch(e) {
                console.error("Fallo de notificacion al nuevo tecnico:", e);
            }
        }

        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message || "Error al actualizar ticket" };
    }
}

export async function getTicketsAction() {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return { success: false, data: [] };

        const supabaseAdmin = createAdminClient();
        
        // 1. Obtener el perfil del usuario para conocer su rol y empresa
        const { data: profile } = await supabaseAdmin
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();

        if (!profile) return { success: false, data: [] };

        const role = profile.role?.trim();
        const empresaId = profile.company_id; // Sincronizado con DB

        // 2. Construir query base con relación a servicios para obtener la categoría
        let query = supabaseAdmin.from('tickets').select('*, services(category)');

        // 3. Aplicar filtros según el ROL
        if (role === 'Técnico') {
            // El técnico solo ve lo que tiene asignado
            query = query.eq('tecnico_asignado_id', user.id);
        } else if (role === 'Administrador Cliente') {
            // El admin cliente ve todo de su empresa
            if (empresaId) {
                query = query.eq('company_id', empresaId);
            } else {
                // Fallback de seguridad: si no tiene empresa, no ve nada
                return { success: true, data: [] };
            }
        } else if (role === 'Usuario') {
            // El cliente solo ve lo que él creó
            query = query.eq('creador_id', user.id);
        }
        // El 'Administrador Full' no tiene filtros adicionales

        const { data, error } = await query.order('created_at', { ascending: false });

        if (error) throw error;

        // Formatear fechas para el frontend
        const formattedData = data.map(t => ({
            ...t,
            createdAt: new Date(t.created_at),
            updatedAt: new Date(t.updated_at),
            dueAt: new Date(t.due_at),
            resolvedAt: t.resolved_at ? new Date(t.resolved_at) : null,
            submitterId: t.creador_id || t.submitter_id,
            assigneeId: t.tecnico_asignado_id || t.assignee_id,
            category: t.services?.category || 'General' // Mapear desde la relación
        }));

        return { success: true, data: formattedData };
    } catch (error: any) {
        console.error("Error en getTicketsAction:", error);
        return { success: false, data: [], error: error.message };
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

        // Obtener el ticket para saber quiénes son los involucrados
        const { data: ticket } = await supabaseAdmin.from('tickets').select('creador_id, tecnico_asignado_id').eq('id', ticketId).single();
        
        // No enviar notificaciones de chat para mensajes automáticos del sistema
        if (ticket && !content.trim().startsWith('[SISTEMA]')) {
            let targetRole: 'submitter' | 'assignee' = 'submitter';
            
            // Si el que escribe es el cliente, notificamos al técnico
            if (authorId === ticket.creador_id && ticket.tecnico_asignado_id) {
                targetRole = 'assignee';
            }
            // Si el que escribe es el técnico (o un admin distinto al creador), notificamos al cliente
            else {
                targetRole = 'submitter';
            }

            try {
                await sendTicketNotification(ticketId, 'Nuevo Mensaje en el Chat', targetRole);
            } catch(e) {
                console.error("Fallo de notificacion (chat):", e);
            }
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

        if (error) return { success: false, error: error.message };
        return { success: true, data };
    } catch (error: any) {
        return { success: false, error: error.message || "Error al obtener ticket" };
    }
}
