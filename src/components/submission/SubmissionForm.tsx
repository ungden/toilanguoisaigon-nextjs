import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useSubmitLocation } from '@/hooks/data/useSubmitLocation';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { showError } from '@/utils/toast';
import { Camera, X, MapPin } from 'lucide-react';
import Image from 'next/image';

const DISTRICTS = [
  "Quận 1", "Quận 2", "Quận 3", "Quận 4", "Quận 5",
  "Quận 6", "Quận 7", "Quận 8", "Quận 10", "Quận 11", "Quận 12",
  "Bình Thạnh", "Phú Nhuận", "Gò Vấp", "Tân Bình", "Tân Phú",
  "Thủ Đức",
];

const submissionFormSchema = z.object({
  name: z.string().min(3, 'Tên địa điểm phải có ít nhất 3 ký tự.'),
  address: z.string().min(10, 'Địa chỉ phải có ít nhất 10 ký tự.'),
  district: z.string().min(2, 'Vui lòng chọn quận/huyện.'),
  description: z.string().optional(),
  notes: z.string().optional(),
  google_maps_url: z.string().url('URL Google Maps không hợp lệ.').optional().or(z.literal('')),
});

type SubmissionFormValues = z.infer<typeof submissionFormSchema>;

interface SubmissionFormProps {
  onSuccess: () => void;
}

export function SubmissionForm({ onSuccess }: SubmissionFormProps) {
  const submitLocationMutation = useSubmitLocation();
  const { user } = useAuth();
  const [photos, setPhotos] = useState<File[]>([]);
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const form = useForm<SubmissionFormValues>({
    resolver: zodResolver(submissionFormSchema),
    defaultValues: {
      name: '',
      address: '',
      district: '',
      description: '',
      notes: '',
      google_maps_url: '',
    },
  });

  const handlePhotoAdd = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (photos.length + files.length > 5) {
      showError('Tối đa 5 ảnh.');
      return;
    }
    const oversized = files.find(f => f.size > 5 * 1024 * 1024);
    if (oversized) {
      showError('Mỗi ảnh không được vượt quá 5MB.');
      return;
    }
    setPhotos(prev => [...prev, ...files]);
    setPhotoPreviews(prev => [...prev, ...files.map(f => URL.createObjectURL(f))]);
  };

  const removePhoto = (index: number) => {
    URL.revokeObjectURL(photoPreviews[index]);
    setPhotos(prev => prev.filter((_, i) => i !== index));
    setPhotoPreviews(prev => prev.filter((_, i) => i !== index));
  };

  async function onSubmit(data: SubmissionFormValues) {
    if (!user) return;

    let photoUrls: string[] = [];
    if (photos.length > 0) {
      setIsUploading(true);
      try {
        for (const file of photos) {
          const ext = file.name.split('.').pop() || 'jpg';
          const path = `submissions/${user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
          const { error: uploadError } = await supabase.storage
            .from('review-images')
            .upload(path, file, { contentType: file.type });
          if (uploadError) throw uploadError;
          const { data: publicData } = supabase.storage.from('review-images').getPublicUrl(path);
          photoUrls.push(publicData.publicUrl);
        }
      } catch {
        showError('Không thể tải ảnh lên. Vui lòng thử lại.');
        setIsUploading(false);
        return;
      }
      setIsUploading(false);
    }

    submitLocationMutation.mutate(
      {
        name: data.name,
        address: data.address,
        district: data.district,
        description: data.description,
        notes: data.notes,
        google_maps_url: data.google_maps_url || undefined,
        photo_urls: photoUrls.length > 0 ? photoUrls : undefined,
      },
      {
        onSuccess: () => {
          form.reset();
          photoPreviews.forEach(url => URL.revokeObjectURL(url));
          setPhotos([]);
          setPhotoPreviews([]);
          onSuccess();
        },
      }
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField control={form.control} name="name" render={({ field }) => (
          <FormItem>
            <FormLabel>Tên địa điểm</FormLabel>
            <FormControl><Input placeholder="Ví dụ: Bún Bò Huế 123" {...field} /></FormControl>
            <FormMessage />
          </FormItem>
        )}/>
        <FormField control={form.control} name="address" render={({ field }) => (
          <FormItem>
            <FormLabel>Địa chỉ chính xác</FormLabel>
            <FormControl><Input placeholder="123 Đường ABC, Phường X, Quận Y" {...field} /></FormControl>
            <FormMessage />
          </FormItem>
        )}/>
        <FormField control={form.control} name="district" render={({ field }) => (
          <FormItem>
            <FormLabel>Quận / Huyện</FormLabel>
            <Select onValueChange={field.onChange} value={field.value}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Chọn quận / huyện" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {DISTRICTS.map((d) => (
                  <SelectItem key={d} value={d}>{d}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}/>
        <FormField control={form.control} name="google_maps_url" render={({ field }) => (
          <FormItem>
            <FormLabel className="flex items-center gap-1">
              <MapPin className="h-4 w-4 text-vietnam-red-600" />
              Link Google Maps (tùy chọn)
            </FormLabel>
            <FormControl><Input placeholder="https://maps.google.com/..." {...field} /></FormControl>
            <FormDescription>Dán link Google Maps của quán để chúng tôi dễ tìm hơn.</FormDescription>
            <FormMessage />
          </FormItem>
        )}/>
        <FormField control={form.control} name="description" render={({ field }) => (
          <FormItem>
            <FormLabel>Mô tả ngắn</FormLabel>
            <FormControl><Textarea placeholder="Mô tả về không gian, món ăn đặc trưng, hoặc điểm nổi bật của quán..." {...field} /></FormControl>
            <FormMessage />
          </FormItem>
        )}/>

        {/* Photo upload */}
        <div>
          <label className="text-sm font-medium mb-2 block">Ảnh địa điểm (tối đa 5)</label>
          <div className="flex flex-wrap gap-3">
            {photoPreviews.map((preview, idx) => (
              <div key={idx} className="relative w-24 h-24 rounded-lg overflow-hidden border-2 border-vietnam-red-200">
                <Image src={preview} alt={`Ảnh ${idx + 1}`} fill className="object-cover" />
                <button
                  type="button"
                  onClick={() => removePhoto(idx)}
                  className="absolute top-0 right-0 bg-red-500 text-white rounded-bl-lg w-6 h-6 flex items-center justify-center text-xs font-bold hover:bg-red-600"
                  aria-label={`Xóa ảnh ${idx + 1}`}
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
            {photos.length < 5 && (
              <label className="w-24 h-24 rounded-lg border-2 border-dashed border-vietnam-blue-300 flex flex-col items-center justify-center cursor-pointer hover:border-vietnam-red-400 hover:bg-vietnam-red-50 transition-colors">
                <Camera className="h-6 w-6 text-vietnam-blue-400" />
                <span className="text-xs text-vietnam-blue-400 mt-1">Thêm ảnh</span>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  multiple
                  onChange={handlePhotoAdd}
                  className="hidden"
                />
              </label>
            )}
          </div>
        </div>

        <FormField control={form.control} name="notes" render={({ field }) => (
          <FormItem>
            <FormLabel>Ghi chú thêm (tùy chọn)</FormLabel>
            <FormControl><Textarea placeholder="Ví dụ: Quán mới mở, nên đi buổi tối, có món X rất ngon..." {...field} /></FormControl>
            <FormMessage />
          </FormItem>
        )}/>
        <Button type="submit" className="btn-vietnam w-full" disabled={submitLocationMutation.isPending || isUploading}>
          {isUploading ? 'Đang tải ảnh...' : submitLocationMutation.isPending ? 'Đang gửi...' : 'Gửi đề xuất'}
        </Button>
      </form>
    </Form>
  );
}