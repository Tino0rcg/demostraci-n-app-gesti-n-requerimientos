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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
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

function playChatNotificationSound() {
  if (typeof window === "undefined") return;
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(587.33, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.08);
    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.16);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.16);
  } catch {
    // Audio autoplay restrictions
  }
}

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
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"chat" | "detalles">("chat");
  const [showFullDesc, setShowFullDesc] = useState(false);
  const chatScrollRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const channelRef = useRef<any>(null);
  const [typingUser, setTypingUser] = useState<{ id: string; name: string } | null>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastTypingBroadcastRef = useRef<number>(0);
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  const scrollToBottom = (smooth = false) => {
    if (chatScrollRef.current) {
      if (smooth) {
        chatScrollRef.current.scrollTo({
          top: chatScrollRef.current.scrollHeight,
          behavior: "smooth"
        });
      } else {
        chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
      }
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [notes, activeTab]);

  useEffect(() => {
    if (typingUser) {
      scrollToBottom(true);
    }
  }, [typingUser]);

  useEffect(() => {
    if (!ticket) return;

    const calculate = () => {
        let referenceTime: any;
        if (ticket.status === 'Terminado') {
            referenceTime = ticket.resolvedAt || ticket.updatedAt || new Date();
        } else if (ticket.status === 'Espera de aprobación') {
            referenceTime = ticket.updatedAt || new Date();
        } else {
            referenceTime = new Date();
        }

        const dueTime = new Date(ticket.dueAt || Date.now()).getTime();
        const refTime = new Date(referenceTime || Date.now()).getTime();
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

        const { data: userData } = await supabase.auth.getUser();
        if (userData?.user) {
            setCurrentUserId(userData.user.id);
        }

        if (profilesResult.success && profilesResult.data) {
            const loadedProfiles = profilesResult.data as User[];
            setProfiles(loadedProfiles);
            if (userData?.user) {
                const curUsr = loadedProfiles.find(u => u.id === userData.user.id);
                setCurrentUserProfile(curUsr || null);
            }
        }

        if (notesResult.success && notesResult.data) {
            const mapped = notesResult.data.map((n: any) => ({
                ...n,
                ticketId: n.ticket_id,
                authorId: n.author_id,
                createdAt: new Date(n.created_at),
            }));

            setNotes((prevNotes: Note[]) => {
                const hasTempNotes = prevNotes.some(n => n.id.startsWith('temp-'));
                if (!hasTempNotes) {
                    if (
                        prevNotes.length === mapped.length &&
                        prevNotes.every((n, i) => n.id === mapped[i].id && n.content === mapped[i].content)
                    ) {
                        return prevNotes;
                    }
                    return mapped;
                }

                // Preservar notas temporales que aún no se reflejan en la base de datos
                const pendingTemps = prevNotes.filter(n => 
                    n.id.startsWith('temp-') && 
                    !mapped.some(m => m.content === n.content && m.authorId === n.authorId && Math.abs(new Date(m.createdAt).getTime() - new Date(n.createdAt).getTime()) < 15000)
                );
                return [...mapped, ...pendingTemps];
            });
        }
    } catch (err) {
        console.error("Error loading ticket details:", err);
    } finally {
        if (showLoading) setLoading(false);
    }
  }

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data?.user) setCurrentUserId(data.user.id);
    });
    fetchData(true);

    // Canal WebSockets en tiempo real ultra-rápido
    const channel = supabase.channel(`ticket-room-${ticketId}`, {
      config: { broadcast: { self: false } }
    });

    channel
      .on('broadcast', { event: 'instant_message' }, (payload: any) => {
        const msg = payload.payload;
        if (!msg || msg.ticketId !== ticketId) return;
        const myId = currentUserId || currentUserProfile?.id;
        if (msg.authorId && msg.authorId === myId) return; // ignorar propios

        setTypingUser(null);
        setNotes((prev: Note[]) => {
          if (prev.some(n => n.id === msg.id || (n.content === msg.content && n.authorId === msg.authorId && Math.abs(new Date(n.createdAt).getTime() - new Date(msg.createdAt).getTime()) < 5000))) {
            return prev;
          }
          return [...prev, {
            id: msg.id,
            ticketId: msg.ticketId,
            authorId: msg.authorId,
            content: msg.content,
            createdAt: new Date(msg.createdAt)
          }];
        });
        playChatNotificationSound();
        scrollToBottom(true);
      })
      .on('broadcast', { event: 'new_message' }, () => {
        setTypingUser(null);
        fetchData(false);
        playChatNotificationSound();
      })
      .on('broadcast', { event: 'user_typing' }, (payload: any) => {
        const senderId = payload.payload?.userId;
        const myId = currentUserId || currentUserProfile?.id;
        if (senderId && senderId !== myId) {
          setTypingUser({
            id: senderId,
            name: payload.payload?.userName || 'El usuario'
          });
          if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
          typingTimeoutRef.current = setTimeout(() => {
            setTypingUser(null);
          }, 3200);
        }
      })
      .on('broadcast', { event: 'stop_typing' }, () => {
        setTypingUser(null);
      })
      .on('broadcast', { event: 'ticket_status_updated' }, () => {
        fetchData(false);
        if (onUpdate) onUpdate();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notes', filter: `ticket_id=eq.${ticketId}` }, () => {
        setTypingUser(null);
        fetchData(false);
        playChatNotificationSound();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tickets', filter: `id=eq.${ticketId}` }, () => {
        fetchData(false);
        if (onUpdate) onUpdate();
      })
      .subscribe();

    channelRef.current = channel;

    // Sincronización silenciosa periódica de respaldo (cada 3.5 segundos)
    const syncInterval = setInterval(() => {
      fetchData(false);
    }, 3500);

    return () => {
      clearInterval(syncInterval);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
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

  // El botón de aprobar/rechazar solo le debe salir al usuario que ingresó el requerimiento
  const isSubmitter = Boolean(
    ticket && (
      (currentUserId && ticket.submitterId === currentUserId) ||
      (currentUserProfile?.id && ticket.submitterId === currentUserProfile.id)
    )
  );

  // Técnico a cargo del ticket o administrador full
  const isTechnicianInCharge = Boolean(
    ticket && (
      currentUserProfile?.role === 'Administrador Full' ||
      (currentUserProfile?.role === 'Técnico' && (
        (ticket.assigneeId && (ticket.assigneeId === currentUserProfile.id || (currentUserId && ticket.assigneeId === currentUserId))) ||
        !ticket.assigneeId
      ))
    )
  );

  const imageMarker = "[ADJUNTO_IMAGEN]: ";
  const hasImage = ticket.description?.includes(imageMarker);
  const cleanDescription = hasImage ? ticket.description.split(imageMarker)[0].trim() : (ticket.description || "");
  const imageUrl = hasImage ? ticket.description.split(imageMarker)[1].trim() : null;

  const sendMessage = async () => {
    const tempMessage = newMessage.trim();
    if (!tempMessage) return;

    // Obtener autor sin peticiones de red previas
    let authorId: string | undefined = currentUserId || currentUserProfile?.id;
    if (!authorId) {
      const { data: userData } = await supabase.auth.getUser();
      authorId = userData?.user?.id || "11111111-1111-1111-1111-111111111111";
    }

    // 1. Limpieza de campo y renderizado instantáneo en pantalla (0ms)
    setNewMessage("");
    const tempId = `temp-${Date.now()}`;
    const optimisticNote: Note = {
      id: tempId,
      ticketId: ticketId,
      authorId: authorId,
      content: tempMessage,
      createdAt: new Date(),
    };

    setNotes((prev: Note[]) => [...prev, optimisticNote]);
    scrollToBottom(true);

    // 2. Transmisión instantánea al otro usuario por WebSockets (<50ms)
    channelRef.current?.send({
      type: 'broadcast',
      event: 'stop_typing',
      payload: { userId: authorId }
    });
    channelRef.current?.send({
      type: 'broadcast',
      event: 'instant_message',
      payload: {
        id: tempId,
        ticketId,
        authorId,
        content: tempMessage,
        createdAt: new Date().toISOString()
      }
    });

    // 3. Guardado en base de datos en segundo plano (no bloquea la pantalla)
    createNoteAction(ticketId, authorId, tempMessage).then((result) => {
      if (result.success) {
        if (onUpdate) onUpdate();
        fetchData(false);
      } else {
        // Rollback visual si la base de datos falló
        setNotes((prev: Note[]) => prev.filter(n => n.id !== tempId));
        setNewMessage(tempMessage);
        toast({ title: "Error", description: "No se pudo enviar el mensaje.", variant: "destructive" });
      }
    });
  };

  const handleTyping = (text: string) => {
    setNewMessage(text);

    const now = Date.now();
    if (text.trim().length > 0 && now - lastTypingBroadcastRef.current > 1500) {
      lastTypingBroadcastRef.current = now;
      channelRef.current?.send({
        type: 'broadcast',
        event: 'user_typing',
        payload: {
          userId: currentUserId || currentUserProfile?.id,
          userName: currentUserProfile?.name || 'El usuario'
        }
      });
    } else if (text.trim().length === 0) {
      channelRef.current?.send({
        type: 'broadcast',
        event: 'stop_typing',
        payload: { userId: currentUserId || currentUserProfile?.id }
      });
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

        channelRef.current?.send({
            type: 'broadcast',
            event: 'ticket_status_updated',
            payload: { newAssigneeId }
        });

        fetchData(false);
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

        channelRef.current?.send({
            type: 'broadcast',
            event: 'ticket_status_updated',
            payload: { newStatus }
        });
        channelRef.current?.send({
            type: 'broadcast',
            event: 'new_message',
            payload: { ticketId, status: newStatus }
        });

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
    <div data-no-pull-to-refresh="true" className="flex flex-col flex-1 min-h-0 w-full overflow-hidden">
      {/* Top Header Bar: Compact & Mobile-Safe */}
      <div className="flex-none pb-2 border-b border-white/10">
        <div className="flex items-center gap-1.5 sm:gap-2 mb-1.5 pr-12 flex-wrap">
            <Badge variant="outline" className="text-xs bg-muted/30 font-bold text-primary border-primary/20 shrink-0">
              #{ticket.codigo || ticket.id.substring(0,8).toUpperCase()}
            </Badge>
            <Badge variant="outline" className={`text-xs shrink-0 ${statusColorMap[ticket.status]}`}>
              {ticket.status}
            </Badge>
            <Badge variant="outline" className={`text-xs hidden sm:inline-flex shrink-0 ${priorityColorMap[ticket.priority]}`}>
              {ticket.priority}
            </Badge>
            
            {timeLeftStr && (
                <div data-tour="ticket-sla-timer" className="ml-auto flex items-center">
                    <span className={`flex items-center text-[10px] font-mono font-bold tracking-wider px-2 py-0.5 rounded border border-white/5 bg-black/40 ${isOverdueSla ? 'text-red-400' : 'text-primary'}`}>
                        <Timer className={`w-3 h-3 mr-1 ${(ticket.status === 'Ingresado' || ticket.status === 'En proceso') ? 'animate-pulse' : ''}`} />
                        {timeLeftStr}
                    </span>
                </div>
            )}
        </div>

        <h2 className="text-sm sm:text-base font-bold leading-snug text-white line-clamp-2 pr-12">
            {ticket.subject}
        </h2>

        {/* Segmented Control: Chat vs Detalles */}
        <div className="flex items-center gap-1.5 p-1 bg-black/40 border border-white/10 rounded-xl mt-2.5">
            <button
                type="button"
                onClick={() => setActiveTab("chat")}
                className={`flex-1 flex items-center justify-center gap-1.5 sm:gap-2 py-2 px-3 rounded-lg text-xs font-bold transition-all min-h-[38px] cursor-pointer ${
                    activeTab === "chat"
                        ? "bg-primary text-black shadow-md shadow-primary/20 font-black"
                        : "text-zinc-400 hover:text-white hover:bg-white/5"
                }`}
            >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Chat y Conversación</span>
                <span className={`inline-flex items-center gap-1 text-[9px] px-1.5 py-0.5 rounded-full font-bold ${
                    activeTab === "chat" 
                        ? "bg-black/20 text-emerald-950 border border-black/20" 
                        : "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                }`}>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    En vivo
                </span>
                {notes.length > 0 && (
                    <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                        activeTab === "chat" ? "bg-black/30 text-black font-black" : "bg-white/10 text-zinc-300"
                    }`}>
                        {notes.length}
                    </span>
                )}
            </button>
            <button
                type="button"
                onClick={() => setActiveTab("detalles")}
                className={`flex-1 flex items-center justify-center gap-1.5 sm:gap-2 py-2 px-3 rounded-lg text-xs font-bold transition-all min-h-[38px] cursor-pointer ${
                    activeTab === "detalles"
                        ? "bg-primary text-black shadow-md shadow-primary/20 font-black"
                        : "text-zinc-400 hover:text-white hover:bg-white/5"
                }`}
            >
                <AlertCircle className="w-3.5 h-3.5" />
                <span>Detalles y Datos</span>
                {imageUrl && (
                    <span className="w-2 h-2 rounded-full bg-cyan-400 ml-0.5" title="Tiene imagen adjunta" />
                )}
            </button>
        </div>
      </div>

      {/* Banner de Decisión de Solución: SOLO al usuario que ingresó el requerimiento */}
      {ticket.status === 'Espera de aprobación' && isSubmitter && (
        <div data-tour="ticket-approval-actions" className="flex-none mt-2.5 p-3 rounded-xl bg-gradient-to-r from-amber-500/15 via-emerald-500/10 to-transparent border border-amber-500/30 shadow-lg">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                    <div className="h-9 w-9 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center shrink-0">
                        <AlertCircle className="h-4 w-4 text-amber-400" />
                    </div>
                    <div className="flex flex-col min-w-0">
                        <span className="text-xs font-bold text-white tracking-wide">
                            El técnico concluyó la solución
                        </span>
                        <span className="text-[11px] text-zinc-400">
                            ¿La solución fue satisfactoria? Puedes validarla o rechazarla aquí:
                        </span>
                    </div>
                </div>
                <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
                    <Button 
                        size="sm"
                        disabled={isUpdating} 
                        onClick={() => handleAction('Terminado', 'Solución validada y aceptada por el cliente. Ticket cerrado exitosamente.')} 
                        className="flex-1 sm:flex-none min-h-[38px] text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/20 border border-emerald-500/50 cursor-pointer"
                    >
                        <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" /> Aprobar Solución
                    </Button>
                    <Button 
                        size="sm"
                        disabled={isUpdating} 
                        onClick={() => setIsRejectDialogOpen(true)} 
                        className="flex-1 sm:flex-none min-h-[38px] text-xs font-bold bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/30 cursor-pointer"
                    >
                        <XCircle className="w-3.5 h-3.5 mr-1.5" /> Rechazar
                    </Button>
                </div>
            </div>
        </div>
      )}

      {/* Banner informativo para técnicos o admins cuando está en espera de aprobación (sin botones de aprobar/rechazar) */}
      {ticket.status === 'Espera de aprobación' && !isSubmitter && (
        <div data-tour="ticket-approval-actions" className="flex-none mt-2.5 p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center gap-2.5">
            <div className="h-7 w-7 rounded-full bg-amber-500/20 border border-amber-500/30 flex items-center justify-center shrink-0">
                <AlertCircle className="h-3.5 w-3.5 text-amber-400" />
            </div>
            <div className="flex flex-col min-w-0">
                <span className="text-xs font-semibold text-amber-300">
                    En espera de validación del cliente
                </span>
                <span className="text-[11px] text-zinc-400">
                    El usuario que ingresó este ticket ({submitter?.name || 'Cliente'}) debe aprobar o rechazar la solución.
                </span>
            </div>
        </div>
      )}

      {/* Banner para el técnico a cargo cuando el ticket está en proceso */}
      {ticket.status === 'En proceso' && isTechnicianInCharge && (
        <div data-tour="ticket-approval-actions" className="flex-none mt-2.5 p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div className="flex items-center gap-2.5 min-w-0">
                <div className="h-7 w-7 rounded-full bg-blue-500/20 border border-blue-500/30 flex items-center justify-center shrink-0">
                    <Play className="h-3.5 w-3.5 text-blue-400" />
                </div>
                <div className="flex flex-col min-w-0">
                    <span className="text-xs font-semibold text-blue-300">
                        Atendiendo requerimiento
                    </span>
                    <span className="text-[11px] text-zinc-400">
                        Al concluir tu trabajo técnico, envíalo a aprobación del cliente:
                    </span>
                </div>
            </div>
            <Button 
                size="sm"
                disabled={isUpdating}
                onClick={() => handleAction('Espera de aprobación', 'Trabajo finalizado por el técnico. Enviado al cliente para revisión y control de calidad.')}
                className="min-h-[34px] text-xs font-bold bg-amber-600 hover:bg-amber-500 text-white border border-amber-500/50 cursor-pointer shrink-0"
            >
                <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" /> Terminado (Espera de aprobación)
            </Button>
        </div>
      )}

      {/* VISTA 1: CHAT Y BITÁCORA */}
      {activeTab === "chat" && (
        <div data-chat-container="true" data-tour="ticket-chat-area" data-no-pull-to-refresh="true" className="flex flex-col flex-1 min-h-0 w-full mt-2">
            {/* Resumen colapsable de la descripción del problema */}
            <div className="p-2.5 bg-primary/5 border border-primary/20 rounded-xl text-xs flex-none mb-2">
                <div className="flex items-center justify-between">
                    <span className="font-bold text-primary flex items-center gap-1.5 text-[11px] uppercase tracking-wider">
                        <Sparkles className="w-3 h-3" /> Problema Reportado
                    </span>
                    <div className="flex items-center gap-2">
                        {imageUrl && (
                            <button
                                type="button"
                                onClick={() => setActiveTab("detalles")}
                                className="text-[10px] text-cyan-400 hover:underline flex items-center gap-1 font-bold cursor-pointer"
                            >
                                <ImageIcon className="w-3 h-3" /> Ver Foto
                            </button>
                        )}
                        <button
                            type="button"
                            onClick={() => setShowFullDesc(!showFullDesc)}
                            className="text-[10px] text-primary/80 hover:text-primary font-bold underline cursor-pointer"
                        >
                            {showFullDesc ? "Ocultar" : "Ver más"}
                        </button>
                    </div>
                </div>
                {showFullDesc ? (
                    <p className="mt-1.5 text-zinc-300 text-xs whitespace-pre-wrap leading-relaxed max-h-32 overflow-y-auto custom-scrollbar">
                        {cleanDescription}
                    </p>
                ) : (
                    <p className="mt-1 text-zinc-400 text-xs truncate">
                        {cleanDescription || "Sin descripción proporcionada."}
                    </p>
                )}
            </div>

            {/* Zona de Chat con SCROLL NATIVO Y FLUIDO (sin pull-to-refresh) */}
            <div 
              ref={chatScrollRef}
              data-chat-messages="true"
              data-no-pull-to-refresh="true"
              className="flex-1 overflow-y-auto overscroll-contain min-h-0 pr-1 custom-scrollbar bg-black/20 border border-white/5 rounded-xl p-3 shadow-inner"
              style={{ overscrollBehaviorY: 'contain', touchAction: 'pan-y', WebkitOverflowScrolling: 'touch' }}
            >
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
                    {/* Indicador de "escribiendo..." en tiempo real */}
                    {typingUser && (
                        <div className="flex items-center gap-2 py-1.5 px-0.5 text-xs text-zinc-400 animate-in fade-in duration-200">
                            <div className="flex items-center gap-2 bg-white/5 border border-white/10 px-3.5 py-2 rounded-2xl rounded-bl-sm shadow-sm backdrop-blur-sm">
                                <span className="font-bold text-zinc-200 text-xs">{typingUser.name}</span>
                                <span className="text-[11px] text-zinc-400 font-medium">está escribiendo</span>
                                <span className="inline-flex items-center gap-1 ml-0.5">
                                    <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce [animation-delay:-0.3s]" />
                                    <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce [animation-delay:-0.15s]" />
                                    <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" />
                                </span>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>
            )}
        </div>

        {/* Input de Mensajes */}
        {ticket.status !== 'Terminado' ? (
            <div className="flex-none pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] sm:pb-0 mt-auto bg-background/95">
                <div className="flex gap-2 items-center">
                    <Textarea
                        placeholder="Escribe un mensaje o responde..."
                        className="resize-none min-h-[46px] max-h-[120px] bg-black/40 border-white/10 text-base sm:text-sm py-2.5 px-3 rounded-xl focus:ring-1 focus:ring-primary/50"
                        value={newMessage}
                        onChange={(e) => handleTyping(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                sendMessage();
                            }
                        }}
                    />
                    <Button 
                        onClick={sendMessage} 
                        disabled={!newMessage.trim()} 
                        className="h-[46px] w-[46px] shrink-0 bg-primary/20 text-primary hover:bg-primary hover:text-white transition-colors rounded-xl p-0 flex items-center justify-center active:scale-95 min-h-[44px] min-w-[44px] cursor-pointer"
                    >
                        <Send className="h-5 w-5" />
                    </Button>
                </div>
            </div>
        ) : (
            <div className="flex-none pt-3 pb-[max(0.5rem,env(safe-area-inset-bottom))] sm:pb-0 border-t border-white/10 mt-auto">
                <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-3 flex items-center justify-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                    <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest italic text-center">
                        Ticket Finalizado y Almacenado en Historial
                    </span>
                </div>
            </div>
        )}
      </div>
      )}

      {/* VISTA 2: DETALLES DEL TICKET */}
      {activeTab === "detalles" && (
        <div className="flex-1 overflow-y-auto overscroll-contain min-h-0 pr-1 space-y-4 custom-scrollbar mt-2 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
            {/* Contacto & Solicitante */}
            <div className="p-3.5 bg-white/5 border border-white/10 rounded-xl space-y-2">
                <h4 className="text-[11px] font-bold uppercase tracking-widest text-primary mb-2">Información del Caso</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                    <div>
                        <span className="text-zinc-500 font-medium block">Solicitante:</span>
                        <span className="text-white font-bold">{submitter?.name || "Desconocido"}</span>
                    </div>
                    <div>
                        <span className="text-zinc-500 font-medium block">Empresa:</span>
                        <span className="text-primary font-black uppercase tracking-wider">{submitter?.empresa || "Externo"}</span>
                    </div>
                    <div>
                        <span className="text-zinc-500 font-medium block">Correo:</span>
                        <span className="text-zinc-300 break-all">{submitter?.email || "-"}</span>
                    </div>
                    <div>
                        <span className="text-zinc-500 font-medium block">Técnico Responsable:</span>
                        <span className={assignee ? "text-white font-bold" : "text-zinc-500 italic"}>
                            {assignee?.name || "Sin Asignar"}
                        </span>
                    </div>
                </div>

                {/* Botones de llamada */}
                <div className="flex flex-wrap gap-2 pt-2 border-t border-white/5 mt-2">
                    {currentUserProfile?.id !== ticket.submitterId && submitter?.phone && (
                        <a 
                            href={`tel:${submitter.phone}`} 
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20 text-xs font-mono font-bold hover:bg-blue-500/20 min-h-[38px]"
                        >
                            <Phone className="w-3.5 h-3.5" /> Llamar Cliente ({submitter.phone})
                        </a>
                    )}
                    {currentUserProfile?.id === ticket.submitterId && assignee?.phone && (
                        <a 
                            href={`tel:${assignee.phone}`} 
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 text-primary border border-primary/20 text-xs font-mono font-bold hover:bg-primary/20 min-h-[38px]"
                        >
                            <Phone className="w-3.5 h-3.5" /> Llamar Soporte ({assignee.phone})
                        </a>
                    )}
                </div>
            </div>

            {/* Fechas & Módulo */}
            <div className="flex items-center justify-between text-[11px] text-zinc-400 px-1 flex-wrap gap-2">
                <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3 text-primary" /> Creado el {format(ticket.createdAt, "dd/MM/yyyy HH:mm")}
                </span>
                <span className="flex items-center gap-1">
                    <AlertCircle className="w-3 h-3 text-primary" /> Módulo: <strong className="text-zinc-300">{ticket.category}</strong>
                </span>
            </div>

            {/* Descripción Completa */}
            <div className="p-4 bg-primary/5 rounded-xl border border-primary/20">
                <h4 className="text-xs font-bold uppercase tracking-widest text-primary mb-2.5 flex items-center gap-2">
                    <Sparkles className="w-4 h-4" /> Descripción Completa del Problema
                </h4>
                <div className="text-sm text-zinc-200 leading-relaxed whitespace-pre-wrap">
                    {cleanDescription || "Sin descripción proporcionada."}
                </div>
            </div>

            {/* Evidencia Imagen (si existe) */}
            {imageUrl && (
                <div className="rounded-xl border border-white/10 overflow-hidden bg-black/40 shadow-2xl">
                    <div className="p-2.5 border-b border-white/5 bg-white/5 flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400 flex items-center gap-1.5">
                            <ImageIcon className="w-3.5 h-3.5 text-primary" /> Captura / Evidencia Adjunta
                        </span>
                        <a 
                            href={imageUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-[10px] text-primary hover:underline font-bold uppercase tracking-wider"
                        >
                            Abrir en pantalla completa ↗
                        </a>
                    </div>
                    <div className="relative overflow-hidden bg-black/60 p-2 flex items-center justify-center">
                        <img 
                            src={imageUrl} 
                            alt="Evidencia del problema" 
                            className="max-h-72 w-auto object-contain rounded-lg shadow-lg"
                        />
                    </div>
                </div>
            )}

            {/* Acciones de Flujo de Trabajo */}
            <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 shadow-lg space-y-3">
                <h4 className="text-[11px] font-bold uppercase tracking-widest text-primary">Flujo de Trabajo Operativo</h4>
                <div className="flex flex-col gap-2">
                    {ticket.status === 'Ingresado' && isTechnicianInCharge && (
                        <Button disabled={isUpdating} onClick={() => handleAction('En proceso', 'Ticket marcado como "En Proceso" por el técnico. Comenzando a trabajar en la solución.')} className="w-full min-h-[44px] text-xs sm:text-sm font-semibold bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30 border border-cyan-500/30">
                            <Play className="w-4 h-4 mr-2" /> Iniciar Trabajo (Agente)
                        </Button>
                    )}
                    
                    {ticket.status === 'En proceso' && isTechnicianInCharge && (
                        <Button disabled={isUpdating} onClick={() => handleAction('Espera de aprobación', 'Trabajo finalizado por el técnico. Enviado al cliente para revisión y control de calidad.')} className="w-full min-h-[44px] text-xs sm:text-sm font-semibold bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 border border-amber-500/30">
                            <CheckCircle2 className="w-4 h-4 mr-2" /> Terminado (Enviar a espera de aprobación)
                        </Button>
                    )}

                    {ticket.status === 'Espera de aprobación' && isSubmitter && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full">
                            <Button disabled={isUpdating} onClick={() => handleAction('Terminado', 'Solución validada y aceptada por el cliente. Ticket cerrado exitosamente.')} className="w-full min-h-[44px] text-xs sm:text-sm font-semibold bg-green-500/20 text-green-400 hover:bg-green-500/30 border border-green-500/30">
                                <CheckCircle2 className="w-4 h-4 mr-2" /> Aprobar Solución
                            </Button>
                            <Button 
                                disabled={isUpdating} 
                                onClick={() => setIsRejectDialogOpen(true)} 
                                className="w-full min-h-[44px] text-xs sm:text-sm font-semibold bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/30 cursor-pointer"
                            >
                                <XCircle className="w-4 h-4 mr-2" /> Rechazar Solución
                            </Button>
                        </div>
                    )}

                    {ticket.status === 'Espera de aprobación' && !isSubmitter && (
                        <div className="text-xs sm:text-sm font-medium text-amber-400 flex items-center justify-center p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                            <AlertCircle className="w-4 h-4 mr-2 shrink-0" /> En espera de validación y aprobación por parte del cliente ({submitter?.name || "Solicitante"}).
                        </div>
                    )}

                    {ticket.status === 'Terminado' && (
                        <div className="text-sm font-medium text-green-400 flex items-center justify-center p-2 rounded-lg bg-green-500/10 border border-green-500/20">
                            <CheckCircle2 className="w-4 h-4 mr-2" /> Este requerimiento ha finalizado exitosamente.
                        </div>
                    )}
                </div>
            </div>

            {/* Control de Asignación (Administrador Full) */}
            {currentUserProfile?.role === 'Administrador Full' && (
                <div data-tour="ticket-assignment-control" className="bg-blue-500/5 border border-blue-500/20 rounded-xl p-4">
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
      )}

      {/* Modal para ingresar motivo de rechazo */}
      <Dialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
        <DialogContent className="max-w-md bg-zinc-950 border border-white/15 text-white p-5 rounded-2xl shadow-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base text-red-400 font-bold">
              <XCircle className="h-5 w-5" />
              Rechazar Solución
            </DialogTitle>
            <DialogDescription className="text-xs text-zinc-400">
              Indica qué ocurrió o qué faltó resolver para que el técnico continúe trabajando en el requerimiento.
            </DialogDescription>
          </DialogHeader>

          <div className="py-2">
            <Textarea
              placeholder="Ej: Aún persiste el problema al intentar conectarse..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="min-h-[100px] bg-black/40 border-white/10 text-sm p-3 rounded-xl focus:ring-1 focus:ring-red-500/50 resize-none"
            />
          </div>

          <DialogFooter className="flex flex-row gap-2 justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsRejectDialogOpen(false)}
              className="border-white/10 text-zinc-300 hover:text-white"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              disabled={isUpdating}
              onClick={async () => {
                const reason = rejectReason.trim();
                setIsRejectDialogOpen(false);
                setRejectReason("");
                await handleAction(
                  'En proceso',
                  reason ? `Solución RECHAZADA por el cliente. Motivo: ${reason}` : 'Solución rechazada por el cliente. Se solicita nueva revisión.'
                );
              }}
              className="bg-red-600 hover:bg-red-500 text-white font-bold"
            >
              Confirmar Rechazo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
