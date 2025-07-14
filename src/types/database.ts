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

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  created_at: string;
  updated_at: string;
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
}

export interface Review {
  id: string;
  location_id: string;
  user_id: string;
  rating: number;
  comment: string | null;
  created_at: string;
}

export interface ReviewWithProfile extends Review {
  profiles: Pick<Profile, 'full_name' | 'avatar_url'> | null;
}

export interface Collection {
  id: number;
  category_id: number | null;
  title: string;
  description: string | null;
  slug: string;
  cover_image_url: string | null;
  created_at: string;
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