-- ==========================================================
-- SCRIPT MAESTRO DE BASE DE DATOS - GESTOR DE REQUERIMIENTOS (ONLINEDESK)
-- Compatible con Supabase PostgreSQL, Realtime & Next.js 15
-- ==========================================================

-- 1. EXTENSIONES NECESARIAS
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- 2. LIMPIEZA TOTAL (Para inicialización limpia)
drop table if exists public.push_subscriptions cascade;
drop table if exists public.notes cascade;
drop table if exists public.tickets cascade;
drop table if exists public.services cascade;
drop table if exists public.profiles cascade;
drop table if exists public.companies cascade;

-- 3. TABLAS DEL SISTEMA

-- 3.1 Empresas (Tenants)
create table public.companies (
    id uuid primary key default uuid_generate_v4(),
    name text not null,
    rut text unique not null,
    plan text default 'Básico',
    status text default 'Activo',
    phone text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3.2 Perfiles Extendidos (Enlazados con auth.users)
create table public.profiles (
    id uuid primary key references auth.users(id) on delete cascade,
    name text not null,
    email text unique not null,
    role text not null check (role in ('Administrador Full', 'Administrador Cliente', 'Técnico', 'Usuario')),
    company_id uuid references public.companies(id) on delete set null,
    specialty text,
    status text default 'Disponible',
    avatar_url text default '/avatars/1.png',
    phone text,
    rating float default 5.0,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3.3 Catálogo de Servicios (ANS / SLA)
-- Nota: id de tipo text para soportar códigos tipo SRV-1001 y UUIDs
create table public.services (
    id text primary key default ('SRV-' || floor(random() * 9000 + 1000)::text),
    name text not null,
    category text not null,
    priority text not null check (priority in ('Baja', 'Media', 'Alta', 'Crítica')),
    sla_hours integer not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3.4 Tickets (Requerimientos Técnicos)
create table public.tickets (
    id uuid primary key default uuid_generate_v4(),
    company_id uuid references public.companies(id) on delete cascade,
    service_id text references public.services(id) on delete cascade not null,
    creador_id uuid references public.profiles(id) on delete cascade not null,
    tecnico_asignado_id uuid references public.profiles(id) on delete set null,
    subject text not null,
    description text not null,
    status text not null default 'Ingresado' check (status in ('Ingresado', 'En proceso', 'Espera de aprobación', 'Terminado')),
    priority text not null default 'Media' check (priority in ('Baja', 'Media', 'Alta', 'Crítica')),
    image_url text,
    due_at timestamp with time zone not null,
    resolved_at timestamp with time zone,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3.5 Notas y Bitácora (Chat en Vivo del Ticket)
create table public.notes (
    id uuid primary key default uuid_generate_v4(),
    ticket_id uuid references public.tickets(id) on delete cascade not null,
    author_id uuid references public.profiles(id) on delete cascade not null,
    content text not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3.6 Suscripciones Web Push PWA
create table public.push_subscriptions (
    id uuid primary key default uuid_generate_v4(),
    user_id uuid references public.profiles(id) on delete cascade not null,
    subscription jsonb not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. ÍNDICES DE RENDIMIENTO
create index if not exists idx_tickets_status on public.tickets(status);
create index if not exists idx_tickets_tecnico on public.tickets(tecnico_asignado_id);
create index if not exists idx_tickets_company on public.tickets(company_id);
create index if not exists idx_notes_ticket on public.notes(ticket_id);
create index if not exists idx_profiles_role on public.profiles(role);

-- 5. TRIGGER: ACTUALIZACIÓN AUTOMÁTICA DE updated_at
create or replace function handle_updated_at()
returns trigger as $$
begin
    new.updated_at = now();
    return new;
end;
$$ language plpgsql;

create trigger set_updated_at
before update on public.tickets
for each row
execute function handle_updated_at();

-- 6. REALTIME (Soporte WebSocket para Chat y Tablero en Vivo)
alter publication supabase_realtime add table public.tickets;
alter publication supabase_realtime add table public.notes;

-- 7. SEGURIDAD RLS (Row Level Security)
alter table public.companies enable row level security;
alter table public.profiles enable row level security;
alter table public.services enable row level security;
alter table public.tickets enable row level security;
alter table public.notes enable row level security;
alter table public.push_subscriptions enable row level security;

-- Políticas permisivas para desarrollo/demostración
create policy "companies_all" on public.companies for all using (true) with check (true);
create policy "profiles_all" on public.profiles for all using (true) with check (true);
create policy "services_all" on public.services for all using (true) with check (true);
create policy "tickets_all" on public.tickets for all using (true) with check (true);
create policy "notes_all" on public.notes for all using (true) with check (true);
create policy "push_subscriptions_all" on public.push_subscriptions for all using (true) with check (true);

-- 8. STORAGE BUCKET (Para fotos y evidencias adjuntas en tickets)
insert into storage.buckets (id, name, public)
values ('tickets', 'tickets', true)
on conflict (id) do update set public = true;

create policy "tickets_storage_select" on storage.objects for select using (bucket_id = 'tickets');
create policy "tickets_storage_insert" on storage.objects for insert with check (bucket_id = 'tickets');
create policy "tickets_storage_update" on storage.objects for update using (bucket_id = 'tickets');
create policy "tickets_storage_delete" on storage.objects for delete using (bucket_id = 'tickets');

-- 9. DATOS SEMILLA (SEED DATA)

-- 9.1 Empresas
insert into public.companies (id, name, rut, plan, status, phone) values
('00000000-0000-0000-0000-000000000001', 'Vanguardia SpA', '76.000.000-1', 'Corporativo', 'Activo', '+56 9 8765 4321'),
('00000000-0000-0000-0000-000000000002', 'TechNova Solutions', '76.123.456-7', 'Premium', 'Activo', '+56 2 2345 6789'),
('00000000-0000-0000-0000-000000000003', 'Logística Express', '99.456.789-0', 'Pro', 'Activo', '+56 9 9876 5432');

-- 9.2 Catálogo de Servicios (ANS)
insert into public.services (id, name, category, priority, sla_hours) values
('SRV-1001', 'Caída Crítica de Sistema / Servidor', 'Hardware', 'Crítica', 4),
('SRV-1002', 'Intermitencia o Caída de Red BGP / Fibra', 'Redes', 'Alta', 8),
('SRV-1003', 'Falla de Software Corporativo / ERP', 'Software', 'Media', 24),
('SRV-1004', 'Recuperación de Accesos o Contraseñas', 'Accesos', 'Baja', 48),
('SRV-1005', 'Incidente de Ciberseguridad / Malware', 'Seguridad', 'Crítica', 2),
('SRV-1006', 'Soporte General & Puestos de Trabajo', 'Otro', 'Baja', 72);

-- 9.3 Usuarios del Sistema (auth.users + auth.identities + public.profiles)
-- Todos los usuarios quedan con la contraseña: Vanguardia_2025!
DO $$
DECLARE
    pwd_hash text := extensions.crypt('Vanguardia_2025!', extensions.gen_salt('bf'));
    company_vanguardia uuid := '00000000-0000-0000-0000-000000000001';
    company_technova uuid := '00000000-0000-0000-0000-000000000002';
    
    uid_admin uuid := '11111111-1111-1111-1111-111111111111';
    uid_tech1 uuid := '22222222-2222-2222-2222-222222222222';
    uid_tech2 uuid := '33333333-3333-3333-3333-333333333333';
    uid_client_admin uuid := '44444444-4444-4444-4444-444444444444';
    uid_user uuid := '55555555-5555-5555-5555-555555555555';
BEGIN
    -- 1. Administrador Full (admin@vanguardia.cl)
    IF EXISTS (SELECT 1 FROM auth.users WHERE email = 'admin@vanguardia.cl') THEN
        UPDATE auth.users SET encrypted_password = pwd_hash, email_confirmed_at = now() WHERE email = 'admin@vanguardia.cl';
    ELSE
        INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, role)
        VALUES (uid_admin, '00000000-0000-0000-0000-000000000000', 'admin@vanguardia.cl', pwd_hash, now(), '{"provider":"email","providers":["email"]}', '{"name":"Ramiro Contreras"}', now(), now(), 'authenticated');
        INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
        VALUES (uuid_generate_v4(), uid_admin, format('{"sub":"%s","email":"%s"}', uid_admin, 'admin@vanguardia.cl')::jsonb, 'email', uid_admin, now(), now(), now());
    END IF;
    INSERT INTO public.profiles (id, name, email, role, company_id, specialty, status, avatar_url, phone, rating)
    VALUES (uid_admin, 'Ramiro Contreras', 'admin@vanguardia.cl', 'Administrador Full', company_vanguardia, 'Sistemas & Gestión TI', 'Disponible', '/avatars/1.png', '+56 9 1111 2222', 5.0)
    ON CONFLICT (id) DO UPDATE SET role = EXCLUDED.role, company_id = EXCLUDED.company_id;

    -- 2. Técnico Redes & Servidores (apaz@vanguardia.cl)
    IF EXISTS (SELECT 1 FROM auth.users WHERE email = 'apaz@vanguardia.cl') THEN
        UPDATE auth.users SET encrypted_password = pwd_hash, email_confirmed_at = now() WHERE email = 'apaz@vanguardia.cl';
    ELSE
        INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, role)
        VALUES (uid_tech1, '00000000-0000-0000-0000-000000000000', 'apaz@vanguardia.cl', pwd_hash, now(), '{"provider":"email","providers":["email"]}', '{"name":"Antonia Paz"}', now(), now(), 'authenticated');
        INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
        VALUES (uuid_generate_v4(), uid_tech1, format('{"sub":"%s","email":"%s"}', uid_tech1, 'apaz@vanguardia.cl')::jsonb, 'email', uid_tech1, now(), now(), now());
    END IF;
    INSERT INTO public.profiles (id, name, email, role, company_id, specialty, status, avatar_url, phone, rating)
    VALUES (uid_tech1, 'Antonia Paz', 'apaz@vanguardia.cl', 'Técnico', company_vanguardia, 'Redes, Conectividad, Hardware', 'Disponible', '/avatars/2.png', '+56 9 2222 3333', 4.9)
    ON CONFLICT (id) DO UPDATE SET role = EXCLUDED.role, specialty = EXCLUDED.specialty;

    -- 3. Técnico Soporte & Software (jramirez@vanguardia.cl)
    IF EXISTS (SELECT 1 FROM auth.users WHERE email = 'jramirez@vanguardia.cl') THEN
        UPDATE auth.users SET encrypted_password = pwd_hash, email_confirmed_at = now() WHERE email = 'jramirez@vanguardia.cl';
    ELSE
        INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, role)
        VALUES (uid_tech2, '00000000-0000-0000-0000-000000000000', 'jramirez@vanguardia.cl', pwd_hash, now(), '{"provider":"email","providers":["email"]}', '{"name":"Jorge Ramírez"}', now(), now(), 'authenticated');
        INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
        VALUES (uuid_generate_v4(), uid_tech2, format('{"sub":"%s","email":"%s"}', uid_tech2, 'jramirez@vanguardia.cl')::jsonb, 'email', uid_tech2, now(), now(), now());
    END IF;
    INSERT INTO public.profiles (id, name, email, role, company_id, specialty, status, avatar_url, phone, rating)
    VALUES (uid_tech2, 'Jorge Ramírez', 'jramirez@vanguardia.cl', 'Técnico', company_vanguardia, 'Software, Accesos, ERP', 'Disponible', '/avatars/3.png', '+56 9 3333 4444', 4.8)
    ON CONFLICT (id) DO UPDATE SET role = EXCLUDED.role, specialty = EXCLUDED.specialty;

    -- 4. Administrador Cliente (carlos@technova.com)
    IF EXISTS (SELECT 1 FROM auth.users WHERE email = 'carlos@technova.com') THEN
        UPDATE auth.users SET encrypted_password = pwd_hash, email_confirmed_at = now() WHERE email = 'carlos@technova.com';
    ELSE
        INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, role)
        VALUES (uid_client_admin, '00000000-0000-0000-0000-000000000000', 'carlos@technova.com', pwd_hash, now(), '{"provider":"email","providers":["email"]}', '{"name":"Carlos TechNova"}', now(), now(), 'authenticated');
        INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
        VALUES (uuid_generate_v4(), uid_client_admin, format('{"sub":"%s","email":"%s"}', uid_client_admin, 'carlos@technova.com')::jsonb, 'email', uid_client_admin, now(), now(), now());
    END IF;
    INSERT INTO public.profiles (id, name, email, role, company_id, specialty, status, avatar_url, phone, rating)
    VALUES (uid_client_admin, 'Carlos TechNova', 'carlos@technova.com', 'Administrador Cliente', company_technova, 'Gerencia de Operaciones', 'Disponible', '/avatars/4.png', '+56 9 4444 5555', 5.0)
    ON CONFLICT (id) DO UPDATE SET role = EXCLUDED.role, company_id = EXCLUDED.company_id;

    -- 5. Usuario Solicitante (cgarrido@alphacorp.cl)
    IF EXISTS (SELECT 1 FROM auth.users WHERE email = 'cgarrido@alphacorp.cl') THEN
        UPDATE auth.users SET encrypted_password = pwd_hash, email_confirmed_at = now() WHERE email = 'cgarrido@alphacorp.cl';
    ELSE
        INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, role)
        VALUES (uid_user, '00000000-0000-0000-0000-000000000000', 'cgarrido@alphacorp.cl', pwd_hash, now(), '{"provider":"email","providers":["email"]}', '{"name":"Claudio Garrido"}', now(), now(), 'authenticated');
        INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
        VALUES (uuid_generate_v4(), uid_user, format('{"sub":"%s","email":"%s"}', uid_user, 'cgarrido@alphacorp.cl')::jsonb, 'email', uid_user, now(), now(), now());
    END IF;
    INSERT INTO public.profiles (id, name, email, role, company_id, specialty, status, avatar_url, phone, rating)
    VALUES (uid_user, 'Claudio Garrido', 'cgarrido@alphacorp.cl', 'Usuario', company_technova, 'Finanzas & Administración', 'Disponible', '/avatars/5.png', '+56 9 5555 6666', null)
    ON CONFLICT (id) DO UPDATE SET role = EXCLUDED.role, company_id = EXCLUDED.company_id;

END $$;

-- 9.4 Tickets Iniciales de Demostración (Uno por cada estado operativo)
DO $$
DECLARE
    company_vanguardia uuid := '00000000-0000-0000-0000-000000000001';
    company_technova uuid := '00000000-0000-0000-0000-000000000002';
    
    uid_admin uuid := '11111111-1111-1111-1111-111111111111';
    uid_tech1 uuid := '22222222-2222-2222-2222-222222222222';
    uid_tech2 uuid := '33333333-3333-3333-3333-333333333333';
    uid_client_admin uuid := '44444444-4444-4444-4444-444444444444';
    uid_user uuid := '55555555-5555-5555-5555-555555555555';
    
    tkt1 uuid := 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
    tkt2 uuid := 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
    tkt3 uuid := 'cccccccc-cccc-cccc-cccc-cccccccccccc';
    tkt4 uuid := 'dddddddd-dddd-dddd-dddd-dddddddddddd';
    tkt5 uuid := 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee';
BEGIN
    -- Ticket 1: Ingresado (Crítico)
    insert into public.tickets (id, company_id, service_id, creador_id, tecnico_asignado_id, subject, description, status, priority, due_at, created_at, updated_at)
    values (tkt1, company_technova, 'SRV-1001', uid_client_admin, uid_tech1, 'Caída de servidor primario de bases de datos', 'El servidor principal de la sucursal norte dejó de responder peticiones SQL tras corte de energía.', 'Ingresado', 'Crítica', now() + interval '4 hours', now() - interval '30 minutes', now() - interval '30 minutes');
    
    insert into public.notes (ticket_id, author_id, content, created_at)
    values (tkt1, uid_client_admin, '[SISTEMA] Requerimiento ingresado con prioridad Crítica (SLA contractual de 4 horas).', now() - interval '30 minutes');

    -- Ticket 2: En proceso (Alta)
    insert into public.tickets (id, company_id, service_id, creador_id, tecnico_asignado_id, subject, description, status, priority, due_at, created_at, updated_at)
    values (tkt2, company_technova, 'SRV-1002', uid_user, uid_tech1, 'Intermitencia de red y pérdida de paquetes en routers BGP', 'Los terminales de ventas sufren desconexiones intermitentes cada 5 minutos hacia la nube.', 'En proceso', 'Alta', now() + interval '8 hours', now() - interval '2 hours', now() - interval '1 hour');
    
    insert into public.notes (ticket_id, author_id, content, created_at) values
    (tkt2, uid_user, 'Reporte inicial de fallas en terminales de facturación.', now() - interval '2 hours'),
    (tkt2, uid_tech1, 'Reconfigurando enlace de contingencia y analizando tabla de rutas.', now() - interval '1 hour');

    -- Ticket 3: Espera de aprobación (Media)
    insert into public.tickets (id, company_id, service_id, creador_id, tecnico_asignado_id, subject, description, status, priority, due_at, created_at, updated_at)
    values (tkt3, company_technova, 'SRV-1003', uid_user, uid_tech2, 'Actualización y corrección de módulo de liquidaciones en ERP', 'Se requiere aplicar hotfix en la versión 4.2 para el cálculo de bonos de producción.', 'Espera de aprobación', 'Media', now() + interval '20 hours', now() - interval '1 day', now() - interval '3 hours');
    
    insert into public.notes (ticket_id, author_id, content, created_at) values
    (tkt3, uid_user, 'Solicitud de actualización enviada por gerencia de contabilidad.', now() - interval '1 day'),
    (tkt3, uid_tech2, 'Parche compilado en ambiente de staging. A la espera de validación formal del cliente.', now() - interval '3 hours');

    -- Ticket 4: Terminado (Baja)
    insert into public.tickets (id, company_id, service_id, creador_id, tecnico_asignado_id, subject, description, status, priority, due_at, resolved_at, created_at, updated_at)
    values (tkt4, company_vanguardia, 'SRV-1004', uid_admin, uid_tech2, 'Restablecimiento de credenciales y doble factor 2FA', 'Usuario olvidó contraseña y renovó su teléfono móvil corporativo.', 'Terminado', 'Baja', now() - interval '2 hours', now() - interval '30 minutes', now() - interval '5 hours', now() - interval '30 minutes');
    
    insert into public.notes (ticket_id, author_id, content, created_at) values
    (tkt4, uid_admin, 'Solicitud de reenvío de token OTP.', now() - interval '5 hours'),
    (tkt4, uid_tech2, 'Credenciales reestablecidas con éxito y validadas con el usuario.', now() - interval '30 minutes'),
    (tkt4, uid_tech2, '[SISTEMA] Ticket cerrado dentro de plazo SLA contractual.', now() - interval '30 minutes');

    -- Ticket 5: En proceso (Soporte General)
    insert into public.tickets (id, company_id, service_id, creador_id, tecnico_asignado_id, subject, description, status, priority, due_at, created_at, updated_at)
    values (tkt5, company_technova, 'SRV-1006', uid_client_admin, uid_tech2, 'Configuración de nuevo equipo para analista contable', 'Instalación de paquete ofimático, VPN corporativa y certificados digitales.', 'En proceso', 'Baja', now() + interval '48 hours', now() - interval '4 hours', now() - interval '2 hours');

END $$;
