"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { 
    createCompanyAction, 
    getCompaniesAction, 
    updateCompanyAction, 
    deleteCompanyAction 
} from "@/app/actions/companies";
import { useToast } from "@/hooks/use-toast";
import { 
    Building2, 
    MoreHorizontal, 
    PlusCircle, 
    Search,
    Pencil,
    Trash2,
    Eye,
    Globe,
    Calendar,
    Shield, Phone
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
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

export default function ClientesPage() {
    const supabase = useMemo(() => createClient(), []);
    const router = useRouter();
    const { toast } = useToast();
    const [userRole, setUserRole] = useState<string | null>(null);
    const [empresas, setEmpresas] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [isSheetOpen, setIsSheetOpen] = useState(false);
    const [sheetMode, setSheetMode] = useState<'create' | 'edit' | 'view'>('create');
    const [editingCompany, setEditingCompany] = useState<any | null>(null);
    const [viewingCompany, setViewingCompany] = useState<any | null>(null);
    const [companyToDelete, setCompanyToDelete] = useState<any | null>(null);

    // Form State
    const [formData, setFormData] = useState({
        nombre: "",
        rut: "",
        plan: "Pro",
        status: "Activo",
        phone: "",
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
            loadCompanies();
        };
        checkRole();
    }, []);

    const loadCompanies = async () => {
        setLoading(true);
        const result = await getCompaniesAction();
        if (result.success && result.data) {
            setEmpresas(result.data);
        }
        setLoading(false);
    };

    const handleOpenCreate = () => {
        setEditingCompany(null);
        setFormData({ nombre: "", rut: "", plan: "Pro", status: "Activo", phone: "" });
        setSheetMode('create');
        setIsSheetOpen(true);
    };

    const handleOpenEdit = (company: any) => {
        setEditingCompany(company);
        setFormData({
            nombre: company.name,
            rut: company.rut,
            plan: company.plan,
            status: company.status,
            phone: company.phone || ""
        });
        setSheetMode('edit');
        setIsSheetOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        
        try {
            let result;
            if (editingCompany) {
                result = await updateCompanyAction(editingCompany.id, {
                    name: formData.nombre,
                    rut: formData.rut,
                    plan: formData.plan,
                    status: formData.status,
                    phone: formData.phone
                });
            } else {
                result = await createCompanyAction({
                    name: formData.nombre,
                    rut: formData.rut,
                    plan: formData.plan,
                    status: formData.status,
                    phone: formData.phone
                });
            }

            if (!result.success) {
                toast({
                    title: "Error",
                    description: result.error || "Ocurrió un problema con la operación.",
                    variant: "destructive",
                });
            } else {
                toast({
                    title: editingCompany ? "Empresa actualizada" : "Empresa habilitada",
                    description: editingCompany ? "Los cambios han sido guardados." : "La organización ha sido registrada exitosamente.",
                });
                
                await loadCompanies();
                setIsSheetOpen(false);
            }
        } catch (err: any) {
             toast({
                 title: "Error crítico",
                 description: "Ocurrió un error en el servidor.",
                 variant: "destructive",
             });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async () => {
        if (!companyToDelete) return;
        setIsSubmitting(true);
        try {
            const result = await deleteCompanyAction(companyToDelete.id);
            if (result.success) {
                toast({ title: "Empresa eliminada", description: "El registro ha sido borrado físicamente." });
                await loadCompanies();
            } else {
                toast({ title: "Error al borrar", description: result.error, variant: "destructive" });
            }
        } catch (error) {
            toast({ title: "Error", description: "No se pudo completar la operación.", variant: "destructive" });
        } finally {
            setIsSubmitting(false);
            setCompanyToDelete(null);
        }
    };

    const filteredEmpresas = (empresas || []).filter(emp => 
        (emp.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (emp.rut || "").toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="flex flex-col gap-6 relative">
            {/* Overlay de carga estable */}
            {(loading && empresas.length === 0) && (
                <div className="absolute inset-0 z-50 flex items-center justify-center bg-zinc-950/20 backdrop-blur-sm rounded-xl">
                    <div className="flex flex-col items-center gap-2">
                        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                        <p className="text-xs text-zinc-500 italic">Cargando directorio de empresas...</p>
                    </div>
                </div>
            )}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">Clientes y Empresas</h1>
                    <p className="text-muted-foreground mt-1 text-xs sm:text-sm">
                        Gestiona las organizaciones y sus privilegios de acceso.
                    </p>
                </div>
                <Button onClick={handleOpenCreate} className="gap-2 bg-primary hover:bg-primary/90 w-full sm:w-auto shrink-0 shadow-md">
                    <PlusCircle className="h-4 w-4" />
                    Nueva Empresa
                </Button>
            </div>

            <Card className="glass-card border-white/5 overflow-hidden">
                <CardHeader className="p-4 sm:p-6">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
                        <div className="space-y-1">
                            <CardTitle className="text-lg sm:text-xl text-white">Listado de Empresas</CardTitle>
                            <CardDescription className="text-xs sm:text-sm">Empresas habilitadas para utilizar la plataforma.</CardDescription>
                        </div>
                        <div className="relative w-full sm:w-64">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input 
                                placeholder="Buscar empresa o RUT..." 
                                className="pl-8 bg-black/20 border-white/10 w-full" 
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0">
                    {/* Mobile Card List (< md:) */}
                    <div className="md:hidden space-y-3">
                        {filteredEmpresas.map((empresa) => (
                            <div key={empresa.id} className="p-4 rounded-xl border border-white/5 bg-black/40 space-y-3">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-primary/10 rounded-lg border border-primary/20 shrink-0">
                                            <Building2 className="h-5 w-5 text-primary" />
                                        </div>
                                        <div>
                                            <p className="font-bold text-sm text-white leading-tight">{empresa.name}</p>
                                            <p className="text-xs text-zinc-400 font-mono mt-0.5">{empresa.rut}</p>
                                        </div>
                                    </div>
                                    <DropdownMenu modal={false}>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon" className="hover:text-white h-8 w-8">
                                                <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className="bg-zinc-900 border-white/10 text-white">
                                            <DropdownMenuItem onSelect={() => { setViewingCompany(empresa); setSheetMode('view'); setIsSheetOpen(true); }} className="gap-2 cursor-pointer">
                                                <Eye className="h-4 w-4" /> Ver Perfil
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onSelect={() => handleOpenEdit(empresa)} className="gap-2 cursor-pointer">
                                                <Pencil className="h-4 w-4" /> Editar
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onSelect={() => setCompanyToDelete(empresa)} className="gap-2 cursor-pointer text-red-400 focus:text-red-400 focus:bg-red-400/10">
                                                <Trash2 className="h-4 w-4" /> Eliminar
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>

                                <div className="flex items-center justify-between text-xs pt-2 border-t border-white/5">
                                    <Badge variant="outline" className="bg-white/5 border-white/10 text-zinc-300 text-[10px]">
                                        Plan: {empresa.plan || 'Básico'}
                                    </Badge>
                                    <Badge variant="outline" className={
                                        empresa.status === 'Activo' ? 'bg-green-500/10 text-green-400 border-green-500/20 text-[10px]' : 
                                        'bg-zinc-500/10 text-zinc-400 border-zinc-500/20 text-[10px]'
                                    }>
                                        {empresa.status || 'Activo'}
                                    </Badge>
                                </div>

                                <div className="flex items-center justify-between pt-1">
                                    <span className="text-[11px] text-zinc-500">
                                        {empresa.user_count || 1} usuario(s) vinculados
                                    </span>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => { setViewingCompany(empresa); setSheetMode('view'); setIsSheetOpen(true); }}
                                        className="h-7 text-xs border-white/10 hover:bg-white/10"
                                    >
                                        Ver Ficha
                                    </Button>
                                </div>
                            </div>
                        ))}
                        {filteredEmpresas.length === 0 && (
                            <div className="p-8 text-center text-zinc-500 text-xs border border-dashed border-white/10 rounded-xl">
                                No se encontraron empresas registradas.
                            </div>
                        )}
                    </div>

                    {/* Desktop Table View (md+) */}
                    <div className="hidden md:block">
                        <Table>
                            <TableHeader className="bg-white/5">
                            <TableRow className="hover:bg-transparent border-white/10">
                                <TableHead className="text-zinc-400">Nombre de Empresa</TableHead>
                                <TableHead className="text-zinc-400">RUT / ID</TableHead>
                                <TableHead className="text-zinc-400">Plan</TableHead>
                                <TableHead className="text-zinc-400">Usuarios</TableHead>
                                <TableHead className="text-zinc-400">Estado</TableHead>
                                <TableHead className="text-right text-zinc-400">Acciones</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredEmpresas.map((empresa) => (
                                <TableRow key={empresa.id} className="border-white/5 hover:bg-white/5">
                                    <TableCell className="font-medium flex items-center gap-3 py-4 text-zinc-100">
                                        <div className="p-2 bg-primary/10 rounded-lg border border-primary/20">
                                            <Building2 className="h-4 w-4 text-primary" />
                                        </div>
                                        {empresa.name}
                                    </TableCell>
                                    <TableCell className="text-zinc-400 font-mono text-xs">{empresa.rut}</TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className="bg-white/5 border-white/10 text-zinc-300">
                                            {empresa.plan}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-zinc-300">0 activos</TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className={
                                            empresa.status === 'Activo' ? 'bg-green-500/20 text-green-400 border-green-500/20' : ''
                                        }>
                                            {empresa.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <DropdownMenu modal={false}>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="hover:bg-white/10">
                                                    <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" className="bg-zinc-900 border-white/10 text-white">
                                                <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                                                <DropdownMenuSeparator className="bg-white/5" />
                                                <DropdownMenuItem 
                                                    className="gap-2 cursor-pointer" 
                                                    onSelect={() => {
                                                        setViewingCompany(empresa);
                                                        setSheetMode('view');
                                                        setIsSheetOpen(true);
                                                    }}
                                                >
                                                    <Eye className="h-4 w-4" /> Ver Perfil
                                                </DropdownMenuItem>
                                                <DropdownMenuItem 
                                                    className="gap-2 cursor-pointer" 
                                                    onSelect={() => {
                                                        handleOpenEdit(empresa);
                                                    }}
                                                >
                                                    <Pencil className="h-4 w-4" /> Editar
                                                </DropdownMenuItem>
                                                <DropdownMenuItem 
                                                    className="gap-2 cursor-pointer text-red-400 focus:text-red-400 focus:bg-red-400/10" 
                                                    onSelect={() => {
                                                        setCompanyToDelete(empresa);
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
                                        <Building2 className="h-5 w-5 text-primary" />
                                        Detalles de la Empresa
                                    </SheetTitle>
                                    <SheetDescription>
                                        Vista de solo lectura del perfil corporativo.
                                    </SheetDescription>
                                </SheetHeader>
                            </div>

                            {viewingCompany && (
                                <div className="mt-2 space-y-6 flex-1 overflow-y-auto px-6 custom-scrollbar pb-8">
                                    <div className="flex flex-col items-center justify-center p-6 bg-white/5 rounded-xl border border-white/10 mb-6 relative overflow-hidden">
                                        <div className="p-4 bg-primary/10 rounded-full border border-primary/20 mb-3">
                                            <Building2 className="h-10 w-10 text-primary" />
                                        </div>
                                        <h3 className="text-xl font-bold text-white">{viewingCompany.name}</h3>
                                        <Badge className="mt-2 bg-primary/20 text-primary border-primary/30 uppercase text-[10px] tracking-widest font-bold px-3">
                                            Organización Verificada
                                        </Badge>
                                    </div>

                                    <div className="grid grid-cols-1 gap-4">
                                        <div className="p-4 bg-white/5 rounded-lg border border-white/5 space-y-1">
                                            <div className="flex items-center gap-2 text-zinc-500 text-xs font-semibold uppercase tracking-wider">
                                                <Globe className="h-3 w-3" /> Identificador Fiscal (RUT)
                                            </div>
                                            <p className="text-white font-mono">{viewingCompany.rut}</p>
                                        </div>

                                        <div className="p-4 bg-white/5 rounded-lg border border-white/5 space-y-1">
                                            <div className="flex items-center gap-2 text-zinc-500 text-xs font-semibold uppercase tracking-wider">
                                                <Phone className="h-3 w-3" /> Teléfono
                                            </div>
                                            <p className="text-white font-mono">{viewingCompany.phone || 'No registrado'}</p>
                                        </div>

                                        <div className="p-4 bg-white/5 rounded-lg border border-white/5 space-y-1">
                                            <div className="flex items-center gap-2 text-zinc-500 text-xs font-semibold uppercase tracking-wider">
                                                <Shield className="h-3 w-3" /> Nivel de Suscripción
                                            </div>
                                            <Badge variant="outline" className="mt-1 bg-white/5 border-white/10 text-zinc-300">
                                                Plan {viewingCompany.plan}
                                            </Badge>
                                        </div>

                                        <div className="p-4 bg-white/5 rounded-lg border border-white/5 space-y-1">
                                            <div className="flex items-center gap-2 text-zinc-500 text-xs font-semibold uppercase tracking-wider">
                                                <Building2 className="h-3 w-3" /> Estado del Servicio
                                            </div>
                                            <Badge variant="outline" className={viewingCompany.status === 'Activo' ? 'bg-green-500/10 text-green-400 border-green-500/20' : ''}>
                                                {viewingCompany.status}
                                            </Badge>
                                        </div>

                                        <div className="p-4 bg-white/5 rounded-lg border border-white/5 space-y-1">
                                            <div className="flex items-center gap-2 text-zinc-500 text-xs font-semibold uppercase tracking-wider">
                                                <Calendar className="h-3 w-3" /> Registrada el
                                            </div>
                                            <p className="text-white text-sm">
                                                {new Date(viewingCompany.created_at).toLocaleDateString('es-CL', { 
                                                    day: '2-digit', 
                                                    month: 'long', 
                                                    year: 'numeric' 
                                                })}
                                            </p>
                                        </div>
                                    </div>

                                    <Separator className="bg-white/5" />

                                    <div className="space-y-4">
                                        <h4 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Información Adicional</h4>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="text-center p-3 bg-white/5 rounded-lg border border-white/5">
                                                <p className="text-2xl font-bold text-white">0</p>
                                                <p className="text-[9px] text-zinc-500 uppercase font-bold">Usuarios</p>
                                            </div>
                                            <div className="text-center p-3 bg-white/5 rounded-lg border border-white/5">
                                                <p className="text-2xl font-bold text-white">0</p>
                                                <p className="text-[9px] text-zinc-500 uppercase font-bold">Tickets</p>
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
                                    <SheetTitle className="text-white">{editingCompany ? "Editar Empresa" : "Registrar Empresa"}</SheetTitle>
                                    <SheetDescription>
                                        {editingCompany ? "Modifica los datos de la organización." : "Al registrar una empresa, se habilita automáticamente el acceso para sus colaboradores."}
                                    </SheetDescription>
                                </SheetHeader>
                            </div>
                            
                            <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden px-6 mt-2">
                                <div className="space-y-4 flex-1 overflow-y-auto pr-2 custom-scrollbar pb-6">
                                    <div className="space-y-2">
                                        <Label className="text-zinc-400 text-xs">Nombre de la Organización</Label>
                                        <Input 
                                            required 
                                            placeholder="Ej: Corporación Delta S.A." 
                                            value={formData.nombre} 
                                            onChange={e => setFormData({...formData, nombre: e.target.value})} 
                                            className="bg-white/5 border-white/10" 
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label className="text-zinc-400 text-xs">RUT / Identificador Fiscal</Label>
                                        <Input 
                                            required 
                                            placeholder="76.xxx.xxx-x" 
                                            value={formData.rut} 
                                            onChange={e => setFormData({...formData, rut: e.target.value})} 
                                            className="bg-white/5 border-white/10" 
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label className="text-zinc-400 text-xs">Teléfono de Contacto (Opcional)</Label>
                                        <Input 
                                            placeholder="+56 9 1234 5678" 
                                            value={formData.phone} 
                                            onChange={e => setFormData({...formData, phone: e.target.value})} 
                                            className="bg-white/5 border-white/10" 
                                        />
                                    </div>
                                    
                                    <div className="space-y-2">
                                        <Label className="text-zinc-400 text-xs">Plan de Servicio</Label>
                                        <Select value={formData.plan} onValueChange={(v) => setFormData({...formData, plan: v})}>
                                            <SelectTrigger className="bg-white/5 border-white/10">
                                                <SelectValue placeholder="Seleccionar plan..." />
                                            </SelectTrigger>
                                            <SelectContent className="bg-zinc-900 border-white/10 text-white">
                                                <SelectItem value="Básico">Plan Básico</SelectItem>
                                                <SelectItem value="Pro">Plan Pro (Estándar)</SelectItem>
                                                <SelectItem value="Premium">Plan Premium (Full SLA)</SelectItem>
                                                <SelectItem value="Corporativo">Plan Corporativo</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-2">
                                        <Label className="text-zinc-400 text-xs">Estado</Label>
                                        <Select value={formData.status} onValueChange={(v) => setFormData({...formData, status: v})}>
                                            <SelectTrigger className="bg-white/5 border-white/10">
                                                <SelectValue placeholder="Estado..." />
                                            </SelectTrigger>
                                            <SelectContent className="bg-zinc-900 border-white/10 text-white">
                                                <SelectItem value="Activo">Activo (Habilitado)</SelectItem>
                                                <SelectItem value="Inactivo">Inactivo (Suspendido)</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                <div className="mt-auto py-6 border-t border-white/5 flex gap-3">
                                    <Button type="button" variant="ghost" className="flex-1 hover:bg-white/5" onClick={() => setIsSheetOpen(false)} disabled={isSubmitting}>Cancelar</Button>
                                    <Button type="submit" className="flex-1 bg-primary hover:bg-primary/90 text-black font-bold uppercase tracking-wider" disabled={isSubmitting}>
                                        {isSubmitting ? "Procesando..." : (editingCompany ? "Guardar" : "Habilitar")}
                                    </Button>
                                </div>
                            </form>
                        </>
                    )}
                </SheetContent>
            </Sheet>

            <AlertDialog open={!!companyToDelete} onOpenChange={(open) => !open && setCompanyToDelete(null)}>

                <AlertDialogContent className="bg-zinc-900 border-white/10 text-white">
                    <AlertDialogHeader>
                        <AlertDialogTitle>¿Está absolutamente seguro?</AlertDialogTitle>
                        <AlertDialogDescription className="text-zinc-400">
                            Esta acción eliminará permanentemente la empresa <strong>{companyToDelete?.name}</strong> y todos sus datos asociados del servidor.
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
