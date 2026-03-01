import React, { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/contexts/AuthContext';
import { useUpdateProfile } from '@/hooks/data/useUpdateProfile';
import { showError, showSuccess } from '@/utils/toast';
import { supabase } from '@/integrations/supabase/client';
import { Camera } from 'lucide-react';

const profileFormSchema = z.object({
  full_name: z.string().min(2, {
    message: 'Tên đầy đủ phải có ít nhất 2 ký tự.',
  }).max(50, {
    message: 'Tên đầy đủ không được vượt quá 50 ký tự.',
  }).optional().or(z.literal('')),
  display_name: z.string().max(30, {
    message: 'Nickname không được vượt quá 30 ký tự.',
  }).optional().or(z.literal('')),
  bio: z.string().max(160, {
    message: 'Tiểu sử không được vượt quá 160 ký tự.',
  }).optional().or(z.literal('')),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

interface EditProfileFormProps {
  onSuccess: () => void;
}

export function EditProfileForm({ onSuccess }: EditProfileFormProps) {
  const { profile, user } = useAuth();
  const updateProfileMutation = useUpdateProfile();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      full_name: profile?.full_name || '',
      display_name: profile?.display_name || '',
      bio: profile?.bio || '',
    },
    mode: 'onChange',
  });

  useEffect(() => {
    if (profile) {
      form.reset({
        full_name: profile.full_name || '',
        display_name: profile.display_name || '',
        bio: profile.bio || '',
      });
    }
  }, [profile, form]);

  // Clean up preview URL
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (file.size > 2 * 1024 * 1024) {
      showError('Ảnh đại diện không được vượt quá 2MB.');
      return;
    }

    if (!file.type.startsWith('image/')) {
      showError('Vui lòng chọn file ảnh.');
      return;
    }

    // Show preview
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(URL.createObjectURL(file));

    setIsUploading(true);
    try {
      const ext = file.name.split('.').pop() || 'jpg';
      const path = `avatars/${user.id}/${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from('review-images')
        .upload(path, file, { contentType: file.type, upsert: true });

      if (uploadError) throw uploadError;

      const { data: publicData } = supabase.storage.from('review-images').getPublicUrl(path);
      const avatarUrl = publicData.publicUrl;

      await updateProfileMutation.mutateAsync({
        id: user.id,
        full_name: profile?.full_name || null,
        display_name: profile?.display_name || null,
        bio: profile?.bio || null,
        avatar_url: avatarUrl,
      });
      showSuccess('Ảnh đại diện đã được cập nhật!');
      onSuccess();
    } catch {
      showError('Không thể tải ảnh lên. Vui lòng thử lại.');
    } finally {
      setIsUploading(false);
    }
  };

  async function onSubmit(data: ProfileFormValues) {
    if (!user) {
      showError('Bạn cần đăng nhập để cập nhật hồ sơ.');
      return;
    }

    try {
      await updateProfileMutation.mutateAsync({
        id: user.id,
        full_name: data.full_name || null,
        display_name: data.display_name || null,
        bio: data.bio || null,
        avatar_url: profile?.avatar_url || null,
      });
      onSuccess();
    } catch {
      // Error handled by useUpdateProfile hook
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Avatar upload */}
        <div className="flex items-center gap-4">
          <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
            <Avatar className="h-20 w-20 border-2 border-vietnam-red-200">
              <AvatarImage src={previewUrl || profile?.avatar_url || undefined} />
              <AvatarFallback className="text-2xl bg-vietnam-red-100 text-vietnam-red-700">
                {profile?.full_name?.[0]?.toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
            <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <Camera className="h-6 w-6 text-white" />
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleAvatarUpload}
              className="hidden"
            />
          </div>
          <div>
            <p className="text-sm font-medium text-vietnam-blue-800">Ảnh đại diện</p>
            <p className="text-xs text-slate-500">
              {isUploading ? 'Đang tải lên...' : 'Nhấp vào ảnh để thay đổi (tối đa 2MB)'}
            </p>
          </div>
        </div>

        <FormField
          control={form.control}
          name="full_name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tên đầy đủ</FormLabel>
              <FormControl>
                <Input placeholder="Tên của bạn" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="display_name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nickname</FormLabel>
              <FormControl>
                <Input placeholder="Tên hiển thị công khai (tùy chọn)" {...field} />
              </FormControl>
              <FormDescription>
                Tên này sẽ hiển thị trên đánh giá và bộ sưu tập thay vì tên đầy đủ.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="bio"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tiểu sử</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Kể một chút về bản thân..."
                  className="resize-none"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="btn-vietnam" disabled={updateProfileMutation.isPending || isUploading}>
          {updateProfileMutation.isPending ? 'Đang lưu...' : 'Cập nhật hồ sơ'}
        </Button>
      </form>
    </Form>
  );
}