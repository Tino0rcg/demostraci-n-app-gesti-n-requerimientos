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
import { getCompaniesAction } from "@/app/actions/companies";
import { useToast } from "@/hooks/use-toast";
import { 
    Users, 
    MoreHorizontal, 
    PlusCircle, 
    Search, 
    Building, 
    Mail,
    Pencil,
    Trash2,
    Eye,
    EyeOff,
    Shield,
    User as UserIcon,
    Calendar,
    Hash, Phone
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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

export default function UsuariosPage() {
    const supabase = useMemo(() => createClient(), []);
    const router = useRouter();
    const { toast } = useToast();
    const [userRole, setUserRole] = useState<string | null>(null);
    const [myCompanyId, setMyCompanyId] = useState<string | null>(null);
    const [usuarios, setUsuarios] = useState<any[]>([]);
    const [empresas, setEmpresas] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [isSheetOpen, setIsSheetOpen] = useState(false);
    const [sheetMode, setSheetMode] = useState<'create' | 'edit' | 'view'>('create');
    const [editingUser, setEditingUser] = useState<any | null>(null);
    const [viewingUser, setViewingUser] = useState<any | null>(null);
    const [userToDelete, setUserToDelete] = useState<any | null>(null);
    const [showPassword, setShowPassword] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        nombre: "",
        email: "",
        empresa: "",
            rol: "Usuario",
        password: "",
        phone: "",
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
                .select('role, company_id')
                .eq('id', user.id)
                .single();

            const role = profile?.role?.trim();
            if (role !== 'Administrador Full' && role !== 'Administrador Cliente') {
                toast({ 
                    title: "Acceso denegado", 
                    description: "No tienes permisos para ver el directorio de usuarios.", 
                    variant: "destructive" 
                });
                router.push("/dashboard");
                return;
            }
            
            setUserRole(role);
            setMyCompanyId(profile?.company_id || null);
            loadData();
        };
        checkRole();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const [usersRes, companiesRes] = await Promise.all([
                getProfilesAction(['Usuario', 'Administrador Cliente', 'Técnico', 'Administrador Full']),
                getCompaniesAction()
            ]);
            
            if (usersRes.success) setUsuarios(usersRes.data);
            if (companiesRes.success) setEmpresas(companiesRes.data);
        } catch (error) {
            console.error("Error loading data:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenCreate = () => {
        setEditingUser(null);
        setFormData({ 
            nombre: "", 
            email: "", 
            empresa: (userRole === 'Administrador Cliente') ? (myCompanyId || "") : "", 
            rol: "Usuario", 
            password: "",
            phone: "" 
        });
        setSheetMode('create');
        setIsSheetOpen(true);
    };

    const handleOpenEdit = (user: any) => {
        setEditingUser(user);
        setFormData({
            nombre: user.name || "",
            email: user.email || "",
            empresa: user.company_id || "interno",
            rol: user.role || "Usuario",
            password: "",
            phone: user.phone || ""
        });
        setSheetMode('edit');
        setIsSheetOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        
        try {
            let result;
            if (editingUser) {
                result = await updateProfileAction(editingUser.id, {
                    name: formData.nombre,
                    role: formData.rol,
                    password: formData.password, // Incluir password si se llenó
                    company_id: formData.empresa === "interno" ? undefined : formData.empresa,
                    avatar_url: `/avatars/1.png`,
                    phone: formData.phone
                });
            } else {
                result = await createProfileAction({
                    name: formData.nombre,
                    email: formData.email,
                    password: formData.password,
                    role: formData.rol,
                    company_id: formData.empresa === "interno" ? undefined : formData.empresa,
                    avatar_url: `/avatars/1.png`,
                    phone: formData.phone
                });
            }

            if (!result.success) {
                toast({
                    title: "Error",
                    description: result.error || "Ocurrió un fallo en la operación.",
                    variant: "destructive",
                });
            } else {
                toast({
                    title: editingUser ? "Usuario actualizado" : "Usuario registrado",
                    description: editingUser ? "Perfil modificado correctamente." : "Se ha creado el acceso para el usuario.",
                });
                
                await loadData();
                setIsSheetOpen(false);
            }
        } catch (error) {
            toast({ title: "Error crítico", description: "Fallo en el servidor.", variant: "destructive" });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async () => {
        if (!userToDelete) return;
        setIsSubmitting(true);
        try {
            const result = await deleteProfileAction(userToDelete.id);
            if (result.success) {
                toast({ title: "Usuario eliminado", description: "Cuenta y perfil removidos permanentemente." });
                await loadData();
            } else {
                toast({ title: "Error", description: result.error, variant: "destructive" });
            }
        } catch (error) {
            toast({ title: "Error", description: "Error de conexión.", variant: "destructive" });
        } finally {
            setIsSubmitting(false);
            setUserToDelete(null);
        }
    };

    const filteredUsuarios = (usuarios || []).filter(u => 
        (u.name || "").toLowerCase().includes(searchTerm.toLowerCase()) || 
        (u.email || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (u.company_name || "").toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="flex flex-col gap-6 relative">
            {/* Overlay de carga estable si no hay datos */}
            {(loading && usuarios.length === 0) && (
                <div className="absolute inset-0 z-50 flex items-center justify-center bg-zinc-950/20 backdrop-blur-sm rounded-xl">
                    <div className="flex flex-col items-center gap-2">
                        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                        <p className="text-xs text-zinc-500 italic">Validando directorio...</p>
                    </div>
                </div>
            )}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white uppercase italic">Gestión de Usuarios</h1>
                    <p className="text-muted-foreground mt-1 text-xs sm:text-sm">
                        Controla el acceso de clientes y administradores a la plataforma.
                    </p>
                </div>
                <Button onClick={handleOpenCreate} className="gap-2 bg-primary hover:bg-primary/90 text-black font-bold w-full sm:w-auto shrink-0 shadow-md">
                    <PlusCircle className="h-4 w-4" />
                    Nuevo Usuario
                </Button>
            </div>

            <Card className="glass-card border-white/5 bg-black/40 overflow-hidden">
                <CardHeader className="p-4 sm:p-6">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
                        <div className="space-y-1">
                            <CardTitle className="text-lg sm:text-xl text-white">Directorio de Accesos</CardTitle>
                            <CardDescription className="text-xs sm:text-sm">Usuarios vinculados a empresas clientes o staff interno.</CardDescription>
                        </div>
                        <div className="relative w-full sm:w-64">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input 
                                placeholder="Nombre, email o empresa..." 
                                className="pl-8 bg-black/20 border-white/10 text-white placeholder:text-zinc-600 w-full"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0">
                    {/* Mobile Card List (< md:) */}
                    <div className="md:hidden space-y-3">
                        {filteredUsuarios.map((user) => (
                            <div key={user.id} className="p-4 rounded-xl border border-white/5 bg-black/40 space-y-3">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <Avatar className="h-10 w-10 border border-primary/20">
                                            <AvatarFallback className="bg-primary/20 text-primary font-bold">
                                                {(user.name || "U").charAt(0).toUpperCase()}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <p className="font-bold text-sm text-white leading-tight">{user.name}</p>
                                            <p className="text-xs text-muted-foreground mt-0.5 truncate max-w-[170px]">{user.email}</p>
                                        </div>
                                    </div>
                                    <DropdownMenu modal={false}>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon" className="hover:text-white h-8 w-8">
                                                <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className="bg-zinc-900 border-white/10 text-white">
                                            <DropdownMenuItem onSelect={() => { setViewingUser(user); setSheetMode('view'); setIsSheetOpen(true); }} className="gap-2 cursor-pointer">
                                                <Eye className="h-4 w-4" /> Ver Perfil
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onSelect={() => handleOpenEdit(user)} className="gap-2 cursor-pointer">
                                                <Pencil className="h-4 w-4" /> Editar
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onSelect={() => setUserToDelete(user)} className="gap-2 cursor-pointer text-red-400 focus:text-red-400 focus:bg-red-400/10">
                                                <Trash2 className="h-4 w-4" /> Eliminar
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>

                                <div className="flex items-center justify-between text-xs pt-2 border-t border-white/5">
                                    <div className="flex items-center gap-1.5 text-zinc-400">
                                        <Building className="h-3.5 w-3.5 text-primary" />
                                        <span>{user.company_name || 'Interno'}</span>
                                    </div>
                                    <Badge variant="outline" className={
                                        user.role === 'Administrador Full' ? 'bg-red-500/10 text-red-400 border-red-500/20 text-[10px]' : 
                                        user.role === 'Administrador Cliente' ? 'bg-purple-500/10 text-purple-400 border-purple-500/20 text-[10px]' : 
                                        user.role === 'Técnico' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20 text-[10px]' : 
                                        'bg-zinc-500/10 text-zinc-400 border-zinc-500/20 text-[10px]'
                                    }>
                                        {user.role}
                                    </Badge>
                                </div>

                                <div className="flex items-center justify-between pt-1">
                                    <Badge variant="outline" className={
                                        user.status === 'Disponible' ? 'bg-green-500/20 text-green-400 border-green-500/30 text-[10px]' : 
                                        'bg-zinc-500/20 text-zinc-400 border-zinc-500/30 text-[10px]'
                                    }>
                                        {user.status || 'Disponible'}
                                    </Badge>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => { setViewingUser(user); setSheetMode('view'); setIsSheetOpen(true); }}
                                        className="h-7 text-xs border-white/10 hover:bg-white/10"
                                    >
                                        Ver Ficha
                                    </Button>
                                </div>
                            </div>
                        ))}
                        {filteredUsuarios.length === 0 && (
                            <div className="p-8 text-center text-zinc-500 text-xs border border-dashed border-white/10 rounded-xl">
                                No se encontraron usuarios registrados.
                            </div>
                        )}
                    </div>

                    {/* Desktop Table View (md+) */}
                    <div className="hidden md:block">
                        <Table>
                            <TableHeader className="bg-white/5">
                            <TableRow className="border-white/10 hover:bg-transparent">
                                <TableHead className="text-zinc-400">Usuario</TableHead>
                                <TableHead className="text-zinc-400">Organización</TableHead>
                                <TableHead className="text-zinc-400">Rol</TableHead>
                                <TableHead className="text-zinc-400">Estado</TableHead>
                                <TableHead className="text-right text-zinc-400">Acciones</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredUsuarios.map((user) => (
                                <TableRow key={user.id} className="border-white/5 hover:bg-white/5 transition-colors">
                                    <TableCell className="font-medium flex items-center gap-3 py-4">
                                        <Avatar className="h-10 w-10 border border-primary/20">
                                            <AvatarFallback className="bg-primary/10 text-primary uppercase font-bold">
                                                {(user.name || "U").charAt(0)}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="flex flex-col">
                                            <span className="text-sm font-semibold text-white leading-tight">{user.name}</span>
                                            <span className="text-[10px] text-zinc-500 flex items-center gap-1 mt-1 font-mono">
                                                <Mail className="h-3 w-3" /> {user.email}
                                            </span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2 text-zinc-300 text-sm">
                                            <Building className="h-3.5 w-3.5 text-muted-foreground" />
                                            {user.company_name || <span className="text-zinc-600 italic">Vanguardia Staff</span>}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className={
                                            user.role === 'Administrador Full' ? 'bg-red-500/10 text-red-400 border-red-500/20' : 
                                            user.role === 'Técnico' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                                            user.role === 'Administrador Cliente' ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' :
                                            'bg-zinc-800 text-zinc-400 border-zinc-700'
                                        }>
                                            {user.role}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <div className="h-1.5 w-1.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]"></div>
                                            <span className="text-[10px] text-zinc-300 uppercase tracking-widest font-bold">Activo</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <DropdownMenu modal={false}>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="hover:bg-white/10 h-8 w-8">
                                                    <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" className="bg-zinc-900 border-white/10 text-white">
                                                <DropdownMenuLabel>Gestión</DropdownMenuLabel>
                                                <DropdownMenuSeparator className="bg-white/5" />
                                                <DropdownMenuItem 
                                                    className="gap-2 cursor-pointer" 
                                                    onSelect={() => {
                                                        setViewingUser(user);
                                                        setSheetMode('view');
                                                        setIsSheetOpen(true);
                                                    }}
                                                >
                                                    <Eye className="h-4 w-4" /> Ver Perfil
                                                </DropdownMenuItem>
                                                <DropdownMenuItem 
                                                    className="gap-2 cursor-pointer" 
                                                    onSelect={() => {
                                                        handleOpenEdit(user);
                                                    }}
                                                >
                                                    <Pencil className="h-4 w-4" /> Editar
                                                </DropdownMenuItem>
                                                <DropdownMenuItem 
                                                    className="gap-2 cursor-pointer text-red-400 focus:text-red-400 focus:bg-red-400/10" 
                                                    onSelect={() => {
                                                        setUserToDelete(user);
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
                    </div>
                </CardContent>
            </Card>

            <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
                <SheetContent className="glass-panel border-l-primary/20 flex flex-col sm:max-w-md w-full p-0">
                    {sheetMode === 'view' ? (
                        <>
                            <div className="p-6">
                                <SheetHeader>
                                    <SheetTitle className="flex items-center gap-2 text-white">
                                        <UserIcon className="h-5 w-5 text-primary" />
                                        Perfil de Usuario
                                    </SheetTitle>
                                    <SheetDescription>
                                        Detalle de cuenta y permisos del sistema.
                                    </SheetDescription>
                                </SheetHeader>
                            </div>

                            {viewingUser && (
                                <div className="mt-2 space-y-6 flex-1 overflow-y-auto px-6 custom-scrollbar pb-8">
                                    <div className="flex flex-col items-center justify-center p-6 bg-white/5 rounded-2xl border border-white/10 mb-6 relative overflow-hidden">
                                        <div className="absolute top-0 right-0 p-4 opacity-5">
                                            <Shield className="h-24 w-24" />
                                        </div>
                                        <Avatar className="h-20 w-20 border-2 border-primary/20 mb-4">
                                            <AvatarFallback className="bg-primary/10 text-primary text-2xl font-bold uppercase">
                                                {(viewingUser.name || "U").charAt(0)}
                                            </AvatarFallback>
                                        </Avatar>
                                        <h3 className="text-xl font-bold text-white tracking-tight">{viewingUser.name}</h3>
                                        <Badge variant="outline" className="mt-2 bg-primary/20 text-primary border-primary/30 uppercase text-[10px] tracking-widest font-bold px-3">
                                            {viewingUser.role}
                                        </Badge>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="grid grid-cols-1 gap-3">
                                            <div className="p-4 bg-white/5 rounded-xl border border-white/5 space-y-1">
                                                <div className="flex items-center gap-2 text-zinc-500 text-[10px] font-bold uppercase tracking-widest">
                                                    <Mail className="h-3 w-3" /> Correo Electrónico
                                                </div>
                                                <p className="text-white text-sm break-all font-mono">{viewingUser.email}</p>
                                            </div>

                                            <div className="p-4 bg-white/5 rounded-xl border border-white/5 space-y-1">
                                                <div className="flex items-center gap-2 text-zinc-500 text-[10px] font-bold uppercase tracking-widest">
                                                    <Phone className="h-3 w-3" /> Teléfono
                                                </div>
                                                <p className="text-white text-sm break-all font-mono">{viewingUser.phone || "No registrado"}</p>
                                            </div>

                                            <div className="p-4 bg-white/5 rounded-xl border border-white/5 space-y-1">
                                                <div className="flex items-center gap-2 text-zinc-500 text-[10px] font-bold uppercase tracking-widest">
                                                    <Building className="h-3 w-3" /> Organización
                                                </div>
                                                <p className="text-white text-sm">
                                                    {viewingUser.company_name || "Staff Interno (Vanguardia)"}
                                                </p>
                                            </div>

                                            <div className="p-4 bg-white/5 rounded-xl border border-white/5 space-y-1">
                                                <div className="flex items-center gap-2 text-zinc-500 text-[10px] font-bold uppercase tracking-widest">
                                                    <Hash className="h-3 w-3" /> ID Único de Sistema
                                                </div>
                                                <p className="text-[10px] text-zinc-400 font-mono italic break-all leading-tight">
                                                    {viewingUser.id}
                                                </p>
                                            </div>

                                            <div className="p-4 bg-white/5 rounded-xl border border-white/5 space-y-1">
                                                <div className="flex items-center gap-2 text-zinc-500 text-[10px] font-bold uppercase tracking-widest">
                                                    <Calendar className="h-3 w-3" /> Fecha de Registro
                                                </div>
                                                <p className="text-white text-sm">
                                                    {viewingUser.created_at ? new Date(viewingUser.created_at).toLocaleDateString('es-CL', { 
                                                        day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
                                                    }) : 'Fecha no disponible'}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <Separator className="bg-white/5" />

                                    <div className="space-y-4">
                                        <h4 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Estadísticas de Usuario</h4>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="p-4 bg-white/5 rounded-xl border border-white/5 text-center">
                                                <p className="text-2xl font-bold text-white">0</p>
                                                <p className="text-[9px] text-zinc-500 uppercase font-bold">Tickets Creados</p>
                                            </div>
                                            <div className="p-4 bg-white/5 rounded-xl border border-white/5 text-center">
                                                <p className="text-xs font-semibold text-green-400">Activo</p>
                                                <p className="text-[9px] text-zinc-500 uppercase font-bold">Estado Actual</p>
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
                                    <SheetTitle className="text-2xl font-bold text-white leading-none">
                                        {editingUser ? "Editar Usuario" : "Crear Nuevo Acceso"}
                                    </SheetTitle>
                                    <SheetDescription className="text-zinc-500 mt-2">
                                        {editingUser ? "Actualiza los privilegios y datos del perfil." : "Habilita el acceso para un nuevo colaborador o cliente."}
                                    </SheetDescription>
                                </SheetHeader>
                            </div>
                            
                            <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden px-6" autoComplete="off">
                                <div className="space-y-5 flex-1 overflow-y-auto pr-2 custom-scrollbar pb-8">
                                    <div className="space-y-2">
                                        <Label className="text-zinc-400 text-xs">Nombre Completo</Label>
                                        <Input 
                                            required 
                                            placeholder="Ej: Roberto Contreras" 
                                            value={formData.nombre} 
                                            onChange={e => setFormData({...formData, nombre: e.target.value})} 
                                            className="bg-white/5 border-white/10 focus:border-primary/50" 
                                            autoComplete="off"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-zinc-400 text-xs">Correo Electrónico</Label>
                                        <Input 
                                            required 
                                            type="email" 
                                            placeholder="usuario@dominio.cl" 
                                            value={formData.email} 
                                            onChange={e => setFormData({...formData, email: e.target.value})} 
                                            className="bg-white/5 border-white/10" 
                                            disabled={!!editingUser} 
                                            autoComplete="off"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-zinc-400 text-xs">Teléfono de Contacto (Opcional)</Label>
                                        <Input 
                                            placeholder="+56 9 1234 5678" 
                                            value={formData.phone} 
                                            onChange={e => setFormData({...formData, phone: e.target.value})} 
                                            className="bg-white/5 border-white/10" 
                                            autoComplete="off"
                                        />
                                    </div>
                                    {(!editingUser || userRole === 'Administrador Full') && (
                                        <div className="space-y-2">
                                            <Label className="text-zinc-400 text-xs text-primary">
                                                {editingUser ? "Nueva Contraseña (Opcional)" : "Contraseña Temporal"}
                                            </Label>
                                            <div className="relative">
                                                <Input 
                                                    required={!editingUser}
                                                    type={showPassword ? "text" : "password"} 
                                                    placeholder={editingUser ? "Dejar vacío para mantener actual" : "••••••••"} 
                                                    value={formData.password} 
                                                    onChange={e => setFormData({...formData, password: e.target.value})} 
                                                    className="bg-white/5 border-primary/20 focus:border-primary/50 pr-10" 
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
                                            {editingUser && (
                                                <p className="text-[10px] text-zinc-500 italic">Sólo visible para Administrador Full.</p>
                                            )}
                                        </div>
                                    )}
                                    
                                    <div className="space-y-2">
                                        <Label className="text-zinc-400 text-xs">Empresa Cliente / Staff</Label>
                                        <Select value={formData.empresa} onValueChange={(v) => setFormData({...formData, empresa: v})}>
                                            <SelectTrigger className="bg-white/5 border-white/10">
                                                <SelectValue placeholder="Seleccionar empresa..." />
                                            </SelectTrigger>
                                            <SelectContent className="bg-zinc-900 border-white/10 text-white">
                                                <SelectItem value="interno" disabled={userRole === 'Administrador Cliente'}>
                                                    Sin empresa (Interno)
                                                </SelectItem>
                                                {empresas.map(emp => (
                                                    <SelectItem 
                                                        key={emp.id} 
                                                        value={emp.id}
                                                        disabled={(userRole === 'Administrador Cliente') && emp.id !== myCompanyId}
                                                    >
                                                        {emp.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-2">
                                        <Label className="text-zinc-400 text-xs text-primary">Rol en Plataforma</Label>
                                        <Select value={formData.rol} onValueChange={(v) => setFormData({...formData, rol: v})}>
                                            <SelectTrigger className="bg-white/5 border-primary/20">
                                                <SelectValue placeholder="Rol de acceso..." />
                                            </SelectTrigger>
                                            <SelectContent className="bg-zinc-900 border-white/10 text-white">
                                                <SelectItem value="Usuario">Cliente Externo (Usuario)</SelectItem>
                                                <SelectItem value="Administrador Cliente">Administrador de Empresa (Cliente)</SelectItem>
                                                <SelectItem value="Técnico">Técnico / Soporte (Especialista)</SelectItem>
                                                <SelectItem value="Administrador Full">Administrador Global (Mesa Ayuda)</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                <div className="py-6 mt-auto border-t border-white/5 flex gap-3">
                                    <Button type="button" variant="ghost" className="flex-1 hover:bg-white/5" onClick={() => setIsSheetOpen(false)} disabled={isSubmitting}>
                                        Cancelar
                                    </Button>
                                    <Button type="submit" className="flex-1 bg-primary hover:bg-primary/90 text-black font-bold uppercase tracking-wider" disabled={isSubmitting}>
                                        {isSubmitting ? "Procesando..." : (editingUser ? "Guardar" : "Crear Acceso")}
                                    </Button>
                                </div>
                            </form>
                        </>
                    )}
                </SheetContent>
            </Sheet>

            <AlertDialog open={!!userToDelete} onOpenChange={(open) => !open && setUserToDelete(null)}>

                <AlertDialogContent className="bg-zinc-900 border-white/10 text-white shadow-2xl">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-white text-xl uppercase font-bold tracking-tight">¿Revocar acceso permanentemente?</AlertDialogTitle>
                        <AlertDialogDescription className="text-zinc-400 mt-2">
                            Se eliminará la cuenta de <strong>{userToDelete?.name}</strong>. Esta persona ya no podrá iniciar sesión y perderá todos sus privilegios de inmediato.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="mt-6">
                        <AlertDialogCancel className="bg-transparent border-white/10 hover:bg-white/5 text-white">Mantenert Usuario</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className="bg-red-500 hover:bg-red-600 text-white font-bold">
                            Eliminar Definitivamente
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
