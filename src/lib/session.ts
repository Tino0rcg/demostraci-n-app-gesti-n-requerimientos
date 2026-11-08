import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  role: string;
  empresa: string;
  avatarUrl: string;
}

export const DEMO_ADMIN: SessionUser = {
  id: "11111111-1111-1111-1111-111111111111",
  name: "Ramiro Contreras",
  email: "admin@vanguardia.cl",
  role: "Administrador Full",
  empresa: "Vanguardia SpA",
  avatarUrl: "/avatars/1.png"
};

export const DEMO_USERS_MAP: Record<string, SessionUser> = {
  "admin@vanguardia.cl": DEMO_ADMIN,
  "apaz@vanguardia.cl": {
    id: "22222222-2222-2222-2222-222222222222",
    name: "Antonia Paz",
    email: "apaz@vanguardia.cl",
    role: "Técnico",
    empresa: "Vanguardia SpA",
    avatarUrl: "/avatars/2.png"
  },
  "jramirez@vanguardia.cl": {
    id: "33333333-3333-3333-3333-333333333333",
    name: "Jorge Ramírez",
    email: "jramirez@vanguardia.cl",
    role: "Técnico",
    empresa: "Vanguardia SpA",
    avatarUrl: "/avatars/3.png"
  },
  "carlos@technova.com": {
    id: "44444444-4444-4444-4444-444444444444",
    name: "Carlos TechNova",
    email: "carlos@technova.com",
    role: "Administrador Cliente",
    empresa: "TechNova Solutions",
    avatarUrl: "/avatars/4.png"
  },
  "cgarrido@alphacorp.cl": {
    id: "55555555-5555-5555-5555-555555555555",
    name: "Claudio Garrido",
    email: "cgarrido@alphacorp.cl",
    role: "Usuario",
    empresa: "TechNova Solutions",
    avatarUrl: "/avatars/5.png"
  },
  "admin": DEMO_ADMIN,
  "tecnico": {
    id: "22222222-2222-2222-2222-222222222222",
    name: "Antonia Paz",
    email: "apaz@vanguardia.cl",
    role: "Técnico",
    empresa: "Vanguardia SpA",
    avatarUrl: "/avatars/2.png"
  },
  "cliente": {
    id: "44444444-4444-4444-4444-444444444444",
    name: "Carlos TechNova",
    email: "carlos@technova.com",
    role: "Administrador Cliente",
    empresa: "TechNova Solutions",
    avatarUrl: "/avatars/4.png"
  }
};

export async function getCurrentUserSession(): Promise<SessionUser> {
  // 1. Fast-path: Verificar si existe cookie de sesión de alta disponibilidad
  try {
    const cookieStore = await cookies();
    const raw = cookieStore.get("onlinedesk_session")?.value;
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        if (parsed && parsed.email) {
          return parsed;
        }
      } catch {}
    }

    // 2. Si no hay cookies de sesión ni tokens de Supabase, retornar DEMO_ADMIN de inmediato sin llamadas de red
    const allCookies = cookieStore.getAll();
    const hasAuthCookie = allCookies.some(c => c.name.startsWith("sb-") || c.name.includes("auth-token"));
    if (!hasAuthCookie) {
      return DEMO_ADMIN;
    }
  } catch {
    return DEMO_ADMIN;
  }

  // 3. Solo si hay cookies de Supabase Auth, verificar con Supabase de forma protegida
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      const supabaseAdmin = createAdminClient();

      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select(`*, companies(name)`)
        .eq('id', user.id)
        .single();

      let companyName = "Desconocida";
      if (profile?.companies && profile?.role?.trim() !== 'Administrador Full') {
        companyName = Array.isArray(profile.companies) ? profile.companies[0]?.name : profile.companies.name;
      }

      return {
        id: user.id,
        name: profile?.name || user.email?.split("@")[0] || 'Usuario',
        email: profile?.email || user.email || '',
        role: profile?.role || 'Administrador Full',
        empresa: companyName || 'Vanguardia SpA',
        avatarUrl: profile?.avatar_url || '/avatars/1.png'
      };
    }
  } catch (e) {
    // Continuar a fallback de sesión
  }

  // 4. Fallback final garantizado de Portafolio
  return DEMO_ADMIN;
}
