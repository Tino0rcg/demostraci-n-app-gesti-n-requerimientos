"use client";

import { useEffect, useState, Fragment, useRef } from "react";
import { Ticket, User, Note, TicketStatus } from "@/lib/definitions";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { format } from "date-fns";
import { SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageSquare, Clock, UserIcon, AlertCircle, Play, CheckCircle2, XCircle, Send, UserCheck, Loader2, Sparkles, Timer, Phone, Image as ImageIcon } from "lucide-react";
import { getSlaStatus } from "@/lib/sla-utils";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { updateTicketAction, getNotesAction, createNoteAction, getTicketAction } from "@/app/actions/tickets";

interface Props {
  ticketId: string;
  onUpdate?: () => void;
}

const priorityColorMap: Record<string, string> = {
  Baja: "bg-green-500/20 text-green-400 border border-green-500/30",
  Media: "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30",
  Alta: "bg-orange-500/20 text-orange-400 border border-orange-500/30",
  Crítica: "bg-red-500/20 text-red-400 border border-red-500/30",
};

const statusColorMap: Record<string, string> = {
    'Ingresado': "bg-blue-500/10 text-blue-400 border-blue-500/20",
    'En proceso': "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
    'Espera de aprobación': "bg-purple-500/10 text-purple-400 border-purple-500/20",
    'Terminado': "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
};

import { getProfilesAction } from "@/app/actions/profiles";

export function TicketDetailsInfo({ ticketId, onUpdate }: Props) {
  const supabase = createClient();
  const { toast } = useToast();
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [profiles, setProfiles] = useState<User[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [timeLeftStr, setTimeLeftStr] = useState<string>("");
  const [isOverdueSla, setIsOverdueSla] = useState<boolean>(false);
  const [currentUserProfile, setCurrentUserProfile] = useState<User | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [notes]);

  useEffect(() => {
    if (!ticket) return;

    const calculate = () => {
        let referenceTime: Date;
        if (ticket.status === 'Terminado') {
            referenceTime = ticket.resolvedAt || ticket.updatedAt;
        } else if (ticket.status === 'Espera de aprobación') {
            referenceTime = ticket.updatedAt;
        } else {
            referenceTime = new Date();
        }

        const dueTime = ticket.dueAt.getTime();
        const refTime = referenceTime.getTime();
        const diff = dueTime - refTime;
        
        setIsOverdueSla(diff < 0);
        
        const absDiff = Math.abs(diff);
        const hours = Math.floor(absDiff / (1000 * 60 * 60));
        const mins = Math.floor((absDiff % (1000 * 60 * 60)) / (1000 * 60));
        const secs = Math.floor((absDiff % (1000 * 60)) / 1000);

        const pad = (n: number) => n.toString().padStart(2, '0');
        const timeString = `${pad(hours)}:${pad(mins)}:${pad(secs)}`;

        if (ticket.status === 'Terminado' || ticket.status === 'Espera de aprobación') {
            setTimeLeftStr(diff >= 0 ? `Pausado (+${timeString})` : `Pausado (-${timeString})`);
        } else {
            setTimeLeftStr(diff >= 0 ? `Quedan ${timeString}` : `Vencido (-${timeString})`);
        }
    };

    calculate();
    
    if (ticket.status === 'Ingresado' || ticket.status === 'En proceso') {
        const interval = setInterval(calculate, 1000);
        return () => clearInterval(interval);
    }
  }, [ticket, ticket?.status, ticket?.updatedAt, ticket?.resolvedAt, ticket?.dueAt]);

  async function fetchData(showLoading = true) {
    try {
        if (showLoading) setLoading(true);

        const [ticketResult, profilesResult, notesResult] = await Promise.all([
            getTicketAction(ticketId),
            getProfilesAction(),
            getNotesAction(ticketId)
        ]);

        if (ticketResult.success && ticketResult.data) {
            const ticketData = ticketResult.data;
            setTicket({
                ...ticketData,
                createdAt: new Date(ticketData.created_at),
                updatedAt: new Date(ticketData.updated_at),
                dueAt: new Date(ticketData.due_at),
                resolvedAt: ticketData.resolved_at ? new Date(ticketData.resolved_at) : null,
                submitterId: ticketData.creador_id || ticketData.submitter_id,
                assigneeId: ticketData.tecnico_asignado_id || ticketData.assignee_id,
            });
        }

        if (profilesResult.success && profilesResult.data) {
            const loadedProfiles = profilesResult.data as User[];
            setProfiles(loadedProfiles);
            const { data: userData } = await supabase.auth.getUser();
            if (userData.user) {
                const curUsr = loadedProfiles.find(u => u.id === userData.user.id);
                setCurrentUserProfile(curUsr || null);
            }
        }

        if (notesResult.success && notesResult.data) {
            setNotes(notesResult.data.map((n: any) => ({
                ...n,
                ticketId: n.ticket_id,
                authorId: n.author_id,
                createdAt: new Date(n.created_at),
            })));
        }
    } catch (err) {
        console.error("Error loading ticket details:", err);
    } finally {
        if (showLoading) setLoading(false);
    }
  }

  useEffect(() => {
    fetchData(true);
  }, [ticketId]);

  if (loading) {
    return (
        <div className="flex flex-col h-full">
            <SheetHeader className="mb-4 flex-none">
                <SheetTitle className="text-xl font-bold leading-tight text-white/50 animate-pulse">Cargando requerimiento...</SheetTitle>
            </SheetHeader>
            <div className="flex-1 flex items-center justify-center">
                <Loader2 className="h-8 w-8 text-primary animate-spin" />
            </div>
        </div>
    );
  }

  if (!ticket) return <div className="p-4 text-center">Ticket no encontrado</div>;

  const submitter = profiles.find((u) => u.id === ticket.submitterId);
  const assignee = profiles.find((u) => u.id === ticket.assigneeId);
  const sla = getSlaStatus(ticket);

  const sendMessage = async () => {
    if (!newMessage.trim() || sending) return;
    
    // Optimistic UI Update: inyectamos el mensaje en la pantalla al instante
    const tempMessage = newMessage;
    setNewMessage(""); 
    setSending(true);
    
    try {
        const { data: userData } = await supabase.auth.getUser();
        if (!userData.user) {
            setNewMessage(tempMessage); // rollback si no hay usuario
            return;
        }

        const tempId = Date.now().toString();
        const optimisticNote: Note = {
            id: tempId,
            ticketId: ticketId,
            authorId: userData.user.id,
            content: tempMessage,
            createdAt: new Date(),
        };

        // Forzamos que se muestre en pantalla inmediatamente sin esperar a la BD
        setNotes((prev: Note[]) => [...prev, optimisticNote]);

        // Ahora sí, llamamos a la base de datos en los próximos milisegundos
        const result = await createNoteAction(ticketId, userData.user.id, tempMessage);

        if (result.success) {
            fetchData(false); // Este re-fetch silencioso reemplazará el note temporal por el permanente
            if (onUpdate) onUpdate();
        } else {
            // Rollback visual si falla
            setNotes((prev: Note[]) => prev.filter(n => n.id !== tempId));
            setNewMessage(tempMessage);
            toast({ title: "Error", description: "No se pudo enviar el mensaje.", variant: "destructive" });
        }
    } finally {
        setSending(false);
    }
  };

  const handleReassign = async (newAssigneeId: string) => {
    if (isUpdating) return;
    setIsUpdating(true);
    try {
        const result = await updateTicketAction(ticketId, { 
            tecnico_asignado_id: newAssigneeId
        });

    if (result.success) {
        const newTechName = profiles.find(u => u.id === newAssigneeId)?.name || "un nuevo técnico";
        
        // Log in bitácora
        const { data: userData } = await supabase.auth.getUser();
        if (userData.user) {
            await createNoteAction(ticketId, userData.user.id, `[SISTEMA] Caso reasignado a técnico especialista: ${newTechName}`);
        }

        if (onUpdate) onUpdate();
        toast({ title: "Técnico reasignado", description: `Responsable actualizado a ${newTechName}.` });
    } else {
        toast({ title: "Error", description: "No se pudo reasignar el técnico.", variant: "destructive" });
    }
    } finally {
        setIsUpdating(false);
    }
  };

  const handleAction = async (newStatus: TicketStatus, autoMessage?: string) => {
    if (isUpdating) return;
    setIsUpdating(true);
    try {
        const updateData: any = { status: newStatus };
        if (newStatus === "Terminado") updateData.resolved_at = new Date().toISOString();

    const result = await updateTicketAction(ticketId, updateData);

    if (result.success) {
        if (autoMessage) {
            const { data: userData } = await supabase.auth.getUser();
            if (userData.user) {
                await createNoteAction(ticketId, userData.user.id, `[SISTEMA] ${autoMessage}`);
            }
        }
        fetchData(false); // Refresco en segundo plano
        if (onUpdate) onUpdate();
        toast({ title: "Estado actualizado", description: `El ticket ahora está "${newStatus}".` });
    } else {
        toast({ title: "Error", description: "No se pudo actualizar el estado.", variant: "destructive" });
    }
    } finally {
        setIsUpdating(false);
    }
  };

  return (
    <div className="flex flex-col flex-1 min-h-0 w-full">
      <SheetHeader className="mb-4 flex-none">
        <div className="flex items-center gap-2 mb-2">
            <Badge variant="outline" className="text-xs bg-muted/30 font-bold text-primary border-primary/20">#{ticket.codigo || ticket.id.substring(0,8).toUpperCase()}</Badge>
            <Badge variant="outline" className={`text-xs ${statusColorMap[ticket.status]}`}>{ticket.status}</Badge>
            <Badge variant="outline" className={priorityColorMap[ticket.priority]}>{ticket.priority}</Badge>
            
            <div className={`flex flex-col items-end gap-1 ml-auto`}>
                <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-muted/20 border border-border/50`}>
                    <div title={sla.label} className={`h-2 w-2 rounded-full ${sla.color}`} />
                    <span className="text-[10px] uppercase font-bold tracking-wider">{sla.label}</span>
                </div>
                {timeLeftStr && (
                    <span className={`flex items-center text-[10px] font-mono font-bold tracking-wider px-2 py-0.5 rounded border border-white/5 bg-black/40 ${isOverdueSla ? 'text-red-400' : 'text-primary'}`}>
                        <Timer className={`w-3 h-3 mr-1 ${(ticket.status === 'Ingresado' || ticket.status === 'En proceso') ? 'animate-pulse' : ''}`} />
                        {timeLeftStr}
                    </span>
                )}
            </div>
        </div>
        <SheetTitle className="text-xl font-bold leading-tight text-white">{ticket.subject}</SheetTitle>
        <div className="flex flex-col gap-1 mt-3 p-3 bg-white/5 border border-white/10 rounded-lg">
            <div className="flex items-center gap-2 text-xs">
                <span className="text-zinc-500 font-medium">Solicitante:</span>
                <span className="text-white font-bold">{submitter?.name || "Desconocido"}</span>
            </div>
            {currentUserProfile?.id !== ticket.submitterId && submitter?.phone && (
                <div className="flex items-center gap-2 text-xs">
                    <span className="text-zinc-500 font-medium">Llamar Cliente:</span>
                    <span className="text-blue-400 font-mono inline-flex items-center gap-1.5 bg-blue-500/10 px-2 py-0.5 rounded-full border border-blue-500/20">
                        <Phone className="w-3 h-3" />
                        <a href={`tel:${submitter.phone}`} className="hover:underline">{submitter.phone}</a>
                    </span>
                </div>
            )}
            <div className="flex items-center gap-2 text-xs">
                <span className="text-zinc-500 font-medium">Correo:</span>
                <span className="text-zinc-300">{submitter?.email || "-"}</span>
            </div>
            <div className="flex items-center gap-2 text-xs">
                <span className="text-zinc-500 font-medium">Empresa:</span>
                <span className="text-primary font-black tracking-tight italic uppercase">{submitter?.empresa || "Externo"}</span>
            </div>
            <div className="flex items-center gap-2 text-xs pt-2 border-t border-white/5 mt-1">
                <span className="text-zinc-500 font-medium">Resp. Técnico:</span>
                <span className={`${assignee ? 'text-white font-bold' : 'text-zinc-500 italic'}`}>{assignee?.name || "Sin Asignar"}</span>
            </div>
            {currentUserProfile?.id === ticket.submitterId && assignee?.phone && (
                <div className="flex items-center gap-2 text-xs">
                    <span className="text-zinc-500 font-medium">Llamar Soporte:</span>
                    <span className="text-primary font-mono inline-flex items-center gap-1.5 bg-primary/10 px-2 py-0.5 rounded-full border border-primary/20">
                        <Phone className="w-3 h-3" />
                        <a href={`tel:${assignee.phone}`} className="hover:underline">{assignee.phone}</a>
                    </span>
                </div>
            )}
        </div>
        <div className="flex items-center text-[10px] text-muted-foreground mt-3 gap-3 opacity-70">
            <div className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                <span>Registrado el {format(ticket.createdAt, "dd/MM/yyyy HH:mm")}</span>
            </div>
            <div className="flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                <span>Módulo: {ticket.category}</span>
            </div>
        </div>

        {(() => {
            const imageMarker = "[ADJUNTO_IMAGEN]: ";
            const hasImage = ticket.description.includes(imageMarker);
            const cleanDescription = hasImage ? ticket.description.split(imageMarker)[0].trim() : ticket.description;
            const imageUrl = hasImage ? ticket.description.split(imageMarker)[1].trim() : null;

            return (
                <>
                    <div className="mt-5 p-5 bg-primary/5 rounded-xl border border-primary/20">
                        <h4 className="text-xs font-bold uppercase tracking-widest text-primary mb-3 flex items-center gap-2">
                            <Sparkles className="w-4 h-4" /> Descripción del Problema
                        </h4>
                        <div className="text-base text-zinc-200 leading-relaxed whitespace-pre-wrap">
                            {cleanDescription || "Sin descripción proporcionada."}
                        </div>
                    </div>

                    {imageUrl && (
                        <div className="mt-4 group relative">
                            <div className="absolute inset-0 bg-primary/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-xl" />
                            <div className="relative rounded-xl border border-white/10 overflow-hidden bg-black/40 shadow-2xl">
                                <div className="p-2 border-b border-white/5 bg-white/5 flex items-center justify-between">
                                    <span className="text-[9px] font-black uppercase tracking-widest text-zinc-500 px-2 py-0.5 rounded-full border border-white/5">
                                        Evidencia Adjunta
                                    </span>
                                    <ImageIcon className="w-3 h-3 text-primary" />
                                </div>
                                <div className="aspect-video relative overflow-hidden">
                                    <img 
                                        src={imageUrl} 
                                        alt="Evidencia del problema" 
                                        className="w-full h-full object-contain hover:scale-105 transition-transform duration-500"
                                    />
                                    <a 
                                        href={imageUrl} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="absolute bottom-3 right-3 bg-black/80 backdrop-blur-md px-3 py-1.5 rounded-lg text-[10px] text-white font-bold uppercase tracking-widest border border-white/10 opacity-0 group-hover:opacity-100 transition-all hover:bg-primary hover:text-black"
                                    >
                                        Ver imagen completa
                                    </a>
                                </div>
                            </div>
                        </div>
                    )}
                </>
            );
        })()}
      </SheetHeader>

      <ScrollArea className="flex-1 pr-4 mr-[-16px]">
        <div className="flex flex-col min-h-full pb-8">
            {/* Controles de Ticket permanentemente visibles */}
            <div className="w-full mb-4">
                <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 shadow-lg">
                    <div className="flex items-center gap-2 mb-4 border-b border-primary/10 pb-3">
                        <span className="text-[11px] font-black uppercase tracking-widest text-primary">⚙️ Acciones Requeridas</span>
                        {(ticket.status === 'En proceso' || ticket.status === 'Ingresado' || ticket.status === 'Espera de aprobación') && (
                            <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                        )}
                    </div>
                        {/* Controles de Flujo de Trabajo (Workflow Panel) */}
      <div className="mb-6 flex-none">
        <h4 className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-3">Flujo de Trabajo Operativo</h4>
        <div className="flex flex-wrap gap-2">
            {ticket.status === 'Ingresado' && (currentUserProfile?.role === 'Técnico' || currentUserProfile?.role === 'Administrador Full') && (
                <Button disabled={isUpdating} onClick={() => handleAction('En proceso', 'Ticket marcado como "En Proceso" por el técnico. Comenzando a trabajar en la solución.')} size="sm" className="bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30 border border-cyan-500/30">
                    <Play className="w-4 h-4 mr-2" /> Iniciar Trabajo (Agente)
                </Button>
            )}
            
            {ticket.status === 'En proceso' && (currentUserProfile?.role === 'Técnico' || currentUserProfile?.role === 'Administrador Full') && (
                <Button disabled={isUpdating} onClick={() => handleAction('Espera de aprobación', 'Trabajo finalizado por el técnico. Enviado al cliente para revisión y control de calidad.')} size="sm" className="bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30 border border-yellow-500/30">
                    <AlertCircle className="w-4 h-4 mr-2" /> Enviar a Revisión (Al Cliente)
                </Button>
            )}

            {ticket.status === 'Espera de aprobación' && (currentUserProfile?.id === ticket.submitterId) && (
                <>
                    <Button disabled={isUpdating} onClick={() => handleAction('Terminado', 'Solución validada y aceptada por el cliente. Ticket cerrado exitosamente.')} size="sm" className="bg-green-500/20 text-green-400 hover:bg-green-500/30 border border-green-500/30">
                        <CheckCircle2 className="w-4 h-4 mr-2" /> Aprobar Solución
                    </Button>
                    <div className="group relative">
                        <Button 
                            disabled={!newMessage.trim() || isUpdating} 
                            onClick={() => {
                                handleAction('En proceso', `Solución RECHAZADA por el cliente. Motivo: ${newMessage}`);
                                setNewMessage(""); // Limpiar caja después
                            }} 
                            size="sm" 
                            className="bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/30 disabled:opacity-50"
                        >
                            <XCircle className="w-4 h-4 mr-2" /> Rechazar Solución
                        </Button>
                        {!newMessage.trim() && (
                            <span className="absolute -top-10 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-black/80 px-2 py-1 text-[10px] text-red-400 opacity-0 transition-opacity group-hover:opacity-100 border border-red-500/20">
                                Escribe el motivo abajo para poder rechazar
                            </span>
                        )}
                    </div>
                </>
            )}

            {ticket.status === 'Terminado' && (
                <div className="text-sm font-medium text-green-400 flex items-center">
                    <CheckCircle2 className="w-4 h-4 mr-2" /> Este requerimiento ha finalizado exitosamente.
                </div>
            )}
        </div>
      </div>

      {/* Panel de Asignación (Admin Only UI) */}
      {currentUserProfile?.role === 'Administrador Full' && (
      <div className="mb-6 flex-none bg-blue-500/5 border border-blue-500/20 rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
            <h4 className="text-[11px] font-bold uppercase tracking-widest text-blue-400">Control de Asignación</h4>
            <UserCheck className="w-3.5 h-3.5 text-blue-400" />
        </div>
        <div className="space-y-3">
            <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10 border border-white/10 shrink-0">
                    <AvatarImage src={assignee?.avatarUrl} />
                    <AvatarFallback className="bg-blue-500/20 text-blue-400">{assignee?.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-white truncate">{assignee?.name || "Sin Asignar"}</p>
                    <p className="text-[10px] text-muted-foreground uppercase">{assignee?.role === 'Técnico' ? 'Técnico Especialista' : 'Supervisor'}</p>
                </div>
            </div>
            <div className="pt-2 border-t border-blue-500/10">
                <Label className="text-[10px] text-zinc-500 mb-1.5 block">Cambiar responsable del caso:</Label>
                <Select 
                    disabled={ticket.status === 'Terminado'} 
                    value={ticket.assigneeId || ""} 
                    onValueChange={handleReassign}
                >
                    <SelectTrigger className={`h-8 bg-black/40 border-white/5 text-xs text-zinc-300 ${ticket.status === 'Terminado' ? 'opacity-50' : ''}`}>
                        <SelectValue placeholder="Seleccionar técnico..." />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-900 border-white/10">
                        {profiles.filter(u => u.role === 'Técnico' || u.role === 'Administrador Full').map(u => (
                            <SelectItem key={u.id} value={u.id} className="text-xs focus:bg-blue-500/20 focus:text-blue-200">
                                {u.name} ({u.empresa})
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
        </div>
      </div>
      )}
                </div>
            </div>

      {/* Chat / Bitácora (Caja independiente) */}
      <h3 className="text-xs font-bold flex items-center gap-2 text-primary flex-none mb-3 pl-1 uppercase tracking-widest mt-4">
          <MessageSquare className="h-4 w-4" /> Historial de Conversación
      </h3>
      <div className="flex-1 bg-black/20 border border-white/5 rounded-xl p-4 shadow-inner">
        <div className="space-y-4">
            
            {notes.length === 0 ? (
                <div className="text-sm text-center py-6 text-muted-foreground border border-dashed border-white/10 rounded-lg">
                    Sin respuestas en este ticket. ¡Inicia la conversación!
                </div>
            ) : (
                <div className="space-y-4">
                    {notes.map((n, index) => {
                        const isSystem = n.content.trim().startsWith("[SISTEMA]");
                        const content = isSystem ? n.content.replace("[SISTEMA] ", "").replace("[SISTEMA]", "") : n.content;
                        
                        const currentDateString = format(n.createdAt, "yyyy-MM-dd");
                        const previousDateString = index > 0 ? format(notes[index - 1].createdAt, "yyyy-MM-dd") : null;
                        const showDateSeparator = currentDateString !== previousDateString;

                        if (isSystem) {
                            return (
                                <Fragment key={n.id}>
                                    {showDateSeparator && (
                                        <div className="flex justify-center mt-6 mb-2">
                                            <span className="px-3 py-1 bg-black/40 border border-white/10 rounded-full text-[10px] font-bold text-zinc-400 uppercase tracking-widest shadow-inner">
                                                {format(n.createdAt, "dd 'de' MMMM, yyyy")}
                                            </span>
                                        </div>
                                    )}
                                    <div className="flex flex-col items-center py-4 relative">
                                        <div className="absolute inset-0 flex items-center" aria-hidden="true">
                                            <div className="w-full border-t border-white/5"></div>
                                        </div>
                                        <div className="relative flex items-center justify-center">
                                            <div className="bg-zinc-900 px-4 flex items-center gap-2">
                                                <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                                                <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400 bg-black/20 px-3 py-1.5 rounded-full border border-white/5">
                                                    {content}
                                                </span>
                                                <span className="text-xs text-zinc-500 font-mono">{format(n.createdAt, "HH:mm")}</span>
                                            </div>
                                        </div>
                                    </div>
                                </Fragment>
                            );
                        }

                        const autor = profiles.find(u => u.id === n.authorId);
                        const isMe = n.authorId === currentUserProfile?.id;
                        
                        return (
                            <Fragment key={n.id}>
                                {showDateSeparator && (
                                    <div className="flex justify-center mt-6 mb-2">
                                        <span className="px-3 py-1 bg-black/40 border border-white/10 rounded-full text-[10px] font-bold text-zinc-400 uppercase tracking-widest shadow-inner">
                                            {format(n.createdAt, "dd 'de' MMMM, yyyy")}
                                        </span>
                                    </div>
                                )}
                                <div className={`flex gap-3 ${!isMe ? 'flex-row' : 'flex-row-reverse'}`}>
                                    <Avatar className="h-8 w-8 mt-1 border border-white/10 shrink-0">
                                        <AvatarImage src={autor?.avatarUrl} />
                                        <AvatarFallback><UserIcon className="h-4 w-4" /></AvatarFallback>
                                    </Avatar>
                                    <div className={`flex flex-col max-w-[85%] ${!isMe ? 'items-start' : 'items-end'}`}>
                                        <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                                            <span className="text-sm font-bold text-white/90">{isMe ? 'Tú' : autor?.name}</span>
                                            {!isMe && (
                                                <span className="text-xs px-2 py-0.5 rounded bg-white/5 border border-white/10 text-zinc-400 font-medium uppercase tracking-wider">
                                                    {autor?.empresa}
                                                </span>
                                            )}
                                            <span className="text-xs text-muted-foreground/60">{format(n.createdAt, "HH:mm")}</span>
                                        </div>
                                        <div className={`p-4 rounded-2xl text-base shadow-sm ${
                                            !isMe 
                                            ? 'bg-muted/40 text-foreground rounded-tl-sm border border-white/5' 
                                            : 'bg-primary/20 text-primary shadow-primary/5 border border-primary/30 rounded-tr-sm'
                                        }`}>
                                            <p className="whitespace-pre-wrap leading-relaxed">{content}</p>
                                        </div>
                                    </div>
                                </div>
                            </Fragment>
                        )
                    })}
                    <div ref={messagesEndRef} />
                </div>
            )}
        </div>
      </div>
      </div>
      </ScrollArea>

      {/* Input de Mensajes */}
      {ticket.status !== 'Terminado' ? (
        <div className="flex-none pt-2 pb-4 sm:pb-0 mt-auto bg-background/95">
            <div className="flex gap-2">
                <Textarea
                    placeholder={ticket.status === 'Espera de aprobación' ? "Explica el motivo (Si rechazas) o agradece (Si apruebas)..." : "Responde al técnico o agrega detalles..."}
                    className="resize-none min-h-[60px] bg-black/40 border-white/10 text-base sm:text-sm py-3 rounded-xl focus:ring-1 focus:ring-primary/50"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            sendMessage();
                        }
                    }}
                />
                <Button onClick={sendMessage} disabled={!newMessage.trim() || sending} className="h-auto shrink-0 bg-primary/20 text-primary hover:bg-primary hover:text-white transition-colors rounded-xl px-4">
                    {sending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
                </Button>
            </div>
        </div>
      ) : (
        <div className="flex-none pt-4 border-t border-white/10 mt-auto">
            <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-4 flex items-center justify-center gap-3">
                <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                <span className="text-sm font-bold text-emerald-400 uppercase tracking-widest italic">
                    Ticket Finalizado y Almacenado en Historial
                </span>
            </div>
        </div>
      )}
    </div>
  );
}
