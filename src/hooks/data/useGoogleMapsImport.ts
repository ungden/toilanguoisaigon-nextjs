import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { showError, showSuccess } from '@/utils/toast';
import { useQueryClient } from '@tanstack/react-query';
import { slugify } from '@/lib/utils';

// Types matching the Edge Function response
export interface MapsImportLocation {
  name: string;
  address: string;
  district: string;
  description: string;
  phone_number: string | null;
  opening_hours: Record<string, string> | null;
  price_range: '$' | '$$' | '$$$' | '$$$$' | null;
  latitude: number | null;
  longitude: number | null;
  google_maps_uri: string | null;
  google_place_id: string | null;
  google_rating: number | null;
  google_review_count: number | null;
  google_review_summary: string | null;
  google_highlights: string[] | null;
}

interface MapsImportResponse {
  locations: MapsImportLocation[];
  grounding_chunks: Array<{
    title: string;
    uri: string;
    placeId: string | null;
  }>;
  query: string;
  total: number;
}

interface SearchParams {
  query: string;
  latitude?: number;
  longitude?: number;
}

/**
 * Hook to search locations via Gemini + Google Maps Grounding.
 * Returns a list of parsed locations from Google Maps data.
 */
export const useGoogleMapsSearch = () => {
  return useMutation({
    mutationFn: async (params: SearchParams): Promise<MapsImportResponse> => {
      const { data, error } = await supabase.functions.invoke('google-maps-import', {
        body: params,
      });

      if (error) {
        throw new Error(`Lỗi gọi Edge Function: ${error.message}`);
      }

      if (data.error) {
        throw new Error(data.error);
      }

      return data as MapsImportResponse;
    },
    onError: (error: Error) => {
      console.error('Google Maps search error:', error);
      showError(error.message || 'Không thể tìm kiếm từ Google Maps. Vui lòng thử lại.');
    },
  });
};

/**
 * Hook to import selected locations into the database.
 * Takes an array of MapsImportLocation and inserts them as draft locations.
 */
export const useImportLocations = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (locations: MapsImportLocation[]) => {
      const toInsert = locations.map((loc) => ({
        name: loc.name,
        slug: slugify(loc.name),
        address: loc.address,
        district: loc.district,
        description: loc.description,
        phone_number: loc.phone_number,
        opening_hours: loc.opening_hours,
        price_range: loc.price_range,
        latitude: loc.latitude,
        longitude: loc.longitude,
        google_maps_uri: loc.google_maps_uri,
        google_place_id: loc.google_place_id,
        google_rating: loc.google_rating,
        google_review_count: loc.google_review_count,
        google_review_summary: loc.google_review_summary,
        google_highlights: loc.google_highlights,
        status: 'draft' as const,
        average_rating: 0,
        review_count: 0,
      }));

      // Insert one by one to handle slug conflicts gracefully
      const results: Array<{ name: string; success: boolean; error?: string }> = [];

      for (const location of toInsert) {
        // Check if slug already exists
        const { data: existing } = await supabase
          .from('locations')
          .select('id')
          .eq('slug', location.slug)
          .maybeSingle();

        if (existing) {
          results.push({
            name: location.name,
            success: false,
            error: 'Địa điểm đã tồn tại (trùng slug)',
          });
          continue;
        }

        const { error } = await supabase.from('locations').insert(location);

        if (error) {
          results.push({
            name: location.name,
            success: false,
            error: error.message,
          });
        } else {
          results.push({ name: location.name, success: true });
        }
      }

      return results;
    },
    onSuccess: (results) => {
      const successCount = results.filter((r) => r.success).length;
      const failCount = results.filter((r) => !r.success).length;

      if (successCount > 0) {
        queryClient.invalidateQueries({ queryKey: ['admin-locations'] });
        queryClient.invalidateQueries({ queryKey: ['locations'] });
        showSuccess(
          `Đã import ${successCount} địa điểm thành công.${failCount > 0 ? ` ${failCount} bị lỗi.` : ''}`
        );
      } else {
        showError('Không import được địa điểm nào. Kiểm tra lại dữ liệu.');
      }
    },
    onError: (error: Error) => {
      console.error('Import locations error:', error);
      showError(error.message || 'Lỗi khi import địa điểm.');
    },
  });
};
