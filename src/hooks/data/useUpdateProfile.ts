import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { showError, showSuccess } from '@/utils/toast';

interface UpdateProfileArgs {
  id: string;
  full_name: string | null;
  bio: string | null;
  avatar_url: string | null;
}

export const useUpdateProfile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (profileData: UpdateProfileArgs) => {
      const { id, ...updates } = profileData;
      const { data, error } = await supabase
        .from('profiles')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      showSuccess('Hồ sơ đã được cập nhật thành công!');
      queryClient.invalidateQueries({ queryKey: ['profile'] }); // Invalidate profile data in AuthContext
      queryClient.invalidateQueries({ queryKey: ['posts'] }); // Invalidate posts to update author info
      queryClient.invalidateQueries({ queryKey: ['location-detail'] }); // Invalidate location detail to update review author info
    },
    onError: (error) => {
      console.error('Error updating profile:', error);
      showError('Có lỗi xảy ra khi cập nhật hồ sơ. Vui lòng thử lại.');
    },
  });
};