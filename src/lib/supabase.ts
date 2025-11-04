import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  const missing = [];
  if (!supabaseUrl) missing.push('NEXT_PUBLIC_SUPABASE_URL');
  if (!supabaseAnonKey) missing.push('NEXT_PUBLIC_SUPABASE_ANON_KEY');
  
  // In development, log helpful error message
  if (typeof window === 'undefined') {
    console.error('❌ Missing Supabase environment variables:', missing.join(', '));
    console.error('📝 Please check your .env.local file exists in the project root');
    console.error('🔄 Make sure to restart the dev server after creating/updating .env.local');
    console.error('📂 Current working directory:', process.cwd());
  }
  
  throw new Error(
    `Missing Supabase environment variables: ${missing.join(', ')}. ` +
    `Please check your .env.local file and restart the dev server.`
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false, // No authentication needed
  },
});

