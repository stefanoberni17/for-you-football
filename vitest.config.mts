import { defineConfig } from 'vitest/config';

// Test sui moduli puri (lib/): niente rete, niente Supabase, niente Claude.
// Le variabili sotto servono solo perché alcuni moduli creano i client all'import.
export default defineConfig({
  resolve: { alias: { '@': import.meta.dirname } },
  test: {
    include: ['tests/**/*.test.ts'],
    environment: 'node',
    env: {
      NEXT_PUBLIC_SUPABASE_URL: 'https://placeholder.supabase.co',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: 'placeholder',
      SUPABASE_SERVICE_ROLE_KEY: 'placeholder',
      ANTHROPIC_API_KEY: 'placeholder',
    },
  },
});
