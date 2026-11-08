import { Note, Ticket, User } from './definitions';
import { createClient as createSupabaseAdmin } from '@supabase/supabase-js';

function getAdmin() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const key = (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)!;
    return createSupabaseAdmin(url, key);
}

// FUNCIONES DE CARGA REAL DESDE SUPABASE (SERVER ONLY)
export async function getTickets(): Promise<Ticket[]> {
    const supabaseAdmin = getAdmin();
    const { data, error } = await supabaseAdmin
        .from('tickets')
        .select('*, services(category)')
        .order('created_at', { ascending: false });
    
    if (error || !data) {
        console.error('Error fetching tickets for metrics:', error);
        return [];
    }
    
    return data.map(t => ({
        ...t,
        category: t.services?.category || 'General',
        createdAt: new Date(t.created_at),
        updatedAt: new Date(t.updated_at),
        dueAt: new Date(t.due_at),
        resolvedAt: t.resolved_at ? new Date(t.resolved_at) : null,
        submitterId: t.creador_id || t.submitter_id,
        assigneeId: t.tecnico_asignado_id || t.assignee_id,
    })) as Ticket[];
}

export async function getUsers(): Promise<User[]> {
    const supabaseAdmin = getAdmin();
    const { data, error } = await supabaseAdmin
        .from('profiles')
        .select('*, companies(name)');
    
    if (error || !data) {
        console.error('Error fetching users for metrics:', error);
        return [];
    }
    
    return data.map(u => ({
        ...u,
        avatarUrl: u.avatar_url || '/avatars/1.png',
        empresa: u.companies?.name || 'Vanguardia',
    })) as User[];
}

export async function getCompanies() {
    const supabaseAdmin = getAdmin();
    const { data, error } = await supabaseAdmin
        .from('companies')
        .select('*');
    
    if (error) return [];
    return data || [];
}

export async function getServices() {
    const supabaseAdmin = getAdmin();
    const { data, error } = await supabaseAdmin
        .from('services')
        .select('*')
        .order('category', { ascending: true });
    
    if (error) return [];
    return data || [];
}

export async function getTicketNotes(ticketId: string): Promise<Note[]> {
    const supabaseAdmin = getAdmin();
    const { data, error } = await supabaseAdmin
        .from('notes')
        .select('*')
        .eq('ticket_id', ticketId)
        .order('created_at', { ascending: true });
    
    if (error) {
        console.error('Error fetching notes:', error);
        return [];
    }
    
    return (data || []).map(n => ({
        ...n,
        ticketId: n.ticket_id,
        authorId: n.author_id,
        createdAt: new Date(n.created_at),
    })) as Note[];
}
