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

/**
 * Patterns that indicate AI-generated junk instead of real review summaries.
 * Returns null if the summary is junk, otherwise returns the original string.
 */
const JUNK_REVIEW_PATTERNS = [
  /không\s*(được\s*)?cung\s*cấp/i,
  /không\s*có\s*thông\s*tin/i,
  /chưa\s*có\s*(thông\s*tin|review|đánh\s*giá)/i,
  /thông\s*tin.*không.*có\s*sẵn/i,
  /dữ\s*liệu.*không.*cung\s*cấp/i,
  /không\s*có\s*dữ\s*liệu/i,
  /không\s*tìm\s*thấy\s*(review|đánh\s*giá)/i,
  /no\s*review/i,
  /not\s*(available|provided)/i,
  /n\/a/i,
];

export const cleanReviewSummary = (summary: string | null | undefined): string | null => {
  if (!summary || typeof summary !== 'string') return null;
  const trimmed = summary.trim();
  if (trimmed.length < 10) return null;
  for (const pattern of JUNK_REVIEW_PATTERNS) {
    if (pattern.test(trimmed)) return null;
  }
  return trimmed;
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