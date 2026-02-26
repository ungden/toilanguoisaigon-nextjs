import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Tag } from '@/types/database';

const fetchAdminTags = async (): Promise<Tag[]> => {
  const { data, error } = await supabase
    .from('tags')
    .select('*')
    .order('name', { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return data || [];
};

export const useAdminTags = () => {
  return useQuery<Tag[], Error>({
    queryKey: ['admin-tags'],
    queryFn: fetchAdminTags,
  });
};
