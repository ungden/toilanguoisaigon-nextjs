export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type PriceRange = "$" | "$$" | "$$$" | "$$$$";
export type LocationStatus = "draft" | "published" | "rejected";
export type AppRole = "admin" | "moderator" | "user";
export type SubmissionStatus = "pending" | "approved" | "rejected";

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  created_at: string;
  updated_at: string;
  xp: number;
  level: number;
}

export type LeaderboardProfile = Pick<Profile, 'id' | 'full_name' | 'avatar_url' | 'xp' | 'level'>;

export interface ProfileWithRole extends Profile {
  user_roles: { role: AppRole } | { role: AppRole }[] | null;
}

export interface Location {
  id: string;
  created_at: string;
  name: string;
  slug: string;
  address: string;
  district: string;
  description: string | null;
  main_image_url: string | null;
  gallery_urls: string[] | null;
  phone_number: string | null;
  opening_hours: Json | null;
  price_range: PriceRange | null;
  latitude: number | null;
  longitude: number | null;
  status: LocationStatus;
  average_rating: number;
  review_count: number;
  // Google Maps data (populated by AI import)
  google_maps_uri: string | null;
  google_place_id: string | null;
  google_rating: number | null;
  google_review_count: number | null;
  google_review_summary: string | null; // AI-tổng hợp review từ Google Maps
  google_highlights: string[] | null; // Điểm nổi bật từ reviews (ví dụ: "phở đậm đà", "phục vụ nhanh")
  isSaved?: boolean; // Added for client-side tracking
}

export interface Review {
  id: string;
  location_id: string;
  user_id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  updated_at?: string;
}

export interface ReviewWithProfile extends Review {
  profiles: Pick<Profile, 'full_name' | 'avatar_url'> | null;
}

export interface ReviewWithProfileAndLocation extends Review {
  profiles: Pick<Profile, 'full_name' | 'avatar_url'> | null;
  locations: Pick<Location, 'name' | 'slug'> | null;
}

export interface CollectionCategory {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  created_at: string;
}

export interface Collection {
  id: number;
  category_id: number | null;
  title: string;
  description: string | null;
  slug: string;
  cover_image_url: string | null;
  created_at: string;
  collection_categories?: CollectionCategory | null;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  created_at: string;
}

export interface Tag {
  id: number;
  name: string;
  slug: string;
  created_at: string;
}

export interface Post {
  id: string;
  created_at: string;
  updated_at: string;
  title: string;
  slug: string;
  content: string | null;
  excerpt: string | null;
  cover_image_url: string | null;
  author_id: string | null;
  status: string;
  profiles: Pick<Profile, 'full_name' | 'avatar_url'> | null;
}

export interface LocationSubmission {
  id: string;
  created_at: string;
  user_id: string;
  name: string;
  address: string;
  district: string;
  description: string | null;
  notes: string | null;
  status: SubmissionStatus;
}

export interface Level {
  level: number;
  xp_required: number;
  title: string;
  description: string | null;
}

export interface XpAction {
  action_name: string;
  xp_value: number;
  description: string | null;
}

export interface Badge {
  id: number;
  name: string;
  description: string | null;
  icon_name: string | null;
  created_at: string;
}

// ─── Playlists (AI-generated daily food playlists) ───────────────────────

export type PlaylistStatus = "draft" | "published" | "archived";

export type PlaylistMood =
  | "morning"
  | "lunch"
  | "dinner"
  | "late-night"
  | "rainy-day"
  | "weekend"
  | "date-night"
  | "family"
  | "budget"
  | "premium"
  | "adventure"
  | "comfort"
  | "healthy"
  | "street-food"
  | "seasonal";

export interface Playlist {
  id: string;
  created_at: string;
  updated_at: string;
  title: string;
  slug: string;
  description: string | null;
  cover_image_url: string | null;
  mood: PlaylistMood | null;
  emoji: string | null;
  status: PlaylistStatus;
  is_featured: boolean;
  generated_date: string; // YYYY-MM-DD, ngày playlist được tạo
  ai_context: string | null; // prompt/context AI dùng để tạo playlist
  location_count: number;
}

export interface PlaylistLocation {
  playlist_id: string;
  location_id: string;
  position: number; // thứ tự trong playlist
  ai_note: string | null; // ghi chú AI cho location này trong playlist
}

export interface PlaylistWithLocations extends Playlist {
  playlist_locations: Array<
    PlaylistLocation & {
      locations: Pick<
        Location,
        'id' | 'name' | 'slug' | 'address' | 'district' | 'main_image_url' | 'average_rating' | 'review_count' | 'price_range'
      >;
    }
  >;
}