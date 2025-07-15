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

export const formatOpeningHours = (openingHours: any) => {
  if (!openingHours || typeof openingHours !== 'object') return 'Chưa cập nhật';
  
  const today = new Date().getDay();
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  
  const todayHours = openingHours[days[today]] || openingHours.monday;
  return todayHours === '24h' ? 'Mở cửa 24h' : todayHours || 'Chưa cập nhật';
};