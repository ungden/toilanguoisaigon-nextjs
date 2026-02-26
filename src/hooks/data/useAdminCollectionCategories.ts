import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { CollectionCategory } from '@/types/database';

const fetchAdminCollectionCategories = async (): Promise<CollectionCategory[]> => {
  const { data, error } = await supabase
    .from('collection_categories')
    .select('*')
    .order('name', { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return data || [];
};

export const useAdminCollectionCategories = () => {
  return useQuery<CollectionCategory[], Error>({
    queryKey: ['admin-collection-categories'],
    queryFn: fetchAdminCollectionCategories,
  });
};
