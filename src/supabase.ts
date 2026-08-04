import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://your-supabase-url.supabase.co';
const SUPABASE_KEY = 'your-supabase-key';
const SUPABASE_SECRET = 'your-supabase-secret';

const supabaseUrl = SUPABASE_URL;
const supabaseKey = SUPABASE_KEY;
const supabaseSecret = SUPABASE_SECRET;

export const supabase = createClient(supabaseUrl, supabaseKey, supabaseSecret);