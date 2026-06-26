"use server"

import { renderToBuffer } from "@react-pdf/renderer";
import nodemailer from "nodemailer";
import { TicketPDF } from "@/components/pdf/ticket-pdf";
import { createClient } from "@/lib/supabase/server";
import { Ticket, User, Note } from "@/lib/definitions";

const transporter = nodemailer.createTransport({
    host: 'smtp-relay.brevo.com',
    port: 587,
    auth: {
        user: process.env.BREVO_SMTP_LOGIN || 'test',
        pass: process.env.BREVO_SMTP_KEY || 'test',
    }
});

export async function sendTicketNotification(ticketId: string, actionType: string, targetRole: 'submitter' | 'assignee' = 'submitter') {
    try {
        const supabase = await createClient();

        // 1. Recopilar info desde la BD
        const { data: ticketData, error: ticketError } = await supabase
            .from('tickets')
            .select('*')
            .eq('id', ticketId)
            .single();

        if (ticketError || !ticketData) return { success: false, error: 'Ticket no encontrado' };
        
        // Transformar tabla a tipo Ticket
        const ticket: Ticket = {
            ...ticketData,
            createdAt: new Date(ticketData.created_at),
            updatedAt: new Date(ticketData.updated_at),
            dueAt: new Date(ticketData.due_at),
            resolvedAt: ticketData.resolved_at ? new Date(ticketData.resolved_at) : null,
            submitterId: ticketData.creador_id,
            assigneeId: ticketData.tecnico_asignado_id,
        };

        // Notas (Bitácora)
        const { data: notesData } = await supabase
            .from('notes')
            .select('*')
            .eq('ticket_id', ticketId)
            .order('created_at', { ascending: true });
        
        const notes: Note[] = (notesData || []).map(n => ({
            ...n,
            ticketId: n.ticket_id,
            authorId: n.author_id,
            createdAt: new Date(n.created_at),
        }));

        // Perfiles (Submitter y Assignee)
        const { data: submitterData } = await supabase.from('profiles').select('*').eq('id', ticket.submitterId).single();
        const { data: assigneeData } = await supabase.from('profiles').select('*').eq('id', ticket.assigneeId).single();

        const submitter = submitterData as User;
        const assignee = assigneeData as User;

        // 2. Renderizar PDF estructurado
        const element = TicketPDF({ 
            ticket, 
            notes, 
            submitterName: submitter?.name || 'Cliente', 
            assigneeName: assignee?.name || 'Soporte' 
        });

        const pdfBuffer = await renderToBuffer(element as any);

        const targetEmail = targetRole === 'assignee' ? assignee?.email : submitter?.email;
        const targetName = targetRole === 'assignee' ? assignee?.name : submitter?.name;
        // 3. Evaluar configuración de Brevo
        if (!process.env.BREVO_SMTP_KEY || process.env.BREVO_SMTP_KEY === 'test') {
            console.log("\n================ [ ENTORNO LOCAL / MOCK ] ================");
            console.log(`📡 BREVO EMAIL SIMULATION -> ${actionType}`);
            console.log(`📩 Destino: ${targetEmail}`);
            console.log(`📎 Adjunto PDF Listo: Trazabilidad_${ticket.codigo || ticket.id.substring(0,8)}.pdf (${(pdfBuffer.length / 1024).toFixed(2)} KB)`);
            console.log("========================================================\n");
            return { success: true, simulated: true };
        }

        // 4. Despacho real con Brevo SMTP
        await transporter.sendMail({
            from: `"Soporte OnlineDesk" <${process.env.BREVO_EMAIL}>`,
            to: targetEmail || process.env.BREVO_EMAIL,
            subject: `[Ticket ${ticket.codigo || ticket.id.substring(0,8).toUpperCase()}] Actualización: ${actionType}`,
            html: `
                <div style="font-family: sans-serif; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #e4e4e7; border-radius: 8px; overflow: hidden;">
                    <div style="background: #09090b; padding: 20px; text-align: center;">
                        <h1 style="color: #fff; margin: 0; font-size: 20px; tracking-tight: -0.05em; font-weight: 800; text-transform: uppercase; font-style: italic;">Sistema de Requerimientos</h1>
                    </div>
                    <div style="padding: 30px;">
                        <h2 style="color: #09090b; margin-top: 0;">Hola ${targetName || 'Usuario'},</h2>
                        <p>El ticket <strong>${ticket.subject}</strong> acaba de registrar actividad en la plataforma.</p>
                        <div style="padding: 16px; background: #f8fafc; border-left: 4px solid #3b82f6; border-radius: 4px; margin: 24px 0;">
                            <strong style="display: block; font-size: 11px; text-transform: uppercase; color: #64748b; margin-bottom: 4px;">Evento Operativo:</strong>
                            <span style="font-size: 16px; font-weight: 600; color: #1e293b;">${actionType}</span>
                        </div>
                        <p>Adjunto a este correo encontrarás el reporte de trazabilidad en formato PDF, detallando el cumplimiento de ANS (SLA) y la bitácora íntegra del caso.</p>
                        <hr style="border: 0; border-top: 1px solid #e4e4e7; margin: 30px 0;" />
                        <p style="font-size: 12px; color: #71717a; text-align: center;">Este es un mensaje automatizado generado por la Plataforma de Gestión de Requerimientos.</p>
                    </div>
                </div>
            `,
            attachments: [
                {
                    filename: `Trazabilidad_${ticket.codigo || ticket.id.substring(0,8)}.pdf`,
                    content: pdfBuffer,
                    contentType: 'application/pdf',
                }
            ]
        });

        return { success: true };
    } catch (error) {
        console.error("Error al procesar la notificación Brevo PDF:", error);
        return { success: false, error: String(error) };
    }
}
