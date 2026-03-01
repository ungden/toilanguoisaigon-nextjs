/**
 * Smart badge computation for locations.
 * Badges are computed client-side based on location data fields.
 */

export type BadgeType = 'new' | 'hot' | 'recently-reviewed' | 'featured' | 'top-rated';

export interface LocationBadge {
  type: BadgeType;
  label: string;
  /** Tailwind classes for bg + text + border */
  className: string;
  /** Priority for display ordering (lower = more important) */
  priority: number;
}

interface BadgeInput {
  created_at?: string | null;
  average_rating?: number | null;
  review_count?: number | null;
  is_featured?: boolean | null;
  google_rating?: number | null;
  google_review_count?: number | null;
  /** Computed field: ISO date of most recent user review */
  latest_review_at?: string | null;
  /** Computed field: how many users saved this location */
  save_count?: number | null;
}

const DAY_MS = 86_400_000;

/**
 * Compute smart badges for a location.
 * Returns up to `maxBadges` badges sorted by priority.
 */
export function getLocationBadges(location: BadgeInput, maxBadges = 2): LocationBadge[] {
  const badges: LocationBadge[] = [];
  const now = Date.now();

  // 1. Featured (admin-set)
  if (location.is_featured) {
    badges.push({
      type: 'featured',
      label: 'Nổi bật',
      className: 'bg-vietnam-gold-100 text-vietnam-gold-800 border-vietnam-gold-300',
      priority: 1,
    });
  }

  // 2. New — created within last 14 days
  if (location.created_at) {
    const age = now - new Date(location.created_at).getTime();
    if (age < 14 * DAY_MS) {
      badges.push({
        type: 'new',
        label: 'Mới',
        className: 'bg-green-100 text-green-800 border-green-300',
        priority: 2,
      });
    }
  }

  // 3. Hot — high engagement
  const userReviews = location.review_count || 0;
  const googleReviews = location.google_review_count || 0;
  const saves = location.save_count || 0;
  if (userReviews >= 5 || saves >= 10 || (googleReviews >= 500 && (location.google_rating || 0) >= 4.0)) {
    badges.push({
      type: 'hot',
      label: 'Đang hot',
      className: 'bg-orange-100 text-orange-800 border-orange-300',
      priority: 3,
    });
  }

  // 4. Recently reviewed — has a user review within last 7 days
  if (location.latest_review_at) {
    const reviewAge = now - new Date(location.latest_review_at).getTime();
    if (reviewAge < 7 * DAY_MS) {
      badges.push({
        type: 'recently-reviewed',
        label: 'Mới review',
        className: 'bg-blue-100 text-blue-800 border-blue-300',
        priority: 4,
      });
    }
  }

  // 5. Top rated — high quality signal
  const avgRating = location.average_rating || 0;
  const gRating = location.google_rating || 0;
  const effectiveRating = avgRating > 0 ? avgRating : gRating;
  if (effectiveRating >= 4.5 && (userReviews + googleReviews * 0.05) >= 5) {
    badges.push({
      type: 'top-rated',
      label: 'Top đánh giá',
      className: 'bg-vietnam-red-100 text-vietnam-red-800 border-vietnam-red-300',
      priority: 5,
    });
  }

  // Sort by priority, return top N
  badges.sort((a, b) => a.priority - b.priority);
  return badges.slice(0, maxBadges);
}
