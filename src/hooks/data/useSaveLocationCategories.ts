import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface SaveParams {
  locationId: string;
  categoryIds: number[];
}

/**
 * Replace a location's categories with the given set.
 * Deletes all existing, then inserts new ones.
 */
export const useSaveLocationCategories = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ locationId, categoryIds }: SaveParams) => {
      // Delete existing
      const { error: delError } = await supabase
        .from('location_categories')
        .delete()
        .eq('location_id', locationId);
      if (delError) throw delError;

      // Insert new (if any)
      if (categoryIds.length > 0) {
        const rows = categoryIds.map(cid => ({
          location_id: locationId,
          category_id: cid,
        }));
        const { error: insError } = await supabase
          .from('location_categories')
          .insert(rows);
        if (insError) throw insError;
      }
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['location-categories', variables.locationId] });
    },
  });
};
