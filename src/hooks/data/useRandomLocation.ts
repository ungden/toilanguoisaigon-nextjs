import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface RandomLocationOptions {
  district?: string | null;
  price_range?: string | null;
  category_id?: number | null;
}

export const useRandomLocation = () => {
  return async (options: RandomLocationOptions = {}) => {
    // Phase 1: Build the query to count and get matching IDs
    let query = supabase
      .from('locations')
      .select('id')
      .eq('status', 'published');

    if (options.district) {
      query = query.eq('district', options.district);
    }
    
    if (options.price_range) {
      query = query.eq('price_range', options.price_range);
    }
    
    if (options.category_id) {
      // Note: We need an inner join with location_categories
      // But since we just want a random id, and PostgREST limits complex counts,
      // it's easier to fetch all matching IDs and pick one in JS
      const { data: catData, error: catError } = await supabase
        .from('location_categories')
        .select('location_id')
        .eq('category_id', options.category_id);
        
      if (!catError && catData) {
        const locationIds = catData.map(d => d.location_id);
        if (locationIds.length > 0) {
          query = query.in('id', locationIds);
        } else {
          return null; // No locations in this category
        }
      }
    }

    // Fetch all matching IDs (usually ~1000 max, so it's fast enough)
    const { data: ids, error } = await query;

    if (error) {
      console.error('Error fetching location IDs:', error);
      throw error;
    }

    if (!ids || ids.length === 0) {
      return null;
    }

    // Phase 2: Pick a random ID
    const randomIndex = Math.floor(Math.random() * ids.length);
    const randomId = ids[randomIndex].id;

    // Phase 3: Fetch full location details
    const { data: location, error: locationError } = await supabase
      .from('locations')
      .select(`
        *,
        location_categories (
          categories (id, name, slug)
        ),
        location_tags (
          tags (id, name, slug, type)
        )
      `)
      .eq('id', randomId)
      .single();

    if (locationError) {
      console.error('Error fetching random location detail:', locationError);
      throw locationError;
    }

    return location;
  };
};
