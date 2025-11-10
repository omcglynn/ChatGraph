import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

// read env
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

// validate
if (!supabaseUrl) throw new Error("SUPABASE_URL missing in .env");
if (!supabaseKey) throw new Error("SUPABASE_KEY missing in .env");

// ✅ export supabase as a NAMED export
export const supabase = createClient(supabaseUrl, supabaseKey);

// ✅ export createUserClient as NAMED export
export function createUserClient(token) {
  return createClient(
    supabaseUrl,
    supabaseKey,
    {
      global: {
        headers: { Authorization: `Bearer ${token}` }
      }
    }
  );
}
