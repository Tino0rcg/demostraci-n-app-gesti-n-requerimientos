"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import { DEMO_ADMIN, DEMO_USERS_MAP } from "@/lib/session";

export async function login(formData: FormData) {
  const email = (formData.get("email") as string || "").trim().toLowerCase();
  const password = formData.get("password") as string;

  const cookieStore = await cookies();

  // 1. Intento nativo con Supabase Auth
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (!error && data?.user) {
      cookieStore.delete("onlinedesk_session");
      revalidatePath("/", "layout");
      redirect("/dashboard");
    }
  } catch (err: any) {
    if (err?.digest?.startsWith?.('NEXT_REDIRECT') || err?.message === 'NEXT_REDIRECT') {
      throw err;
    }
  }

  // 2. Fast-Path de Demostración (acceso instantáneo garantizado para evaluadores y portafolio)
  const matchedUser = DEMO_USERS_MAP[email];
  if (matchedUser) {
    cookieStore.set("onlinedesk_session", JSON.stringify(matchedUser), {
      path: "/",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7 // 7 días
    });
    revalidatePath("/", "layout");
    redirect("/dashboard?tour=true&step=1");
  }

  // 3. Fallback adicional si el usuario escribe admin o demo
  if (email.includes("admin") || email.includes("demo") || email.includes("vanguardia")) {
    cookieStore.set("onlinedesk_session", JSON.stringify(DEMO_ADMIN), {
      path: "/",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7
    });
    revalidatePath("/", "layout");
    redirect("/dashboard?tour=true&step=1");
  }

  return { error: "El correo o la contraseña son incorrectos." };
}

export async function directDemoLogin(roleKey: string = "admin") {
  const cookieStore = await cookies();
  const user = roleKey === "admin" ? DEMO_ADMIN : (DEMO_USERS_MAP[roleKey] || DEMO_ADMIN);
  cookieStore.set("onlinedesk_session", JSON.stringify(user), {
    path: "/",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7
  });
  revalidatePath("/", "layout");
  redirect("/dashboard?tour=true&step=1");
}

export async function signOut() {
  const cookieStore = await cookies();
  cookieStore.delete("onlinedesk_session");
  try {
    const supabase = await createClient();
    await supabase.auth.signOut();
  } catch {}
  redirect("/login");
}
