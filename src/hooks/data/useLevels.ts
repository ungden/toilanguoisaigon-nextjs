import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Level } from '@/types/database';

const fetchLevels = async (): Promise<Level[]> => {
  const { data, error } = await supabase
    .from('levels')
    .select('*')
    .order('level', { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return data || [];
};

export const useLevels = () => {
  return useQuery<Level[], Error>({
    queryKey: ['levels'],
    queryFn: fetchLevels,
    staleTime: Infinity, // Dữ liệu cấp độ ít thay đổi, có thể cache lâu
  });
};