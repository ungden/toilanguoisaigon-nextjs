import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { showError, showSuccess } from '@/utils/toast';
import { AppRole } from '@/types/database';

interface UpdateUserRoleArgs {
  userId: string;
  role: AppRole;
}

export const useUpdateUserRole = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, role }: UpdateUserRoleArgs) => {
      const { error } = await supabase
        .from('user_roles')
        .update({ role })
        .eq('user_id', userId);

      if (error) throw error;
      return true;
    },
    onSuccess: () => {
      showSuccess('Cập nhật vai trò người dùng thành công!');
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    },
    onError: (error) => {
      console.error('Error updating user role:', error);
      showError('Không thể cập nhật vai trò. Vui lòng thử lại.');
    },
  });
};