export const formatPriceRange = (priceRange: string | null | undefined) => {
  if (!priceRange) return 'Chưa cập nhật';
  const priceMap: { [key: string]: string } = {
    '$': 'Dưới 200.000đ',
    '$$': '200.000đ - 500.000đ',
    '$$$': '500.000đ - 1.000.000đ',
    '$$$$': 'Trên 1.000.000đ'
  };
  return priceMap[priceRange] || priceRange;
};

export const formatOpeningHours = (openingHours: unknown) => {
  if (!openingHours || typeof openingHours !== 'object' || Array.isArray(openingHours)) return 'Chưa cập nhật';
  const hours = openingHours as Record<string, string>;
  
  const today = new Date().getDay();
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  
  const todayHours = hours[days[today]];
  if (!todayHours) return 'Chưa cập nhật';
  return todayHours === '24h' ? 'Mở cửa 24h' : todayHours;
};