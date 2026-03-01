import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { UserCollection } from '@/types/database';
import { showError, showSuccess } from '@/utils/toast';

// Fetch user's own collections
const fetchUserCollections = async (userId: string): Promise<UserCollection[]> => {
  const { data, error } = await supabase
    .from('user_collections')
    .select('*, user_collection_locations(count)')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false });

  if (error) throw new Error(error.message);

  return (data || []).map((c) => ({
    ...c,
    location_count: (c.user_collection_locations as unknown as { count: number }[])?.[0]?.count || 0,
  })) as UserCollection[];
};

export const useUserCollections = (userId: string | undefined) => {
  return useQuery<UserCollection[], Error>({
    queryKey: ['user-collections', userId],
    queryFn: () => fetchUserCollections(userId!),
    enabled: !!userId,
  });
};

// Create a new collection
function slugify(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 60);
}

interface CreateCollectionData {
  title: string;
  description?: string;
  is_public?: boolean;
}

export const useCreateUserCollection = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, data }: { userId: string; data: CreateCollectionData }) => {
      const slug = slugify(data.title) + '-' + Date.now().toString(36);
      const { data: result, error } = await supabase
        .from('user_collections')
        .insert({
          user_id: userId,
          title: data.title,
          description: data.description || null,
          is_public: data.is_public ?? true,
          slug,
        })
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      showSuccess('Bộ sưu tập đã được tạo!');
      queryClient.invalidateQueries({ queryKey: ['user-collections'] });
    },
    onError: () => {
      showError('Không thể tạo bộ sưu tập. Vui lòng thử lại.');
    },
  });
};

// Add location to collection
export const useAddToCollection = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ collectionId, locationId }: { collectionId: string; locationId: string }) => {
      const { error } = await supabase
        .from('user_collection_locations')
        .insert({ collection_id: collectionId, location_id: locationId });

      if (error) {
        if (error.code === '23505') return; // already in collection
        throw error;
      }
    },
    onSuccess: () => {
      showSuccess('Đã thêm vào bộ sưu tập!');
      queryClient.invalidateQueries({ queryKey: ['user-collections'] });
      queryClient.invalidateQueries({ queryKey: ['user-collection-detail'] });
    },
    onError: () => {
      showError('Không thể thêm vào bộ sưu tập.');
    },
  });
};

// Remove location from collection
export const useRemoveFromCollection = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ collectionId, locationId }: { collectionId: string; locationId: string }) => {
      const { error } = await supabase
        .from('user_collection_locations')
        .delete()
        .eq('collection_id', collectionId)
        .eq('location_id', locationId);

      if (error) throw error;
    },
    onSuccess: () => {
      showSuccess('Đã xóa khỏi bộ sưu tập.');
      queryClient.invalidateQueries({ queryKey: ['user-collections'] });
      queryClient.invalidateQueries({ queryKey: ['user-collection-detail'] });
    },
    onError: () => {
      showError('Không thể xóa khỏi bộ sưu tập.');
    },
  });
};

// Delete a collection
export const useDeleteUserCollection = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (collectionId: string) => {
      const { error } = await supabase
        .from('user_collections')
        .delete()
        .eq('id', collectionId);

      if (error) throw error;
    },
    onSuccess: () => {
      showSuccess('Đã xóa bộ sưu tập.');
      queryClient.invalidateQueries({ queryKey: ['user-collections'] });
    },
    onError: () => {
      showError('Không thể xóa bộ sưu tập.');
    },
  });
};
