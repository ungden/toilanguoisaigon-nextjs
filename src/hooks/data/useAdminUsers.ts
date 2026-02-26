import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ProfileWithRole } from '@/types/database';

const fetchAdminUsers = async (): Promise<ProfileWithRole[]> => {
  const { data, error } = await supabase
    .from('profiles')
    .select(`
      *,
      user_roles (
        role
      )
    `)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return data || [];
};

export const useAdminUsers = () => {
  return useQuery<ProfileWithRole[], Error>({
    queryKey: ['admin-users'],
    queryFn: fetchAdminUsers,
  });
};