"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Ticket } from "@/lib/definitions";
import { useToast } from "@/hooks/use-toast";

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { 
    Select, 
    SelectContent, 
    SelectItem, 
    SelectTrigger, 
    SelectValue,
    SelectGroup,
    SelectLabel
} from "@/components/ui/select";
import { ChevronLeft, Save, Sparkles, Clock, ImagePlus, X, ImageIcon, ShieldCheck, Timer } from "lucide-react";
import { uploadImageAction } from "@/app/actions/tickets";
import Link from "next/link";
import { getServiceResponseSla } from "@/lib/sla-utils";

import { getServicesAction } from "@/app/actions/services";

import { createTicketAction } from "@/app/actions/tickets";

export default function NewTicketPage() {
    const router = useRouter();
    const supabase = createClient();
    const { toast } = useToast();
    const [submitting, setSubmitting] = useState(false);
    const [services, setServices] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Estado para Imagen
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);

    const [formData, setFormData] = useState({
        serviceId: "",
        description: "",
    });

    useEffect(() => {
        const loadServices = async () => {
            const result = await getServicesAction();
            if (result.success && result.data) {
                setServices(result.data);
                if (result.data.length > 0) setFormData(prev => ({ ...prev, serviceId: result.data[0].id }));
            }
            setLoading(false);
        };
        loadServices();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);

        try {
            const { data: userData } = await supabase.auth.getUser();
            const submitterId = userData.user?.id || "11111111-1111-1111-1111-111111111111";

            const service = services.find(s => s.id === formData.serviceId);
            if (!service) throw new Error("Servicio no válido");

            let uploadedImageUrl = undefined;

            // 1. Subir imagen si existe
            if (imageFile) {
                const uploadFormData = new FormData();
                uploadFormData.append('file', imageFile);
                const uploadResult = await uploadImageAction(uploadFormData);
                
                if (uploadResult.success) {
                    uploadedImageUrl = uploadResult.url;
                } else {
                    toast({ 
                        title: "Advertencia", 
                        description: `No se pudo subir la imagen (${uploadResult.error}). Se creará el ticket sin ella.`, 
                        variant: "destructive" 
                    });
                }
            }

            // 2. Crear Ticket
            const now = new Date();
            const dueAt = new Date(now.getTime() + service.sla_hours * 60 * 60 * 1000);

            const result = await createTicketAction({
                subject: service.name,
                description: formData.description,
                priority: service.priority,
                category: service.category,
                service_id: service.id,
                submitter_id: submitterId,
                due_at: dueAt.toISOString(),
                image_url: uploadedImageUrl
            });

            if (result.success) {
                toast({ title: "Ticket creado", description: "Tu requerimiento ha sido ingresado correctamente." });
                router.push("/dashboard");
                router.refresh();
            } else {
                toast({ title: "Error", description: result.error, variant: "destructive" });
                setSubmitting(false);
            }
        } catch (error: any) {
            console.error("Error al crear ticket:", error);
            toast({ title: "Error", description: error.message || "No se pudo crear el ticket", variant: "destructive" });
            setSubmitting(false);
        }
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setImageFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const removeImage = () => {
        setImageFile(null);
        setImagePreview(null);
    };

    const currentService = services.find(s => s.id === formData.serviceId);

    if (loading) return <div className="p-8 text-center text-zinc-500 italic">Cargando catálogo de servicios...</div>;

    return (
        <div className="flex flex-col gap-6 max-w-4xl mx-auto w-full pb-8">
            <div className="flex items-center gap-4">
                <Button variant="outline" size="icon" asChild className="h-9 w-9 glass-card border-white/10">
                    <Link href="/dashboard">
                        <ChevronLeft className="h-4 w-4" />
                    </Link>
                </Button>
                <div>
                    <h1 className="text-2xl sm:text-3xl font-black tracking-tighter text-white uppercase italic">Nuevo Requerimiento</h1>
                    <p className="text-zinc-500 text-xs sm:text-sm font-medium">Completa los datos técnicos para ingresar una nueva solicitud bajo SLA.</p>
                </div>
            </div>

            <form onSubmit={handleSubmit}>
                <Card className="glass-card border-white/10 bg-black/40 backdrop-blur-md overflow-hidden">
                    <div className="h-1 w-full bg-gradient-to-r from-primary/50 via-primary to-primary/50" />
                    <CardHeader>
                        <CardTitle className="text-white flex items-center gap-2">
                            <Sparkles className="h-5 w-5 text-primary" />
                            Configuración del Ticket
                        </CardTitle>
                        <CardDescription className="text-zinc-400">
                            El SLA de resolución será asignado automáticamente basado en el catálogo de servicios de su contrato.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-2">
                            <Label className="text-zinc-300 font-bold">Servicio Afectado (Catálogo Contractual)</Label>
                            <Select value={formData.serviceId} onValueChange={(v) => setFormData({...formData, serviceId: v})}>
                                <SelectTrigger className="bg-black/40 border-white/10 text-white h-11">
                                    <SelectValue placeholder="Selecciona el servicio afectado..." />
                                </SelectTrigger>
                                <SelectContent className="bg-zinc-900 border-white/10 text-white max-h-[350px]">
                                    {Array.from(new Set(services.map(s => s.category))).map(cat => (
                                        <SelectGroup key={cat}>
                                            <SelectLabel className="text-primary font-black uppercase text-[10px] tracking-widest px-2 py-1.5 bg-white/5 rounded my-1">
                                                {cat}
                                            </SelectLabel>
                                            {services.filter(s => s.category === cat).map(svc => (
                                                <SelectItem key={svc.id} value={svc.id} className="text-xs sm:text-sm pl-4">
                                                    {svc.name}
                                                </SelectItem>
                                            ))}
                                        </SelectGroup>
                                    ))}
                                </SelectContent>
                            </Select>
                            
                            {currentService && (
                                <div className="mt-4 p-4 rounded-xl bg-primary/5 border border-primary/20 flex flex-col gap-3">
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-primary/10 pb-3">
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs font-black uppercase tracking-widest text-primary">Nivel de Criticidad {currentService.priority}</span>
                                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-white font-mono font-bold">{currentService.category}</span>
                                        </div>
                                        <div className="flex items-center gap-4 text-xs font-bold">
                                            <div className="flex items-center gap-1.5 text-cyan-400">
                                                <Timer className="h-3.5 w-3.5" />
                                                <span>Respuesta: {getServiceResponseSla(currentService.name)}</span>
                                            </div>
                                            <div className="flex items-center gap-1.5 text-primary">
                                                <Clock className="h-3.5 w-3.5" />
                                                <span>Resolución: {currentService.sla_hours} h máx.</span>
                                            </div>
                                        </div>
                                    </div>
                                    <p className="text-[11px] text-zinc-400 leading-relaxed italic">
                                        El tiempo de primera atención y diagnóstico técnico tiene como objetivo máximo <strong className="text-white not-italic">{getServiceResponseSla(currentService.name)}</strong>. 
                                        El plazo de resolución técnica definitiva bajo ANS es de <strong className="text-white not-italic">{currentService.sla_hours} horas hábiles</strong>.
                                    </p>
                                </div>
                            )}
                        </div>

                        <div className="space-y-4">
                            <Label className="text-zinc-300 font-bold block">Adjuntar Evidencia (Foto o Captura)</Label>
                            
                            {!imagePreview ? (
                                <div className="relative">
                                    <input 
                                        type="file" 
                                        accept="image/*" 
                                        onChange={handleImageChange}
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                    />
                                    <div className="border-2 border-dashed border-white/10 rounded-xl p-6 sm:p-8 flex flex-col items-center justify-center gap-3 bg-white/5 hover:bg-white/10 transition-all group">
                                        <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                                            <ImagePlus className="h-6 w-6 text-primary" />
                                        </div>
                                        <div className="text-center">
                                            <p className="text-sm font-bold text-white">Toca o arrastra una imagen o captura</p>
                                            <p className="text-xs text-zinc-500 mt-1 uppercase tracking-widest font-mono">PNG, JPG hasta 5MB (Cámara o Galería)</p>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="relative rounded-xl overflow-hidden border border-white/10 aspect-video group bg-black/40">
                                    <img 
                                        src={imagePreview} 
                                        alt="Preview" 
                                        className="w-full h-full object-contain"
                                    />
                                    <Button 
                                        type="button"
                                        variant="destructive" 
                                        size="sm" 
                                        onClick={removeImage}
                                        className="absolute top-3 right-3 font-bold uppercase tracking-tighter shadow-lg min-h-[36px] z-20"
                                    >
                                        <X className="w-4 h-4 mr-1 sm:mr-2" /> Eliminar
                                    </Button>
                                    <div className="absolute bottom-2 left-2 bg-black/80 backdrop-blur-md px-2 py-1 rounded text-[10px] text-white flex items-center gap-1 border border-white/10 uppercase font-bold tracking-widest">
                                        <ImageIcon className="w-3 h-3 text-primary" />
                                        Vista Previa Seleccionada
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="description" className="text-zinc-300 font-bold">Descripción Detallada <span className="text-primary italic">*</span></Label>
                            <Textarea 
                                id="description" 
                                required 
                                placeholder="Describe el problema, pasos para reproducirlo, equipo afectado, etc..." 
                                className="min-h-[120px] bg-black/40 border-white/10 text-white focus:border-primary/50 transition-all resize-none p-4"
                                value={formData.description}
                                onChange={(e) => setFormData({...formData, description: e.target.value})}
                            />
                        </div>
                    </CardContent>
                    <CardFooter className="flex flex-col-reverse sm:flex-row gap-3 sm:justify-between border-t border-white/5 pt-6 bg-white/5">
                        <Button variant="ghost" asChild className="w-full sm:w-auto min-h-[44px] text-zinc-400 hover:text-white hover:bg-white/5">
                            <Link href="/dashboard">Cancelar</Link>
                        </Button>
                        <Button type="submit" disabled={submitting} className="w-full sm:min-w-[180px] min-h-[44px] bg-primary hover:bg-primary/90 text-black font-black uppercase italic tracking-tighter shadow-[0_0_20px_rgba(59,130,246,0.2)]">
                            {submitting ? (
                                <div className="flex items-center gap-2">
                                    <div className="h-4 w-4 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                                    Procesando...
                                </div>
                            ) : (
                                <>
                                    <Save className="w-4 h-4 mr-2" /> Ingresar Ticket
                                </>
                            )}
                        </Button>
                    </CardFooter>
                </Card>
            </form>
        </div>
    );
}
