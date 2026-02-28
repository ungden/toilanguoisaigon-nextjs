import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../integrations/supabase/client';
import { Collection } from '../../types/database';

/**
 * Fetch manual (curated) collections.
 */
export const useCollections = () => {
  return useQuery<Collection[], Error>({
    queryKey: ['collections', 'manual'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('collections')
        .select('*, location_count:collection_locations(count)')
        .eq('source', 'manual')
        .order('created_at', { ascending: false });

      if (error) throw new Error(error.message);
      return data || [];
    },
  });
};

/**
 * Fetch AI-generated collections (published only).
 */
export const useAICollections = (limit = 12) => {
  return useQuery<Collection[], Error>({
    queryKey: ['collections', 'ai', limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('collections')
        .select('*, location_count:collection_locations(count)')
        .eq('source', 'ai')
        .eq('status', 'published')
        .order('generated_date', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw new Error(error.message);
      return data || [];
    },
  });
};
