"use server"

import { renderToBuffer } from "@react-pdf/renderer";
import nodemailer from "nodemailer";
import { TicketPDF } from "@/components/pdf/ticket-pdf";
import { createClient as createSupabaseJS } from '@supabase/supabase-js';
import { Ticket, User, Note } from "@/lib/definitions";

function createAdminClient() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const key = (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)!;
    return createSupabaseJS(url, key);
}

function getEmailTransporter() {
    const user = process.env.SMTP_USER || process.env.GMAIL_USER || process.env.BREVO_SMTP_LOGIN || 'requerimientosgestion@gmail.com';
    const rawPass = process.env.SMTP_PASS || process.env.GMAIL_APP_PASSWORD || process.env.BREVO_SMTP_KEY || 'fjblojakqahobnvq';
    const pass = rawPass ? rawPass.replace(/\s+/g, '') : '';
    const from = process.env.SMTP_FROM || `"Soporte OnlineDesk" <${user}>`;

    if (user.includes('@gmail.com') || process.env.SMTP_SERVICE === 'gmail') {
        return {
            transporter: nodemailer.createTransport({
                service: 'gmail',
                auth: { user, pass }
            }),
            from,
            user,
            pass
        };
    }

    return {
        transporter: nodemailer.createTransport({
            host: process.env.SMTP_HOST || 'smtp-relay.brevo.com',
            port: Number(process.env.SMTP_PORT) || 587,
            auth: { user, pass }
        }),
        from,
        user,
        pass
    };
}

export async function sendTicketNotification(
    ticketId: string, 
    actionType: string, 
    targetRole: 'submitter' | 'assignee' | 'both' = 'both'
) {
    try {
        const supabase = createAdminClient();

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
        const { data: submitterData } = ticket.submitterId
            ? await supabase.from('profiles').select('*').eq('id', ticket.submitterId).single()
            : { data: null };
            
        const { data: assigneeData } = ticket.assigneeId
            ? await supabase.from('profiles').select('*').eq('id', ticket.assigneeId).single()
            : { data: null };

        const submitter = submitterData as User | null;
        const assignee = assigneeData as User | null;

        // 2. Renderizar PDF estructurado
        const element = TicketPDF({ 
            ticket, 
            notes, 
            submitterName: submitter?.name || 'Cliente', 
            assigneeName: assignee?.name || 'Sin Asignar' 
        });

        const pdfBuffer = await renderToBuffer(element as any);

        // 3. Obtener transporte y configuración de correo
        const { transporter, from, user: emailUser, pass: emailPass } = getEmailTransporter();

        // 4. Determinar lista de destinatarios
        interface RecipientInfo {
            email: string;
            name: string;
            isTechnician: boolean;
        }

        const recipients: RecipientInfo[] = [];

        if (targetRole === 'submitter' || targetRole === 'both') {
            if (submitter?.email) {
                recipients.push({
                    email: submitter.email,
                    name: submitter.name || 'Cliente',
                    isTechnician: false
                });
            }
        }

        if (targetRole === 'assignee' || targetRole === 'both') {
            if (assignee?.email) {
                recipients.push({
                    email: assignee.email,
                    name: assignee.name || 'Técnico Especialista',
                    isTechnician: true
                });
            }
        }

        // Si no se encuentra correo válido de perfiles, usar el correo del sistema
        if (recipients.length === 0) {
            recipients.push({
                email: emailUser,
                name: 'Equipo de Soporte',
                isTechnician: false
            });
        }

        // Deduplicar si el solicitante y el técnico comparten exactamente el mismo email
        const uniqueRecipients = recipients.filter((rec, index, self) =>
            index === self.findIndex((r) => r.email.toLowerCase() === rec.email.toLowerCase())
        );

        const ticketCode = ticket.codigo || ticket.id.substring(0, 8).toUpperCase();

        if (!emailPass || emailPass === 'test') {
            console.log("\n================ [ ENTORNO LOCAL / MOCK ] ================");
            console.log(`📡 EMAIL SIMULATION -> ${actionType}`);
            console.log(`📩 Destinatarios: ${uniqueRecipients.map(r => `${r.name} <${r.email}>`).join(', ')}`);
            console.log(`📎 Adjunto PDF Listo: Trazabilidad_${ticketCode}.pdf (${(pdfBuffer.length / 1024).toFixed(2)} KB)`);
            console.log("========================================================\n");
            return { success: true, simulated: true };
        }

        // 5. Despacho real con Nodemailer a cada destinatario
        await Promise.all(
            uniqueRecipients.map(async (recipient) => {
                const isTech = recipient.isTechnician;
                const roleGreeting = isTech ? `Hola ${recipient.name} (Técnico Responsable),` : `Hola ${recipient.name},`;
                const introText = isTech
                    ? `El ticket <strong>${ticket.subject}</strong> que tienes a tu cargo ha registrado una actualización operativa:`
                    : `Tu requerimiento <strong>${ticket.subject}</strong> ha registrado una actualización operativa en la plataforma:`;

                const html = `
                    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; background: #ffffff;">
                        <div style="background: #09090b; padding: 24px; text-align: center; border-bottom: 3px solid #3b82f6;">
                            <h1 style="color: #ffffff; margin: 0; font-size: 20px; font-weight: 800; text-transform: uppercase; letter-spacing: -0.02em; font-style: italic;">
                                OnlineDesk <span style="color: #3b82f6;">Soporte Técnico</span>
                            </h1>
                            <span style="color: #94a3b8; font-size: 11px; text-transform: uppercase; letter-spacing: 0.15em; font-weight: 700;">Trazabilidad Operativa & ANS</span>
                        </div>
                        <div style="padding: 28px 24px;">
                            <h2 style="color: #0f172a; margin-top: 0; font-size: 18px; font-weight: 700;">${roleGreeting}</h2>
                            <p style="font-size: 14px; line-height: 1.6; color: #475569; margin-bottom: 20px;">
                                ${introText}
                            </p>
                            
                            <div style="padding: 16px; background: #f8fafc; border-left: 4px solid #3b82f6; border-radius: 6px; margin: 20px 0;">
                                <strong style="display: block; font-size: 11px; text-transform: uppercase; color: #64748b; letter-spacing: 0.05em; margin-bottom: 4px;">Evento Operativo:</strong>
                                <span style="font-size: 16px; font-weight: 700; color: #0284c7;">${actionType}</span>
                            </div>

                            <table style="width: 100%; font-size: 13px; margin: 20px 0; border-collapse: collapse;">
                                <tr>
                                    <td style="padding: 6px 0; color: #64748b; width: 40%;"><strong>Código Ticket:</strong></td>
                                    <td style="padding: 6px 0; color: #0f172a; font-weight: 700;">#${ticketCode}</td>
                                </tr>
                                <tr>
                                    <td style="padding: 6px 0; color: #64748b;"><strong>Estado Actual:</strong></td>
                                    <td style="padding: 6px 0; color: #0f172a; font-weight: 700;">${ticket.status}</td>
                                </tr>
                                <tr>
                                    <td style="padding: 6px 0; color: #64748b;"><strong>Prioridad (SLA):</strong></td>
                                    <td style="padding: 6px 0; color: #0f172a; font-weight: 700;">${ticket.priority}</td>
                                </tr>
                                <tr>
                                    <td style="padding: 6px 0; color: #64748b;"><strong>Solicitante:</strong></td>
                                    <td style="padding: 6px 0; color: #0f172a;">${submitter?.name || 'Cliente'} (${submitter?.empresa || 'Empresa'})</td>
                                </tr>
                                <tr>
                                    <td style="padding: 6px 0; color: #64748b;"><strong>Técnico Asignado:</strong></td>
                                    <td style="padding: 6px 0; color: #0f172a; font-weight: 700;">${assignee?.name || 'Sin Asignar'}</td>
                                </tr>
                            </table>

                            <div style="background: #f1f5f9; padding: 12px 16px; border-radius: 8px; margin-top: 20px;">
                                <p style="margin: 0; font-size: 12px; color: #334155; line-height: 1.5;">
                                    📎 <strong>Reporte Oficial de Trazabilidad Adjunto:</strong> Hemos generado e incluido el documento <code>Trazabilidad_${ticketCode}.pdf</code> con la bitácora íntegra, marcas de tiempo y auditoría de cumplimiento.
                                </p>
                            </div>

                            <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 28px 0 20px;" />
                            <p style="font-size: 11px; color: #94a3b8; text-align: center; margin: 0;">
                                Mensaje automático emitido por la Plataforma OnlineDesk de Gestión de Requerimientos.
                            </p>
                        </div>
                    </div>
                `;

                return transporter.sendMail({
                    from: from,
                    to: recipient.email,
                    subject: `[Ticket #${ticketCode}] Actualización: ${actionType}`,
                    html: html,
                    attachments: [
                        {
                            filename: `Trazabilidad_${ticketCode}.pdf`,
                            content: pdfBuffer,
                            contentType: 'application/pdf',
                        }
                    ]
                });
            })
        );

        // 5. Enviar Notificaciones Push a dispositivos móviles (Android / iOS)
        const pushTargetUserIds: string[] = [];
        if ((targetRole === 'submitter' || targetRole === 'both') && submitter?.id) {
            pushTargetUserIds.push(submitter.id);
        }
        if ((targetRole === 'assignee' || targetRole === 'both') && assignee?.id) {
            pushTargetUserIds.push(assignee.id);
        }

        const { sendPushToUser } = await import('./push');
        for (const uid of pushTargetUserIds) {
            sendPushToUser(
                uid,
                `Ticket #${ticketCode}: ${actionType}`,
                `Requerimiento "${ticket.subject}". Estado: ${ticket.status}.`,
                `/dashboard`
            ).catch(err => console.error("Error al enviar push notification:", err));
        }

        return { success: true };
    } catch (error) {
        console.error("Error al procesar la notificación de correo:", error);
        return { success: false, error: String(error) };
    }
}
