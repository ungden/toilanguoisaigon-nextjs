import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Category } from '@/types/database';

const fetchAdminCategories = async (): Promise<Category[]> => {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('name', { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return data || [];
};

export const useAdminCategories = () => {
  return useQuery<Category[], Error>({
    queryKey: ['admin-categories'],
    queryFn: fetchAdminCategories,
  });
};
