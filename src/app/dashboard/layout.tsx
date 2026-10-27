import Link from "next/link";
import {
    Building2,
    Home,
    LineChart,
    PieChart,
    BarChart,
    PanelLeft,
    PlusCircle,
    Search,
    Settings,
    Ticket,
    Users,
    Wrench,
    Archive,
    BriefcaseBusiness,
} from "lucide-react";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";


import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetClose } from "@/components/ui/sheet";
import { Logo } from "@/components/logo";
import { UserNav } from "@/components/user-nav";
import { NavLinks } from "@/components/dashboard/nav-links";
import { BottomNav } from "@/components/dashboard/bottom-nav";
import { createClient as createSupabaseAdmin } from "@supabase/supabase-js";

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    let userProfile = null;
    let companyName = "Desconocida";
    
    if (user) {
        const supabaseAdmin = createSupabaseAdmin(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        const { data: profile } = await supabaseAdmin
            .from('profiles')
            .select(`*, companies(name)`)
            .eq('id', user.id)
            .single();
            
        userProfile = profile;
        if (profile?.companies && profile?.role?.trim() !== 'Administrador Full') {
            companyName = Array.isArray(profile.companies) ? profile.companies[0]?.name : profile.companies.name;
        }
    }

    const userData = {
        name: userProfile?.name || 'Usuario',
        email: userProfile?.email || user?.email || '',
        role: userProfile?.role || 'Usuario',
        empresa: companyName || 'Desconocida',
        avatarUrl: userProfile?.avatar_url || ''
    };

    return (
        <div className="flex min-h-screen w-full flex-col bg-muted/40">
            <aside className="fixed inset-y-0 left-0 z-10 hidden w-60 flex-col border-r border-white/10 glass-panel sm:flex">
                <div className="flex px-6 py-4 items-center justify-center">
                    <Image 
                        src="https://github.com/Tino0rcg/imagenes-pagina-online-2.0/blob/main/LOGO%20ONLINE%20SYSTEM%20NORMAL.png?raw=true" 
                        alt="Online System Logo" 
                        width={140} 
                        height={80}
                        className="object-contain"
                    />
                </div>
                
                <nav className="flex-1 overflow-y-auto flex flex-col gap-2 px-4 mt-4 pb-4 custom-scrollbar">
                    {/* Botón para crear requerimiento */}
                    <Link
                        href="/dashboard/tickets/new"
                        className="flex items-center justify-center gap-3 rounded-lg bg-primary text-primary-foreground px-3 py-2.5 transition-colors hover:bg-primary/90 font-bold mb-4 shadow-lg shadow-primary/20"
                    >
                        <PlusCircle className="h-5 w-5" />
                        <span>Nuevo Ticket</span>
                    </Link>

                    <NavLinks role={userData.role} />
                </nav>


            </aside>
            <div className="flex flex-col sm:gap-4 sm:py-4 sm:pl-60">
                <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-white/5 glass-panel px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
                    <Sheet>
                        <SheetTrigger asChild>
                            <Button size="icon" variant="outline" className="sm:hidden">
                                <PanelLeft className="h-5 w-5" />
                                <span className="sr-only">Toggle Menu</span>
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="left" className="sm:max-w-xs">
                            <SheetTitle className="sr-only">Menú de Navegación</SheetTitle>
                            <nav className="grid gap-6 text-lg font-medium">
                                <Link
                                    href="#"
                                    className="group flex h-10 w-10 shrink-0 items-center justify-center gap-2 rounded-full bg-primary text-lg font-semibold text-primary-foreground md:text-base"
                                >
                                    <Ticket className="h-5 w-5 transition-all group-hover:scale-110" />
                                    <span className="sr-only">OnlineDesk</span>
                                </Link>
                                <SheetClose asChild>
                                    <Link
                                        href="/dashboard/tickets/new"
                                        className="flex items-center gap-4 px-2.5 text-primary"
                                    >
                                        <PlusCircle className="h-5 w-5" />
                                        Nuevo Requerimiento
                                    </Link>
                                </SheetClose>
                                <div className="flex flex-col gap-2 mt-4">
                                    <NavLinks role={userData.role} isMobile={true} />
                                </div>
                            </nav>
                        </SheetContent>
                    </Sheet>
                    <div className="relative ml-auto flex-1 md:grow-0">
                        <Logo />
                    </div>
                    <div className="relative ml-auto flex-1 md:grow-0">
                    </div>
                    <UserNav user={userData} />
                </header>
                <main className="flex flex-col flex-1 w-full min-w-0 gap-4 p-4 sm:px-6 sm:py-0 md:gap-8 bottom-nav-safe sm:pb-8">
                    {children}
                </main>
                <BottomNav role={userData.role} />
            </div>
        </div>
    );
}
