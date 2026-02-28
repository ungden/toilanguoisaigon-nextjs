-- Function to get nearby locations using Haversine formula
-- Drops the function if it already exists to allow updates
DROP FUNCTION IF EXISTS get_nearby_locations(double precision, double precision, double precision);

CREATE OR REPLACE FUNCTION get_nearby_locations(
  user_lat double precision,
  user_lon double precision,
  max_distance_km double precision DEFAULT 5.0
)
RETURNS TABLE (
  id uuid,
  name text,
  slug text,
  address text,
  district text,
  main_image_url text,
  price_range text,
  average_rating double precision,
  review_count integer,
  category text,
  latitude double precision,
  longitude double precision,
  distance_km double precision
)
LANGUAGE sql
AS $$
  SELECT 
    id, name, slug, address, district, main_image_url, price_range, average_rating, review_count, category, latitude, longitude,
    -- Haversine formula to calculate distance in km
    (
      6371 * acos(
        cos(radians(user_lat))
        * cos(radians(latitude))
        * cos(radians(longitude) - radians(user_lon))
        + sin(radians(user_lat)) * sin(radians(latitude))
      )
    ) AS distance_km
  FROM 
    locations
  WHERE 
    status = 'approved'
    AND latitude IS NOT NULL
    AND longitude IS NOT NULL
    AND (
      6371 * acos(
        cos(radians(user_lat))
        * cos(radians(latitude))
        * cos(radians(longitude) - radians(user_lon))
        + sin(radians(user_lat)) * sin(radians(latitude))
      )
    ) <= max_distance_km
  ORDER BY 
    distance_km ASC;
$$;
