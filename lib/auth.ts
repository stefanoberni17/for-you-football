import { createClient } from '@supabase/supabase-js';
import { NextRequest } from 'next/server';

/**
 * Verifica l'autenticazione dell'utente da una API route.
 * Legge il token JWT dall'header Authorization o dai cookie Supabase.
 * Ritorna l'userId se autenticato, null altrimenti.
 */
export async function getAuthUser(request: NextRequest): Promise<string | null> {
  try {
    // Prova prima l'header Authorization (per chiamate con Bearer token)
    const authHeader = request.headers.get('authorization');
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL || '',
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
      );
      const { data: { user }, error } = await supabase.auth.getUser(token);
      if (!error && user) return user.id;
    }

    // Fallback: leggi il token dal cookie Supabase
    const cookies = request.cookies;
    // Supabase SSR salva il token in cookie con pattern sb-<project-ref>-auth-token
    // Il formato può variare, cerchiamo qualsiasi cookie che contiene il token
    const allCookies = cookies.getAll();

    for (const cookie of allCookies) {
      if (cookie.name.includes('auth-token') || cookie.name.includes('access-token')) {
        try {
          // Il cookie potrebbe contenere JSON con access_token
          const parsed = JSON.parse(cookie.value);
          const token = parsed?.access_token || parsed?.[0]?.access_token;
          if (token) {
            const supabase = createClient(
              process.env.NEXT_PUBLIC_SUPABASE_URL || '',
              process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
            );
            const { data: { user }, error } = await supabase.auth.getUser(token);
            if (!error && user) return user.id;
          }
        } catch {
          // Cookie non è JSON, prova come token diretto
          const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL || '',
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
          );
          const { data: { user }, error } = await supabase.auth.getUser(cookie.value);
          if (!error && user) return user.id;
        }
      }
    }

    return null;
  } catch {
    return null;
  }
}
