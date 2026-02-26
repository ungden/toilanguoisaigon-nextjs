import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useAuth } from '@/contexts/AuthContext';
import { useUpdateProfile } from '@/hooks/data/useUpdateProfile';
import { showError } from '@/utils/toast';

const profileFormSchema = z.object({
  full_name: z.string().min(2, {
    message: 'Tên đầy đủ phải có ít nhất 2 ký tự.',
  }).max(50, {
    message: 'Tên đầy đủ không được vượt quá 50 ký tự.',
  }).optional().or(z.literal('')),
  bio: z.string().max(160, {
    message: 'Tiểu sử không được vượt quá 160 ký tự.',
  }).optional().or(z.literal('')),
  avatar_url: z.string().url({ message: 'URL ảnh đại diện không hợp lệ.' }).optional().or(z.literal('')),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

interface EditProfileFormProps {
  onSuccess: () => void;
}

export function EditProfileForm({ onSuccess }: EditProfileFormProps) {
  const { profile, user } = useAuth();
  const updateProfileMutation = useUpdateProfile();

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      full_name: profile?.full_name || '',
      bio: profile?.bio || '',
      avatar_url: profile?.avatar_url || '',
    },
    mode: 'onChange',
  });

  useEffect(() => {
    if (profile) {
      form.reset({
        full_name: profile.full_name || '',
        bio: profile.bio || '',
        avatar_url: profile.avatar_url || '',
      });
    }
  }, [profile, form]);

  async function onSubmit(data: ProfileFormValues) {
    if (!user) {
      showError('Bạn cần đăng nhập để cập nhật hồ sơ.');
      return;
    }

    try {
      await updateProfileMutation.mutateAsync({
        id: user.id,
        full_name: data.full_name || null,
        bio: data.bio || null,
        avatar_url: data.avatar_url || null,
      });
      onSuccess();
    } catch {
      // Error handled by useUpdateProfile hook
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
        <FormField
          control={form.control}
          name="avatar_url"
          render={({ field }) => (
            <FormItem>
              <FormLabel>URL ảnh đại diện</FormLabel>
              <FormControl>
                <Input placeholder="https://example.com/avatar.jpg" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="btn-vietnam" disabled={updateProfileMutation.isPending}>
          {updateProfileMutation.isPending ? 'Đang lưu...' : 'Cập nhật hồ sơ'}
        </Button>
      </form>
    </Form>
  );
}