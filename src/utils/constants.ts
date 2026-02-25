/**
 * Shared constants used across the application.
 */

/** Fallback images when no image is available */
export const FALLBACK_IMAGES = {
  location: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=2070&auto=format&fit=crop',
  collection: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?q=80&w=1974&auto=format&fit=crop',
  hero: 'https://images.unsplash.com/photo-1583417319070-4a69db38a482?q=80&w=2070&auto=format&fit=crop',
  collectionHero: 'https://images.unsplash.com/photo-1531697111548-0c45f24911da?q=80&w=2070&auto=format&fit=crop',
  /** OG image variant with 1200w for social sharing */
  og: 'https://images.unsplash.com/photo-1583417319070-4a69db38a482?q=80&w=1200&auto=format&fit=crop',
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
  {
    title: 'Michelin Sài Gòn 2025',
    overrideImage: 'https://assets.dyad.ai/michelin-saigon-2025.png',
  },
  { title: 'Check-in Sống Ảo Triệu Like' },
];

/** Site configuration */
export const SITE_CONFIG = {
  name: 'Tôi là người Sài Gòn',
  email: 'toilanguoisaigonofficial@gmail.com',
  url: 'https://www.toilanguoisaigon.com',
} as const;
