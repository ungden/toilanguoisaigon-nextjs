import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { LocationSubmission } from '@/types/database';

interface SubmissionWithProfile extends LocationSubmission {
  profiles: {
    full_name: string | null;
    email: string;
  } | null;
}

const fetchAdminSubmissions = async (): Promise<SubmissionWithProfile[]> => {
  const { data, error } = await supabase
    .from('location_submissions')
    .select(`
      *,
      profiles (
        full_name,
        email
      )
    `)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching admin submissions:', error);
    throw new Error(error.message);
  }

  return data as SubmissionWithProfile[];
};

export const useAdminSubmissions = () => {
  return useQuery<SubmissionWithProfile[], Error>({
    queryKey: ['admin-submissions'],
    queryFn: fetchAdminSubmissions,
  });
};