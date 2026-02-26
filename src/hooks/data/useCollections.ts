import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../integrations/supabase/client';
import { Collection } from '../../types/database';

const fetchCollections = async (): Promise<Collection[]> => {
  const { data, error } = await supabase
    .from('collections')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(20);

  if (error) {
    throw new Error(error.message);
  }

  return data || [];
};

export const useCollections = () => {
  return useQuery<Collection[], Error>({
    queryKey: ['collections'],
    queryFn: fetchCollections,
  });
};