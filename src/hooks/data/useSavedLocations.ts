import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Location } from '@/types/database';

// Định nghĩa cấu trúc chính xác của một hàng được trả về từ truy vấn select
// Giả định 'locations (*)' trả về một mảng, ngay cả khi chỉ có một mục
type SavedLocationQueryResult = {
  location_id: string;
  user_id: string;
  created_at: string;
  locations: Location[]; // Đã thay đổi thành mảng Location
};

const fetchSavedLocations = async (userId: string): Promise<Location[]> => {
  if (!userId) return [];

  const { data, error } = await supabase
    .from('saved_locations')
    .select(`
      location_id,
      user_id,
      created_at,
      locations (*)
    `)
    .eq('user_id', userId);

  if (error) {
    throw new Error(error.message);
  }

  // Ép kiểu dữ liệu một cách tường minh thành mảng của kiểu đã định nghĩa
  const typedData = data as SavedLocationQueryResult[] | null;

  return (typedData || [])
    .map((item) => item.locations?.[0]) // Truy cập phần tử đầu tiên của mảng locations
    .filter(Boolean) as Location[]; // Lọc bỏ null/undefined và ép kiểu thành Location[]
};

export const useSavedLocations = (userId: string | undefined) => {
  return useQuery<Location[], Error>({
    queryKey: ['savedLocations', userId],
    queryFn: () => fetchSavedLocations(userId!),
    enabled: !!userId, // Chỉ chạy truy vấn nếu userId có sẵn
    staleTime: 1000 * 60 * 5, // 5 phút
  });
};