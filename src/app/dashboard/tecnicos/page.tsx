"use client";

import { useEffect, useState, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { 
    getProfilesAction, 
    updateProfileAction, 
    deleteProfileAction,
    createProfileAction
} from "@/app/actions/profiles";
import { useToast } from "@/hooks/use-toast";
import { User } from "@/lib/definitions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
    MoreHorizontal, 
    PlusCircle, 
    Search, 
    Wrench, 
    Star,
    Trash2,
    Eye,
    EyeOff,
    Shield,
    Calendar,
    Award,
    Pencil,
    Mail
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from "@/components/ui/sheet";
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

export default function TecnicosPage() {
    const supabase = useMemo(() => createClient(), []);
    const router = useRouter();
    const { toast } = useToast();
    const [userRole, setUserRole] = useState<string | null>(null);
    const [tecnicos, setTecnicos] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [isSheetOpen, setIsSheetOpen] = useState(false);
    const [sheetMode, setSheetMode] = useState<'create' | 'edit' | 'view'>('create');
    const [editingTech, setEditingTech] = useState<any | null>(null);
    const [viewingTech, setViewingTech] = useState<any | null>(null);
    const [techToDelete, setTechToDelete] = useState<any | null>(null);
    const [showPassword, setShowPassword] = useState(false);
    
    // Form State
    const [formData, setFormData] = useState({
        nombre: "",
        email: "",
        especialidad: "Soporte Nivel 1",
        estado: "Disponible",
        password: "",
    });

    useEffect(() => {
        const checkRole = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                router.push("/login");
                return;
            }

            const { data: profile } = await supabase
                .from('profiles')
                .select('role')
                .eq('id', user.id)
                .single();

            const role = profile?.role?.trim();
            if (role !== 'Administrador Full') {
                toast({ 
                    title: "Acceso denegado", 
                    description: "No tienes permisos para ver el directorio técnico.", 
                    variant: "destructive" 
                });
                router.push("/dashboard");
                return;
            }
            setUserRole(role);
            loadTechs();
        };
        checkRole();
    }, []);

    const loadTechs = async () => {
        setLoading(true);
        const result = await getProfilesAction(['Técnico']);
        if (result.success && result.data) {
            setTecnicos(result.data);
        }
        setLoading(false);
    };

    const handleOpenCreate = () => {
        setEditingTech(null);
        setFormData({ nombre: "", email: "", especialidad: "Soporte Nivel 1", estado: "Disponible", password: "" });
        setSheetMode('create');
        setIsSheetOpen(true);
    };

    const handleOpenEdit = (tech: any) => {
        setEditingTech(tech);
        setFormData({
            nombre: tech.name,
            email: tech.email, // Read-only in form for edit
            especialidad: tech.specialty || "Soporte Nivel 1",
            estado: tech.status || "Disponible",
            password: "", // Not used for edit
        });
        setSheetMode('edit');
        setIsSheetOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        
        try {
            let result;
            if (editingTech) {
                result = await updateProfileAction(editingTech.id, {
                    name: formData.nombre,
                    role: 'Técnico',
                    specialty: formData.especialidad,
                    status: formData.estado,
                    avatar_url: '/avatars/3.png'
                });
            } else {
                result = await createProfileAction({
                    name: formData.nombre,
                    email: formData.email,
                    password: formData.password,
                    role: 'Técnico',
                    specialty: formData.especialidad,
                    status: formData.estado,
                    avatar_url: '/avatars/3.png'
                });
            }

            if (!result.success) {
                toast({
                    title: "Error",
                    description: result.error || "No se pudo realizar la operación.",
                    variant: "destructive",
                });
            } else {
                toast({
                    title: editingTech ? "Técnico actualizado" : "Técnico incorporado",
                    description: editingTech ? "Perfil modificado correctamente." : "El agente ha sido registrado exitosamente.",
                });
                
                await loadTechs();
                setIsSheetOpen(false);
            }
        } catch (error) {
            toast({ title: "Error crítico", description: "Ocurrió un error en el servidor.", variant: "destructive" });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async () => {
        if (!techToDelete) return;
        setIsSubmitting(true);
        try {
            const result = await deleteProfileAction(techToDelete.id);
            if (result.success) {
                toast({ title: "Técnico eliminado", description: "La cuenta y el perfil han sido borrados." });
                await loadTechs();
            } else {
                toast({ title: "Error", description: result.error, variant: "destructive" });
            }
        } catch (error) {
            toast({ title: "Error", description: "Fallo en la comunicación con el servidor.", variant: "destructive" });
        } finally {
            setIsSubmitting(false);
            setTechToDelete(null);
        }
    };

    const filteredTecnicos = (tecnicos || []).filter(t => 
        (t.name || "").toLowerCase().includes(searchTerm.toLowerCase()) || 
        (t.specialty || "").toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="flex flex-col gap-6 relative">
            {/* Overlay de carga estable */}
            {(loading && tecnicos.length === 0) && (
                <div className="absolute inset-0 z-50 flex items-center justify-center bg-zinc-950/20 backdrop-blur-sm rounded-xl">
                    <div className="flex flex-col items-center gap-2">
                        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                        <p className="text-xs text-zinc-500 italic">Cargando equipo técnico...</p>
                    </div>
                </div>
            )}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Técnicos y Especialistas</h1>
                    <p className="text-muted-foreground mt-1">
                        Administra el equipo de soporte interno y su volumen de trabajo.
                    </p>
                </div>
                <Button onClick={handleOpenCreate} className="gap-2 bg-blue-600 hover:bg-blue-700 text-white">
                    <PlusCircle className="h-4 w-4" />
                    Nuevo Técnico
                </Button>
            </div>

            <Card className="glass-card border-none">
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <div className="space-y-1">
                            <CardTitle>Equipo de Resolución</CardTitle>
                            <CardDescription>Técnicos operativos dentro del sistema Vanguardia.</CardDescription>
                        </div>
                        <div className="relative w-64">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input 
                                placeholder="Buscar especialista..." 
                                className="pl-8 bg-black/20 border-white/10 text-white"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow className="border-white/10">
                                <TableHead>Técnico</TableHead>
                                <TableHead>Especialidad</TableHead>
                                <TableHead>Carga Actual (Tickets)</TableHead>
                                <TableHead>Calificación CSAT</TableHead>
                                <TableHead>Disponibilidad</TableHead>
                                <TableHead className="text-right">Acciones</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredTecnicos.map((tec) => (
                                <TableRow key={tec.id} className="border-white/5 hover:bg-white/5">
                                    <TableCell className="font-medium flex items-center gap-3">
                                        <Avatar className="h-8 w-8 border border-white/10">
                                            <AvatarFallback className="bg-blue-500/20 text-blue-400">
                                                {(tec.name || "U").charAt(0)}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <p className="font-medium text-sm text-white leading-none">{tec.name}</p>
                                            <p className="text-[10px] text-muted-foreground mt-1 uppercase font-mono">{tec.email}</p>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2 text-muted-foreground">
                                            <Wrench className="h-3 w-3 "/>
                                            <span>{tec.specialty || "General"}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className="bg-zinc-800 text-zinc-300 border-zinc-700">
                                            0 asignados
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-1.5 text-yellow-500">
                                            <Star className="h-4 w-4 fill-current" />
                                            <span className="text-sm font-bold text-white">{tec.rating ? Number(tec.rating).toFixed(1) : "5.0"}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className={
                                            tec.role === 'Administrador Full' ? 'bg-red-500/10 text-red-400 border-red-500/20' : 
                                            'bg-blue-500/10 text-blue-400 border-blue-500/20'
                                        }>
                                            {tec.role || 'Técnico'}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className={
                                            tec.status === 'Disponible' ? 'bg-green-500/20 text-green-400 border-green-500/30' : 
                                            tec.status === 'En Terreno' ? 'bg-blue-500/20 text-blue-400 border-blue-500/30' : 
                                            'bg-red-500/20 text-red-400 border-red-500/30'
                                        }>
                                            {tec.status || 'Disponible'}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <DropdownMenu modal={false}>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="hover:text-white">
                                                    <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" className="bg-zinc-900 border-white/10 text-white">
                                                <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                                                <DropdownMenuSeparator className="bg-white/5" />
                                                <DropdownMenuItem 
                                                    className="gap-2 cursor-pointer" 
                                                    onSelect={() => {
                                                        setViewingTech(tec);
                                                        setSheetMode('view');
                                                        setIsSheetOpen(true);
                                                    }}
                                                >
                                                    <Eye className="h-4 w-4" /> Ver Perfil
                                                </DropdownMenuItem>
                                                <DropdownMenuItem 
                                                    className="gap-2 cursor-pointer" 
                                                    onSelect={() => {
                                                        handleOpenEdit(tec);
                                                    }}
                                                >
                                                    <Pencil className="h-4 w-4" /> Editar
                                                </DropdownMenuItem>
                                                <DropdownMenuItem 
                                                    className="gap-2 cursor-pointer text-red-400 focus:text-red-400 focus:bg-red-400/10" 
                                                    onSelect={() => {
                                                        setTechToDelete(tec);
                                                    }}
                                                >
                                                    <Trash2 className="h-4 w-4" /> Eliminar
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
                <SheetContent className="glass-panel border-l-primary/20 flex flex-col sm:max-w-md w-full p-0">
                    {sheetMode === 'view' ? (
                        <>
                            <div className="p-6">
                                <SheetHeader>
                                    <SheetTitle className="flex items-center gap-2 text-white">
                                        <Award className="h-5 w-5 text-primary" />
                                        Ficha del Técnico
                                    </SheetTitle>
                                    <SheetDescription>
                                        Perfil profesional y métricas de desempeño.
                                    </SheetDescription>
                                </SheetHeader>
                            </div>

                            {viewingTech && (
                                <div className="mt-2 space-y-6 flex-1 overflow-y-auto px-6 custom-scrollbar pb-8">
                                    <div className="flex flex-col items-center justify-center p-6 bg-white/5 rounded-2xl border border-white/10 mb-6 relative overflow-hidden">
                                        <div className="absolute top-0 right-0 p-4 opacity-5">
                                            <Star className="h-24 w-24 fill-current" />
                                        </div>
                                        <Avatar className="h-20 w-20 border-2 border-primary/20 mb-4">
                                            <AvatarFallback className="bg-primary/10 text-primary text-2xl font-bold uppercase">
                                                {(viewingTech.name || "T").charAt(0)}
                                            </AvatarFallback>
                                        </Avatar>
                                        <h3 className="text-xl font-bold text-white tracking-tight">{viewingTech.name}</h3>
                                        <div className="flex items-center gap-2 mt-2">
                                            <Badge variant="outline" className="bg-primary/20 text-primary border-primary/30 uppercase text-[10px] tracking-widest font-bold px-3">
                                                Especialista {viewingTech.specialty}
                                            </Badge>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="grid grid-cols-1 gap-3">
                                            <div className="p-4 bg-white/5 rounded-xl border border-white/5 space-y-1">
                                                <div className="flex items-center gap-2 text-zinc-500 text-[10px] font-bold uppercase tracking-widest">
                                                    <Mail className="h-3 w-3" /> Contacto Corporativo
                                                </div>
                                                <p className="text-white text-sm break-all font-mono">{viewingTech.email}</p>
                                            </div>

                                            <div className="grid grid-cols-2 gap-3">
                                                <div className="p-4 bg-white/5 rounded-xl border border-white/5 space-y-1">
                                                    <div className="flex items-center gap-2 text-zinc-500 text-[10px] font-bold uppercase tracking-widest">
                                                        <Star className="h-3 w-3" /> CSAT Score
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                        <span className="text-lg font-bold text-white">{viewingTech.rating ? Number(viewingTech.rating).toFixed(1) : "5.0"}</span>
                                                        <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
                                                    </div>
                                                </div>
                                                <div className="p-4 bg-white/5 rounded-xl border border-white/5 space-y-1">
                                                    <div className="flex items-center gap-2 text-zinc-500 text-[10px] font-bold uppercase tracking-widest">
                                                        <Shield className="h-3 w-3" /> Estado
                                                    </div>
                                                    <Badge variant="outline" className={viewingTech.status === 'Disponible' ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-orange-500/10 text-orange-400 border-orange-500/20'}>
                                                        {viewingTech.status}
                                                    </Badge>
                                                </div>
                                            </div>

                                            <div className="p-4 bg-white/5 rounded-xl border border-white/5 space-y-1">
                                                <div className="flex items-center gap-2 text-zinc-500 text-[10px] font-bold uppercase tracking-widest">
                                                    <Calendar className="h-3 w-3" /> Fecha de Ingreso
                                                </div>
                                                <p className="text-white text-sm">
                                                    {viewingTech.created_at ? new Date(viewingTech.created_at).toLocaleDateString('es-CL', { 
                                                        day: '2-digit', month: 'long', year: 'numeric'
                                                    }) : 'Hoy'}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <Separator className="bg-white/5" />

                                    <div className="space-y-4">
                                        <h4 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Reporte de Operaciones</h4>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="p-4 bg-zinc-900/50 rounded-xl border border-white/5 text-center">
                                                <p className="text-2xl font-bold text-white">0</p>
                                                <p className="text-[9px] text-zinc-500 uppercase font-bold">Tickets del Mes</p>
                                            </div>
                                            <div className="p-4 bg-zinc-900/50 rounded-xl border border-white/5 text-center">
                                                <p className="text-2xl font-bold text-zinc-400">0%</p>
                                                <p className="text-[9px] text-zinc-500 uppercase font-bold">Productividad</p>
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
                                    Cerrar Ficha
                                </Button>
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="p-6">
                                <SheetHeader>
                                    <SheetTitle className="text-white">{editingTech ? "Editar Técnico" : "Inscribir Nuevo Técnico"}</SheetTitle>
                                    <SheetDescription>
                                        {editingTech ? "Actualiza los datos del especialista." : "El nuevo agente comenzará con 0 carga laboral y calificación perfecta (5.0)."}
                                    </SheetDescription>
                                </SheetHeader>
                            </div>
                            
                            <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden px-6 mt-2" autoComplete="off">
                                <div className="space-y-4 flex-1 overflow-y-auto pr-2 custom-scrollbar pb-6">
                                    <div className="space-y-2">
                                        <Label className="text-zinc-400 text-xs">Nombre de Técnico</Label>
                                        <Input required placeholder="Ej: Luis Valenzuela" value={formData.nombre} onChange={e => setFormData({...formData, nombre: e.target.value})} className="bg-white/5 border-white/10" autoComplete="off" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-zinc-400 text-xs">Correo Electrónico</Label>
                                        <Input required type="email" placeholder="tecnico@vanguardia.cl" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="bg-white/5 border-white/10" disabled={!!editingTech} autoComplete="off" />
                                    </div>
                                    {!editingTech && (
                                        <div className="space-y-2">
                                            <Label className="text-zinc-400 text-xs">Contraseña de Acceso</Label>
                                            <div className="relative">
                                                <Input 
                                                    required 
                                                    type={showPassword ? "text" : "password"} 
                                                    placeholder="••••••••" 
                                                    value={formData.password} 
                                                    onChange={e => setFormData({...formData, password: e.target.value})} 
                                                    className="bg-white/5 border-white/10 pr-10" 
                                                    autoComplete="new-password"
                                                    data-lpignore="true"
                                                />
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon"
                                                    className="absolute right-0 top-0 h-full w-9 hover:bg-transparent"
                                                    onClick={() => setShowPassword(!showPassword)}
                                                >
                                                    {showPassword ? (
                                                        <EyeOff className="h-4 w-4 text-zinc-500" />
                                                    ) : (
                                                        <Eye className="h-4 w-4 text-zinc-500" />
                                                    )}
                                                </Button>
                                            </div>
                                        </div>
                                    )}
                                    
                                    <div className="space-y-2">
                                        <Label className="text-zinc-400 text-xs">Especialidad Principal</Label>
                                        <Select value={formData.especialidad} onValueChange={(v) => setFormData({...formData, especialidad: v})}>
                                            <SelectTrigger className="bg-white/5 border-white/10">
                                                <SelectValue placeholder="Seleccionar rubro..." />
                                            </SelectTrigger>
                                            <SelectContent className="bg-zinc-900 border-white/10 text-white">
                                                <SelectItem value="Soporte Nivel 1">Soporte Nivel 1</SelectItem>
                                                <SelectItem value="Soporte Nivel 2">Soporte Nivel 2</SelectItem>
                                                <SelectItem value="Infraestructura">Infraestructura Fija</SelectItem>
                                                <SelectItem value="Redes y Servidores">Redes y Servidores</SelectItem>
                                                <SelectItem value="Analísta de Ciberseguridad">Especialista Seguridad</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-2">
                                        <Label className="text-zinc-400 text-xs">Estado Inicial</Label>
                                        <Select value={formData.estado} onValueChange={(v) => setFormData({...formData, estado: v})}>
                                            <SelectTrigger className="bg-white/5 border-white/10">
                                                <SelectValue placeholder="Estado..." />
                                            </SelectTrigger>
                                            <SelectContent className="bg-zinc-900 border-white/10 text-white">
                                                <SelectItem value="Disponible">Disponible para oficina</SelectItem>
                                                <SelectItem value="En Terreno">Operando en Terreno</SelectItem>
                                                <SelectItem value="Fuera de turno">Fuera de turno (No asignar)</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                <div className="mt-auto py-6 border-t border-white/5 flex gap-3">
                                    <Button type="button" variant="ghost" className="flex-1 hover:bg-white/5" onClick={() => setIsSheetOpen(false)} disabled={isSubmitting}>Cancelar</Button>
                                    <Button type="submit" className="flex-1 bg-primary hover:bg-primary/90 text-black font-bold uppercase tracking-wider" disabled={isSubmitting}>
                                        {isSubmitting ? "Procesando..." : (editingTech ? "Guardar" : "Incorporar")}
                                    </Button>
                                </div>
                            </form>
                        </>
                    )}
                </SheetContent>
            </Sheet>

            <AlertDialog open={!!techToDelete} onOpenChange={(open) => !open && setTechToDelete(null)}>

                <AlertDialogContent className="bg-zinc-900 border-white/10 text-white">
                    <AlertDialogHeader>
                        <AlertDialogTitle>¿Dar de baja al técnico?</AlertDialogTitle>
                        <AlertDialogDescription className="text-zinc-400">
                            Esta acción eliminará permanentemente la cuenta de <strong>{techToDelete?.name}</strong>. No podrá volver a ingresar al sistema y se perderá su historial de calificación.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel className="bg-transparent border-white/10 hover:bg-white/5">Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className="bg-red-500 hover:bg-red-600">
                            Eliminar Definitivamente
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
