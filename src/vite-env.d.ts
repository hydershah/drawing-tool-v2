/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_PROJECT_ID: string;
  readonly VITE_SUPABASE_ANON_KEY: string;
  readonly VITE_ADMIN_PASSWORD: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
