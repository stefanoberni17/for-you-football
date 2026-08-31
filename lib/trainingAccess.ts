import { createClient } from '@supabase/supabase-js';

/**
 * Gate dell'area riservata training: profiles.training_access (default FALSE).
 * Attivazione solo manuale via SQL — vedi migration 015.
 */
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder'
);

export async function hasTrainingAccess(userId: string): Promise<boolean> {
  const { data, error } = await supabaseAdmin
    .from('profiles')
    .select('training_access')
    .eq('user_id', userId)
    .maybeSingle();
  if (error) return false;
  return data?.training_access === true;
}
