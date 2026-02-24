// Backward-compatible Supabase client for hooks and components
// Uses a lazy singleton - only created when first accessed at runtime (not build time)
import { createClient } from "@/lib/supabase/client";

let _supabase: ReturnType<typeof createClient> | null = null;

function getClient() {
  if (!_supabase) {
    _supabase = createClient();
  }
  return _supabase;
}

// Proxy object that lazily initializes the Supabase client on first property access
export const supabase = new Proxy({} as ReturnType<typeof createClient>, {
  get(_target, prop) {
    return (getClient() as any)[prop];
  },
});
