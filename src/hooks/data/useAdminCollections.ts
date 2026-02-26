import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Collection } from '@/types/database';

const fetchAdminCollections = async (): Promise<Collection[]> => {
  const { data, error } = await supabase
    .from('collections')
    .select(`
      *,
      collection_categories (
        name
      )
    `)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return data || [];
};

export const useAdminCollections = () => {
  return useQuery<Collection[], Error>({
    queryKey: ['admin-collections'],
    queryFn: fetchAdminCollections,
  });
};