import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkPhone() {
    console.log("Checking profiles table...");
    const { data: pData, error: pError } = await supabase.from('profiles').select('phone').limit(1);
    if (pError) console.error("Profiles error:", pError.message);
    else console.log("Profiles phone:", pData);

    console.log("Checking companies table...");
    const { data: cData, error: cError } = await supabase.from('companies').select('phone').limit(1);
    if (cError) console.error("Companies error:", cError.message);
    else console.log("Companies phone:", cData);
}

checkPhone();
