import type { SupabaseClient } from '@supabase/supabase-js';

/** Cliente sin tipos generados: las tablas se validan en las migraciones. */
export type DB = SupabaseClient;
