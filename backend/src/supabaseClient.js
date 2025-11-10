import {createClient} from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);


export function createUserClient(token) {
    return createClient(
        supabaseUrl,
        supabaseKey,
        { global: { headers: { Authorization: `Bearer ${token}` } } }
    );
}

export default supabase;
