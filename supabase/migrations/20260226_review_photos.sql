-- Add image_urls column to reviews for photo uploads
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS image_urls text[] DEFAULT '{}';
COMMENT ON COLUMN reviews.image_urls IS 'Array of Supabase Storage URLs for review photos uploaded by users';

-- Create review-images storage bucket (public, 5MB limit, images only)
-- NOTE: Bucket creation done via Supabase Storage API, not SQL.
-- Bucket config: id=review-images, public=true, file_size_limit=5MB, allowed_mime_types=[image/jpeg, image/png, image/webp]

-- RLS policies for review-images bucket
CREATE POLICY "Anyone can view review images"
ON storage.objects FOR SELECT
USING (bucket_id = 'review-images');

CREATE POLICY "Authenticated users can upload review images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'review-images'
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Users can delete own review images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'review-images'
  AND auth.uid()::text = (storage.foldername(name))[1]
);
