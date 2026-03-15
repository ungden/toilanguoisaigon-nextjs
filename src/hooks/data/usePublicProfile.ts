import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Profile, ReviewWithProfileAndLocation, UserCollection } from '@/types/database';

export const usePublicProfile = (userId: string) => {
  return useQuery({
    queryKey: ['public-profile', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;
      return data as Profile;
    },
    enabled: !!userId,
  });
};

export const usePublicUserReviews = (userId: string) => {
  return useQuery({
    queryKey: ['public-user-reviews', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('reviews')
        .select(`
          *,
          profiles (full_name, avatar_url),
          locations (name, slug)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as ReviewWithProfileAndLocation[];
    },
    enabled: !!userId,
  });
};

export const usePublicUserCollections = (userId: string) => {
  return useQuery({
    queryKey: ['public-user-collections', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_collections')
        .select(`
          id, title, slug, description, cover_image_url, is_public, created_at, updated_at,
          user_collection_locations (count)
        `)
        .eq('user_id', userId)
        .eq('is_public', true)
        .order('created_at', { ascending: false });

      if (error) {
        // If table doesn't exist yet (Phase 7 not fully deployed), return empty array gracefully
        if (error.code === '42P01') return []; 
        throw error;
      }
      
      // Map to include location_count from the subquery
      return (data || []).map(item => ({
        ...item,
        location_count: item.user_collection_locations?.[0]?.count || 0
      })) as any[];
    },
    enabled: !!userId,
  });
};
