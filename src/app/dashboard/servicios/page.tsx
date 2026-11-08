"use client";

import { useEffect, useState, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { 
    createServiceAction, 
    getServicesAction, 
    updateServiceAction, 
    deleteServiceAction 
} from "@/app/actions/services";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
    BriefcaseBusiness, 
    Clock, 
    MoreVertical, 
    PlusCircle, 
    Settings,
    HardDrive,
    Lock,
    Wifi,
    Pencil,
    Trash2,
    Eye,
    Info,
    History,
    Shield,
    Timer,
    Zap
} from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Separator } from "@/components/ui/separator";
import { getServiceResponseSla } from "@/lib/sla-utils";

const iconMap: Record<string, any> = {
    'Equipos TI': <HardDrive className="h-5 w-5" />,
    'Software': <Settings className="h-5 w-5" />,
    'Redes': <Wifi className="h-5 w-5" />,
    'Cuentas y colaboración': <Lock className="h-5 w-5" />,
    'Infraestructura y seguridad': <Shield className="h-5 w-5" />,
    'Sistemas empresariales': <BriefcaseBusiness className="h-5 w-5" />,
    // Fallbacks
    Hardware: <HardDrive className="h-5 w-5" />,
    Accesos: <Lock className="h-5 w-5" />,
    Otro: <BriefcaseBusiness className="h-5 w-5" />,
};

export default function ServiciosPage() {
    const supabase = useMemo(() => createClient(), []);
    const router = useRouter();
    const { toast } = useToast();
    const [userRole, setUserRole] = useState<string | null>(null);
    const [catalog, setCatalog] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSheetOpen, setIsSheetOpen] = useState(false);
    const [sheetMode, setSheetMode] = useState<'create' | 'edit' | 'view'>('create');
    const [editingService, setEditingService] = useState<any | null>(null);
    const [viewingService, setViewingService] = useState<any | null>(null);
    const [serviceToDelete, setServiceToDelete] = useState<any | null>(null);
    
    // Form State
    const [formData, setFormData] = useState({
        nombre: "",
        category: "Software",
        slaHours: "48",
    });

    useEffect(() => {
        const checkRole = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('role')
                    .eq('id', user.id)
                    .single();

                setUserRole(profile?.role || 'Administrador Full');
            } else {
                setUserRole('Administrador Full');
            }
            loadServices();
        };
        checkRole();
    }, []);

    const loadServices = async () => {
        setLoading(true);
        const result = await getServicesAction();
        if (result.success && result.data) {
            setCatalog(result.data);
        }
        setLoading(false);
    };

    const handleOpenCreate = () => {
        setEditingService(null);
        setFormData({ nombre: "", category: "Software", slaHours: "48" });
        setSheetMode('create');
        setIsSheetOpen(true);
    };

    const handleOpenEdit = (srv: any) => {
        setEditingService(srv);
        setFormData({
            nombre: srv.name,
            category: srv.category,
            slaHours: srv.sla_hours.toString(),
        });
        setSheetMode('edit');
        setIsSheetOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        const priorityMap: Record<string, string> = {
            "4": "Crítica",
            "8": "Alta",
            "16": "Media",
            "24": "Baja",
            "12": "Alta",
            "48": "Media",
            "72": "Baja"
        };

        try {
            let result;
            if (editingService) {
                result = await updateServiceAction(editingService.id, {
                    name: formData.nombre,
                    category: formData.category,
                    priority: priorityMap[formData.slaHours] || "Media",
                    sla_hours: parseInt(formData.slaHours),
                });
            } else {
                result = await createServiceAction({
                    name: formData.nombre,
                    category: formData.category,
                    priority: priorityMap[formData.slaHours] || "Media",
                    sla_hours: parseInt(formData.slaHours),
                });
            }

            if (!result.success) {
                toast({
                    title: "Error",
                    description: result.error || "No se pudo procesar el servicio.",
                    variant: "destructive",
                });
            } else {
                toast({
                    title: editingService ? "Servicio actualizado" : "Servicio registrado",
                    description: editingService ? "Los cambios se guardaron correctamente." : "El ítem ha sido añadido al catálogo maestro.",
                });
                
                await loadServices();
                setIsSheetOpen(false);
            }
        } catch (error) {
            toast({
                title: "Error inesperado",
                description: "Ocurrió un error en el servidor.",
                variant: "destructive",
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async () => {
        if (!serviceToDelete) return;
        setIsSubmitting(true);
        try {
            const result = await deleteServiceAction(serviceToDelete.id);
            if (result.success) {
                toast({ title: "Servicio eliminado", description: "El ítem fue removido del catálogo maestro." });
                await loadServices();
            } else {
                toast({ title: "Error", description: result.error, variant: "destructive" });
            }
        } catch (error) {
            toast({ title: "Error", description: "Error al comunicar con el servidor.", variant: "destructive" });
        } finally {
            setIsSubmitting(false);
            setServiceToDelete(null);
        }
    };

    if (!userRole && !loading) return <div className="p-8 text-center text-red-500 italic">Acceso denegado.</div>;

    return (
        <div className="flex flex-col gap-6 relative">
            {/* Overlay de carga estable */}
            {(loading && catalog.length === 0) && (
                <div className="absolute inset-0 z-50 flex items-center justify-center bg-zinc-950/20 backdrop-blur-sm rounded-xl">
                    <div className="flex flex-col items-center gap-2">
                        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                        <p className="text-xs text-zinc-500 italic">Consultando catálogo maestro...</p>
                    </div>
                </div>
            )}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-white uppercase italic">Catálogo de Servicios</h1>
                    <p className="text-muted-foreground mt-1 text-sm">
                        Define los entregables contractuales y sus tiempos de respuesta (SLA).
                    </p>
                </div>
                <Button onClick={handleOpenCreate} className="gap-2 bg-primary hover:bg-primary/90 text-black font-bold">
                    <PlusCircle className="h-4 w-4" />
                    Nuevo Servicio
                </Button>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {catalog.map((srv) => (
                    <Card key={srv.id} className="glass-card border-white/5 relative overflow-hidden group hover:border-primary/30 transition-all bg-black/20">
                        <CardHeader className="pb-4">
                            <div className="flex justify-between items-start">
                                <div className="p-2.5 bg-primary/10 rounded-xl text-primary border border-primary/20 shadow-[0_0_15px_rgba(59,130,246,0.1)]">
                                    {iconMap[srv.category] || <BriefcaseBusiness className="h-5 w-5" />}
                                </div>
                                <div className="flex gap-2">
                                    <Badge variant="outline" className={
                                        srv.priority === 'Crítica' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                                        srv.priority === 'Alta' ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' :
                                        'bg-zinc-800 text-zinc-400 border-zinc-700'
                                    }>
                                        {srv.priority}
                                    </Badge>
                                    
                                    <DropdownMenu modal={false}>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-white">
                                                <MoreVertical className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className="bg-zinc-900 border-white/10 text-white">
                                            <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                                            <DropdownMenuSeparator className="bg-white/5" />
                                            <DropdownMenuItem 
                                                className="gap-2 cursor-pointer" 
                                                onSelect={() => {
                                                    setViewingService(srv); 
                                                    setSheetMode('view');
                                                    setIsSheetOpen(true);
                                                }}
                                            >
                                                <Eye className="h-4 w-4" /> Ver Detalles
                                            </DropdownMenuItem>
                                            <DropdownMenuItem 
                                                className="gap-2 cursor-pointer" 
                                                onSelect={() => {
                                                    handleOpenEdit(srv);
                                                }}
                                            >
                                                <Pencil className="h-4 w-4" /> Editar
                                            </DropdownMenuItem>
                                            <DropdownMenuItem 
                                                className="gap-2 cursor-pointer text-red-400 focus:text-red-400 focus:bg-red-400/10" 
                                                onSelect={() => {
                                                    setServiceToDelete(srv);
                                                }}
                                            >
                                                <Trash2 className="h-4 w-4" /> Eliminar
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                            </div>
                            <CardTitle className="mt-4 text-base sm:text-lg font-bold text-white leading-tight uppercase tracking-tight">
                                <span>{srv.name}</span>
                            </CardTitle>
                            <CardDescription className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mt-2 font-medium">
                                <span className="flex items-center gap-1.5 text-primary text-xs font-bold">
                                    <Clock className="h-3.5 w-3.5" />
                                    Resolución: {srv.sla_hours} h
                                </span>
                                <span className="flex items-center gap-1.5 text-cyan-400 text-xs font-bold font-mono">
                                    <Timer className="h-3.5 w-3.5" />
                                    Respuesta: {getServiceResponseSla(srv.name)}
                                </span>
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex flex-col gap-2 bg-black/20 p-3 rounded-lg border border-white/5">
                                <div className="flex justify-between items-center text-xs">
                                    <span className="text-muted-foreground">Categoría Técnica</span>
                                    <span className="text-white font-semibold">{srv.category}</span>
                                </div>
                                <div className="flex justify-between items-center text-xs">
                                    <span className="text-muted-foreground">Prioridad Base</span>
                                    <span className="text-zinc-300 font-medium">{srv.priority}</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
                <SheetContent className="glass-panel border-l-primary/20 flex flex-col sm:max-w-md w-full p-0">
                    {sheetMode === 'view' ? (
                        <>
                            <div className="p-6">
                                <SheetHeader>
                                    <SheetTitle className="flex items-center gap-2 text-white">
                                        <Zap className="h-5 w-5 text-primary" />
                                        Detalles del Servicio
                                    </SheetTitle>
                                    <SheetDescription>
                                        Especificaciones técnicas y tiempos de respuesta.
                                    </SheetDescription>
                                </SheetHeader>
                            </div>

                            {viewingService && (
                                <div className="mt-2 space-y-6 flex-1 overflow-y-auto px-6 custom-scrollbar pb-8">
                                    <div className="flex flex-col items-center justify-center p-8 bg-white/5 rounded-2xl border border-white/10 mb-6 relative overflow-hidden text-center">
                                        <div className="p-4 bg-primary/10 rounded-full border border-primary/20 mb-4">
                                            {iconMap[viewingService.category] || <Settings className="h-10 w-10 text-primary" />}
                                        </div>
                                        <h3 className="text-xl font-bold text-white tracking-tight">{viewingService.name}</h3>
                                        <Badge variant="outline" className="mt-3 bg-zinc-800 text-zinc-400 border-zinc-700 uppercase text-[9px] tracking-[0.2em] font-bold">
                                            Categoría: {viewingService.category}
                                        </Badge>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="grid grid-cols-1 gap-3">
                                            <div className="p-4 bg-white/5 rounded-xl border border-white/5 space-y-2">
                                                <div className="flex items-center gap-2 text-zinc-500 text-[10px] font-bold uppercase tracking-widest">
                                                    <Clock className="h-3 w-3" /> Compromiso de Respuesta (SLA)
                                                </div>
                                                <div className="flex items-center justify-between">
                                                    <p className="text-white font-bold">{viewingService.sla_hours} Horas Hábiles</p>
                                                    <Badge className="bg-primary/20 text-primary border-primary/30">
                                                        {viewingService.priority}
                                                    </Badge>
                                                </div>
                                            </div>

                                            <div className="p-4 bg-white/5 rounded-xl border border-white/5 space-y-2">
                                                <div className="flex items-center gap-2 text-zinc-500 text-[10px] font-bold uppercase tracking-widest">
                                                    <Info className="h-3 w-3" /> Descripción del Servicio
                                                </div>
                                                <p className="text-zinc-300 text-sm leading-relaxed">
                                                    Soporte técnico especializado para la gestión y mantenimiento de {viewingService.name.toLowerCase()}.
                                                </p>
                                            </div>

                                            <div className="p-4 bg-white/5 rounded-xl border border-white/5 space-y-2">
                                                <div className="flex items-center gap-2 text-zinc-500 text-[10px] font-bold uppercase tracking-widest">
                                                    <History className="h-3 w-3" /> Historial Operativo
                                                </div>
                                                <p className="text-white text-sm">
                                                    Vigente desde el {new Date(viewingService.created_at).toLocaleDateString('es-CL')}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <Separator className="bg-white/5" />

                                    <div className="bg-primary/5 border border-primary/10 rounded-xl p-4">
                                        <div className="flex gap-4">
                                            <div className="h-10 w-10 shrink-0 rounded-full bg-primary/20 flex items-center justify-center">
                                                <Shield className="h-5 w-5 text-primary" />
                                            </div>
                                            <div>
                                                <h5 className="text-sm font-bold text-white">Garantía de Servicio</h5>
                                                <p className="text-[11px] text-zinc-400 mt-1 leading-relaxed">
                                                    Este servicio cumple con los estándares corporativos de calidad y tiempos de resolución definidos en el contrato marco.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="p-6 mt-auto border-t border-white/5">
                                <Button 
                                    className="w-full bg-zinc-800 hover:bg-zinc-700 text-white font-bold" 
                                    onClick={() => setIsSheetOpen(false)}
                                >
                                    Cerrar Expediente
                                </Button>
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="p-6">
                                <SheetHeader>
                                    <SheetTitle className="text-white">{editingService ? "Editar Servicio" : "Crear Nuevo Servicio"}</SheetTitle>
                                    <SheetDescription>
                                        {editingService ? "Modifica los parámetros del catálogo." : "Define un nuevo entregable para tus clientes. El sistema aplicará este SLA automáticamente."}
                                    </SheetDescription>
                                </SheetHeader>
                            </div>
                            
                            <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden px-6 mt-2">
                                <div className="space-y-4 flex-1 overflow-y-auto pr-2 custom-scrollbar pb-6">
                                    <div className="space-y-2">
                                        <Label className="text-zinc-400 text-xs">Nombre del Servicio / Ítem</Label>
                                        <Input 
                                            required 
                                            placeholder="Ej: Mantenimiento Preventivo Mensual" 
                                            value={formData.nombre} 
                                            onChange={e => setFormData({...formData, nombre: e.target.value})} 
                                            className="bg-white/5 border-white/10" 
                                        />
                                    </div>
                                    
                                    <div className="space-y-2">
                                        <Label className="text-zinc-400 text-xs">Categoría Técnica</Label>
                                        <Select value={formData.category} onValueChange={(v) => setFormData({...formData, category: v})}>
                                            <SelectTrigger className="bg-white/5 border-white/10">
                                                <SelectValue placeholder="Categoría..." />
                                            </SelectTrigger>
                                            <SelectContent className="bg-zinc-900 border-white/10 text-white">
                                                <SelectItem value="Equipos TI">Equipos TI</SelectItem>
                                                <SelectItem value="Software">Software</SelectItem>
                                                <SelectItem value="Redes">Redes</SelectItem>
                                                <SelectItem value="Cuentas y colaboración">Cuentas y colaboración</SelectItem>
                                                <SelectItem value="Infraestructura y seguridad">Infraestructura y seguridad</SelectItem>
                                                <SelectItem value="Sistemas empresariales">Sistemas empresariales</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-2">
                                        <Label className="text-zinc-400 text-xs">SLA de Resolución</Label>
                                        <Select value={formData.slaHours} onValueChange={(v) => setFormData({...formData, slaHours: v})}>
                                            <SelectTrigger className="bg-white/5 border-white/10">
                                                <SelectValue placeholder="SLA..." />
                                            </SelectTrigger>
                                            <SelectContent className="bg-zinc-900 border-white/10 text-white">
                                                <SelectItem value="4">4 Horas (Crítica / Urgente)</SelectItem>
                                                <SelectItem value="8">8 Horas (Alta Prioridad)</SelectItem>
                                                <SelectItem value="16">16 Horas (Media Prioridad)</SelectItem>
                                                <SelectItem value="24">24 Horas (Baja Prioridad / Planificada)</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <p className="text-[10px] text-muted-foreground mt-2 italic text-zinc-500">
                                            Nota: La prioridad (Crítica, Alta, etc.) se infiere según las horas de SLA seleccionadas.
                                        </p>
                                    </div>
                                </div>

                                <div className="mt-auto py-6 border-t border-white/5 flex gap-3">
                                    <Button type="button" variant="ghost" className="flex-1 hover:bg-white/5" onClick={() => setIsSheetOpen(false)} disabled={isSubmitting}>Cancelar</Button>
                                    <Button type="submit" className="flex-1 bg-primary hover:bg-primary/90 text-black font-bold uppercase tracking-wider" disabled={isSubmitting}>
                                        {isSubmitting ? "Procesando..." : (editingService ? "Guardar" : "Registrar")}
                                    </Button>
                                </div>
                            </form>
                        </>
                    )}
                </SheetContent>
            </Sheet>

            <AlertDialog open={!!serviceToDelete} onOpenChange={(open) => !open && setServiceToDelete(null)}>

                <AlertDialogContent className="bg-zinc-900 border-white/10 text-white">
                    <AlertDialogHeader>
                        <AlertDialogTitle>¿Eliminar servicio del catálogo?</AlertDialogTitle>
                        <AlertDialogDescription className="text-zinc-400">
                            Esta acción eliminará <strong>{serviceToDelete?.name}</strong>. Esto no afectará a los tickets ya creados con este servicio, pero no podrá seleccionarse para nuevos casos.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel className="bg-transparent border-white/10 hover:bg-white/5">Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className="bg-red-500 hover:bg-red-600">
                            Confirmar Eliminación
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
