// supabaseAdmin.js - server-side Supabase client (service role)
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY // never expose to client
);

export default supabase;
