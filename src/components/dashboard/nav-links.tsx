"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    Building2,
    PieChart,
    Ticket,
    Users,
    Wrench,
    Archive,
    BriefcaseBusiness,
} from "lucide-react";
import { SheetClose } from "@/components/ui/sheet";

export function NavLinks({ role, isMobile }: { role?: string, isMobile?: boolean }) {
    const pathname = usePathname();

    const allItems = [
        { section: "Gestión" },
        { name: "Tablero de Control", href: "/dashboard", icon: Ticket },
        { name: "Historial de Tickets", href: "/dashboard/tickets/historial", icon: Archive },
        { section: "Administración" },
        { name: "Clientes y Empresas", href: "/dashboard/clientes", icon: Building2 },
        { name: "Directorio Usuarios", href: "/dashboard/usuarios", icon: Users },
        { name: "Técnicos de Soporte", href: "/dashboard/tecnicos", icon: Wrench },
        { name: "Catálogo de Servicios", href: "/dashboard/servicios", icon: BriefcaseBusiness },
        { divider: true },
        { name: "Métricas y Análisis", href: "/dashboard/dashboards", icon: PieChart }
    ];

    const items = allItems.filter((item) => {
        if (item.section || item.divider) return true;
        if (!role) return false;

        const roleTrimmed = role?.trim();

        if (item.href === "/dashboard/dashboards") {
            return roleTrimmed === 'Administrador Full';
        }
        
        if (item.href === "/dashboard/clientes" || item.href === "/dashboard/tecnicos" || item.href === "/dashboard/servicios") {
            return roleTrimmed === 'Administrador Full';
        }

        if (item.href === "/dashboard/usuarios") {
            return roleTrimmed === 'Administrador Full' || roleTrimmed === 'Administrador Cliente';
        }

        return true;
    }).filter((item, index, arr) => {
        // Remove sections/dividers if they have no items below them
        if (item.section || item.divider) {
            const nextItem = arr[index + 1];
            return nextItem && !nextItem.section && !nextItem.divider;
        }
        return true;
    });

    return (
        <>
            {items.map((item, index) => {
                if (item.section) {
                    return (
                        <div key={index} className="mt-4 mb-2">
                            <span className="text-xs font-semibold text-muted-foreground tracking-wider uppercase px-3">{item.section}</span>
                        </div>
                    )
                }
                if (item.divider) {
                    return <div key={index} className="border-t border-white/5 my-4" />
                }
                
                const Icon = item.icon!;
                const isActive = item.href === "/dashboard" 
                    ? pathname === "/dashboard" 
                    : pathname?.startsWith(item.href!);

                const linkElement = (
                    <Link
                        key={index}
                        href={item.href!}
                        className={`flex items-center gap-3 rounded-lg px-3 py-2.5 transition-all font-medium ${
                            isActive 
                                ? 'bg-primary/20 text-primary border-l-2 border-primary' 
                                : 'text-muted-foreground hover:bg-white/5 hover:text-foreground'
                        }`}
                    >
                        <Icon className="h-5 w-5" />
                        <span>{item.name}</span>
                    </Link>
                );

                if (isMobile) {
                    return (
                        <SheetClose asChild key={index}>
                            {linkElement}
                        </SheetClose>
                    );
                }
                
                return linkElement;
            })}
        </>
    );
}
