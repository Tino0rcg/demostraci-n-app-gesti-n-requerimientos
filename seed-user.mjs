import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://gukpqraixiqlmrdaaavh.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd1a3BxcmFpeGlxbG1yZGFhYXZoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MjQyNjc0NywiZXhwIjoyMDk4MDAyNzQ3fQ.AikUlPaVM101TNBE3VfvY5bdNumOZV48Z1unRcUtkKM';

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function run() {
  try {
    console.log("Limpiando usuario corrupto (si existe)...");
    const { data: usersData, error: listError } = await supabase.auth.admin.listUsers();
    if (listError) throw listError;
    
    const oldUser = usersData.users.find(u => u.email === 'admin@vanguardia.cl');
    if (oldUser) {
      await supabase.auth.admin.deleteUser(oldUser.id);
      console.log("Usuario antiguo eliminado.");
    }

    console.log("Creando usuario nuevo de forma oficial...");
    const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
      email: 'admin@vanguardia.cl',
      password: 'Admin_Vanguardia_2025!',
      email_confirm: true,
      user_metadata: { name: 'Administrador Maestro' }
    });

    if (createError) throw createError;

    const userId = newUser.user.id;
    console.log("Usuario creado con éxito. ID:", userId);

    console.log("Asociando perfil de Administrador...");
    const companyId = '00000000-0000-0000-0000-000000000001';
    
    const { error: profileError } = await supabase
      .from('profiles')
      .upsert({
        id: userId,
        name: 'Administrador Maestro',
        email: 'admin@vanguardia.cl',
        role: 'Administrador Full',
        company_id: companyId,
        status: 'Disponible'
      });

    if (profileError) throw profileError;

    console.log("===================================");
    console.log("¡ÉXITO! Usuario y perfil creados correctamente.");
    console.log("===================================");
  } catch (err) {
    console.error("Error durante el proceso:", err);
  }
}

run();
