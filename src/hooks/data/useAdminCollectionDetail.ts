import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Collection, Location } from '@/types/database';

interface CollectionWithLocations extends Collection {
  collection_locations: {
    locations: Location;
  }[];
}

const fetchCollectionDetail = async (collectionId: number): Promise<CollectionWithLocations | null> => {
  const { data, error } = await supabase
    .from('collections')
    .select(`
      *,
      collection_locations (
        locations (
          *
        )
      )
    `)
    .eq('id', collectionId)
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data as CollectionWithLocations;
};

export const useAdminCollectionDetail = (collectionId: number | null) => {
  return useQuery<CollectionWithLocations | null, Error>({
    queryKey: ['admin-collection-detail', collectionId],
    queryFn: () => fetchCollectionDetail(collectionId!),
    enabled: !!collectionId,
  });
};