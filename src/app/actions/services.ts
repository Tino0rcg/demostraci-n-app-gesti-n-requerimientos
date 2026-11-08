"use server";

import { createAdminClient } from '@/lib/supabase/admin';

export async function createServiceAction(data: { 
  name: string; 
  category: string; 
  priority: string; 
  sla_hours: number 
}) {
  try {
    const supabaseAdmin = createAdminClient();
    
    // Check if service already exists by name
    const { data: existing } = await supabaseAdmin
      .from('services')
      .select('id')
      .eq('name', data.name)
      .single();

    if (existing) {
      return { success: false, error: "Ya existe un servicio con este nombre." };
    }

    // Generate a simple ID
    const serviceId = `SRV-${Math.floor(1000 + Math.random() * 9000)}`;

    const { error } = await supabaseAdmin.from('services').insert([
      { ...data, id: serviceId }
    ]);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Error desconocido al crear servicio." };
  }
}

export async function getServicesAction() {
  try {
    const supabaseAdmin = createAdminClient();
    const { data, error } = await supabaseAdmin.from('services').select('*').order('created_at', { ascending: false });
    
    if (error) return { success: false, data: [] };
    return { success: true, data };
  } catch (error) {
    return { success: false, data: [] };
  }
}

export async function updateServiceAction(id: string, data: { 
  name: string; 
  category: string; 
  priority: string; 
  sla_hours: number 
}) {
  try {
    const supabaseAdmin = createAdminClient();
    const { error } = await supabaseAdmin
      .from('services')
      .update(data)
      .eq('id', id);

    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function deleteServiceAction(id: string) {
  try {
    const supabaseAdmin = createAdminClient();
    const { error } = await supabaseAdmin
      .from('services')
      .delete()
      .eq('id', id);

    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

