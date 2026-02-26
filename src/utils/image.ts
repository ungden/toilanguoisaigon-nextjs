import { supabase } from '@/integrations/supabase/client';

interface TransformOptions {
  width?: number;
  height?: number;
  quality?: number;
  resize?: 'cover' | 'contain' | 'fill';
}

// Helper to extract the path from a full Supabase URL
export const getPathFromSupabaseUrl = (url: string): string | null => {
    if (!url || !url.includes('supabase.co')) {
        return null;
    }
    try {
        const urlObject = new URL(url);
        const pathParts = urlObject.pathname.split('/');
        const bucketName = 'location-images';
        const bucketIndex = pathParts.indexOf(bucketName);
        if (bucketIndex === -1 || bucketIndex + 1 >= pathParts.length) {
            return pathParts[pathParts.length - 1]; // Fallback for simpler paths
        }
        return pathParts.slice(bucketIndex + 1).join('/');
    } catch {
        return null;
    }
}

export const getTransformedImageUrl = (path: string, options: TransformOptions): string => {
  const { data } = supabase.storage.from('location-images').getPublicUrl(path, {
    transform: {
      width: options.width,
      height: options.height,
      quality: options.quality || 75,
      resize: options.resize || 'cover',
    },
  });

  return data.publicUrl;
};