import { createClient } from '@supabase/supabase-js';

// Force Vite to look at your .env.local keys
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

// This is the most important part: 
// If these logs show 'undefined' in your browser, Vite is not reading your file.
console.log('--- SUPABASE DEBUG ---');
console.log('URL exists:', !!supabaseUrl);
console.log('Key exists:', !!supabaseAnonKey);

export const supabase = createClient(supabaseUrl, supabaseAnonKey);