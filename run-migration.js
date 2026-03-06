import { createClient } from '@supabase/supabase-js';

// Read environment variables
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runMigration() {
  try {
    console.log('Running migration to add service fields...');
    
    const { error } = await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE public.services 
        ADD COLUMN IF NOT EXISTS imei_number TEXT,
        ADD COLUMN IF NOT EXISTS hsn_code TEXT DEFAULT '9987',
        ADD COLUMN IF NOT EXISTS taxable_amount NUMERIC,
        ADD COLUMN IF NOT EXISTS gst_amount NUMERIC,
        ADD COLUMN IF NOT EXISTS amount_in_words TEXT;
      `
    });

    if (error) {
      console.error('Migration failed:', error);
    } else {
      console.log('Migration completed successfully!');
    }
  } catch (err) {
    console.error('Error running migration:', err);
  }
}

runMigration();
