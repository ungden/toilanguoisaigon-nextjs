import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface SaveParams {
  locationId: string;
  tagIds: number[];
}

/**
 * Replace a location's tags with the given set.
 * Deletes all existing, then inserts new ones.
 */
export const useSaveLocationTags = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ locationId, tagIds }: SaveParams) => {
      // Delete existing
      const { error: delError } = await supabase
        .from('location_tags')
        .delete()
        .eq('location_id', locationId);
      if (delError) throw delError;

      // Insert new (if any)
      if (tagIds.length > 0) {
        const rows = tagIds.map(tid => ({
          location_id: locationId,
          tag_id: tid,
        }));
        const { error: insError } = await supabase
          .from('location_tags')
          .insert(rows);
        if (insError) throw insError;
      }
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['location-tags', variables.locationId] });
    },
  });
};
