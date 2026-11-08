"use server";

import { createAdminClient } from '@/lib/supabase/admin';

export async function createCompanyAction(data: { name: string; rut: string; plan: string; status: string; phone?: string }) {
  try {
    const supabaseAdmin = createAdminClient();
    
    // Check if company already exists
    const { data: existing } = await supabaseAdmin
      .from('companies')
      .select('id')
      .eq('rut', data.rut)
      .single();

    if (existing) {
      return { success: false, error: "Ya existe una empresa con este RUT." };
    }

    const { error } = await supabaseAdmin.from('companies').insert([data]);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Error desconocido al crear empresa." };
  }
}

export async function getCompaniesAction() {
  try {
    const supabaseAdmin = createAdminClient();
    const { data, error } = await supabaseAdmin.from('companies').select('*');
    
    if (error) {
      return { success: false, data: [] };
    }
    return { success: true, data };
  } catch (error) {
    return { success: false, data: [] };
  }
}

export async function updateCompanyAction(id: string, data: { name: string; rut: string; plan: string; status: string; phone?: string }) {
  try {
    const supabaseAdmin = createAdminClient();
    const { error } = await supabaseAdmin
      .from('companies')
      .update(data)
      .eq('id', id);

    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function deleteCompanyAction(id: string) {
  try {
    const supabaseAdmin = createAdminClient();
    
    // Check if there are profiles or tickets? 
    // Usually standard cascaded delete if DB configured, but we'll try direct delete.
    const { error } = await supabaseAdmin
      .from('companies')
      .delete()
      .eq('id', id);

    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}


