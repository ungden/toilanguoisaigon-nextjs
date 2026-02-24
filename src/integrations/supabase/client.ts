// Backward-compatible Supabase client for hooks and components
// All hooks import `supabase` from this file
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export const supabase = getSupabaseBrowserClient();
