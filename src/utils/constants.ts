/**
 * Shared constants used across the application.
 */

/** Supabase Storage base URL for brand assets */
const BRAND_BASE = 'https://wsysphytctpgbzoatuzw.supabase.co/storage/v1/object/public/location-images/brand';

/** Fallback images when no image is available */
export const FALLBACK_IMAGES = {
  location: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=2070&auto=format&fit=crop',
  collection: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?q=80&w=1974&auto=format&fit=crop',
  hero: `${BRAND_BASE}/hero.png`,
  collectionHero: `${BRAND_BASE}/hero.png`,
  /** OG image — self-hosted Saigon watercolor on Supabase Storage */
  og: `${BRAND_BASE}/og-image.png`,
} as const;

/** Brand assets hosted on Supabase Storage */
export const BRAND_ASSETS = {
  /** Logo icon 512x512 — source for favicons */
  logo: `${BRAND_BASE}/logo-512.png`,
  /** Mystery card back — Saigon-themed tarot watercolor */
  mysteryCardBack: `${BRAND_BASE}/mystery-card-back.png`,
} as const;

interface FeaturedCollection {
  title: string;
  /** Optional override image (e.g. branded artwork instead of DB cover image) */
  overrideImage?: string;
}

/**
 * Collections that should be prioritised (pinned) at the top of the homepage.
 * Order matters – first entry appears first.
 */
export const FEATURED_COLLECTIONS: readonly FeaturedCollection[] = [
  { title: 'Quán Mới Trên MXH Đang Viral' },
  { title: 'Ăn Gì Khi Trời Mưa?' },
  { title: 'Quán Ăn Trong Hẻm Bí Mật' },
  { title: 'Date Night Hoàn Hảo' },
];

/**
 * Category-based artwork fallback images (AI-generated watercolor illustrations).
 * Used when a location has no real photos.
 */
export const CATEGORY_ARTWORK = {
  'pho': 'https://wsysphytctpgbzoatuzw.supabase.co/storage/v1/object/public/location-images/category-artwork/pho.png',
  'bun': 'https://wsysphytctpgbzoatuzw.supabase.co/storage/v1/object/public/location-images/category-artwork/bun.png',
  'com': 'https://wsysphytctpgbzoatuzw.supabase.co/storage/v1/object/public/location-images/category-artwork/com.png',
  'banh-mi': 'https://wsysphytctpgbzoatuzw.supabase.co/storage/v1/object/public/location-images/category-artwork/banh-mi.png',
  'cafe': 'https://wsysphytctpgbzoatuzw.supabase.co/storage/v1/object/public/location-images/category-artwork/cafe.png',
  'oc': 'https://wsysphytctpgbzoatuzw.supabase.co/storage/v1/object/public/location-images/category-artwork/oc.png',
  'lau': 'https://wsysphytctpgbzoatuzw.supabase.co/storage/v1/object/public/location-images/category-artwork/lau.png',
  'che': 'https://wsysphytctpgbzoatuzw.supabase.co/storage/v1/object/public/location-images/category-artwork/che.png',
  'hu-tieu': 'https://wsysphytctpgbzoatuzw.supabase.co/storage/v1/object/public/location-images/category-artwork/hu-tieu.png',
  'chay': 'https://wsysphytctpgbzoatuzw.supabase.co/storage/v1/object/public/location-images/category-artwork/chay.png',
  'nhau': 'https://wsysphytctpgbzoatuzw.supabase.co/storage/v1/object/public/location-images/category-artwork/nhau.png',
  'default': 'https://wsysphytctpgbzoatuzw.supabase.co/storage/v1/object/public/location-images/category-artwork/default.png',
} as const;

/**
 * Keyword map to match location names to category artwork.
 * Keys are category slugs, values are arrays of Vietnamese keywords (lowercased).
 */
const CATEGORY_KEYWORDS: Record<string, string[]> = {
  'pho': ['phở', 'pho'],
  'bun': ['bún', 'bun'],
  'com': ['cơm', 'com tấm', 'cơm tấm', 'com tam'],
  'banh-mi': ['bánh mì', 'banh mi', 'bánh mỳ'],
  'cafe': ['cà phê', 'cafe', 'coffee', 'cà fê', 'ca phe', 'caffe', 'cappuccino'],
  'oc': ['ốc', 'oc ', 'ghẹ', 'cua', 'hải sản', 'seafood'],
  'lau': ['lẩu', 'lau', 'hotpot', 'nướng'],
  'che': ['chè', 'che ', 'kem', 'bánh', 'dessert', 'sinh tố', 'trà sữa', 'nước ép'],
  'hu-tieu': ['hủ tiếu', 'hủ tíu', 'hu tieu', 'mì ', 'mi gia'],
  'chay': ['chay', 'vegetarian', 'zen'],
  'nhau': ['nhậu', 'bia', 'beer', 'quán nhậu'],
};

/**
 * Get the best artwork fallback URL for a location based on its name.
 * Matches location name keywords to food categories, falls back to default.
 */
export function getCategoryArtwork(locationName: string): string {
  const name = locationName.toLowerCase();
  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (keywords.some(kw => name.includes(kw))) {
      return CATEGORY_ARTWORK[category as keyof typeof CATEGORY_ARTWORK];
    }
  }
  return CATEGORY_ARTWORK.default;
}

/** Message shown when a location uses artwork instead of real photos */
export const ARTWORK_MESSAGE = 'Chúng tôi muốn giữ sự bất ngờ để trải nghiệm của bạn được trọn vẹn';

/** Site configuration */
export const SITE_CONFIG = {
  name: 'Tôi là người Sài Gòn',
  email: 'toilanguoisaigonofficial@gmail.com',
  url: 'https://www.toilanguoisaigon.com',
} as const;
