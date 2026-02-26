import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Tag } from '@/types/database';

const slugify = (str: string) =>
  str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

const tagFormSchema = z.object({
  name: z.string().min(2, { message: 'Tên thẻ tag phải có ít nhất 2 ký tự.' }),
  slug: z.string().optional(),
});

export type TagFormValues = z.infer<typeof tagFormSchema>;

interface TagFormProps {
  tag?: Tag | null;
  onSubmit: (values: TagFormValues) => void;
  isPending: boolean;
  onClose: () => void;
}

export function TagForm({ tag, onSubmit, isPending, onClose }: TagFormProps) {
  const form = useForm<TagFormValues>({
    resolver: zodResolver(tagFormSchema),
    defaultValues: {
      name: tag?.name || '',
      slug: tag?.slug || '',
    },
  });

  const nameValue = form.watch('name');
  const slugValue = form.watch('slug');

  useEffect(() => {
    // Auto-generate slug from name only if slug is empty or was auto-generated
    if (!tag && nameValue) {
      const currentSlug = slugValue || '';
      const previousAutoSlug = slugify(form.getValues('name') || '');
      // Only auto-generate if user hasn't manually edited the slug
      if (!currentSlug || currentSlug === previousAutoSlug) {
        form.setValue('slug', slugify(nameValue));
      }
    }
  }, [nameValue, tag, form, slugValue]);

  const handleFormSubmit = (values: TagFormValues) => {
    const submitValues = {
      ...values,
      slug: values.slug || slugify(values.name),
    };
    onSubmit(submitValues);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tên thẻ tag</FormLabel>
              <FormControl><Input placeholder="Ẩm thực đường phố" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="slug"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Slug</FormLabel>
              <FormControl><Input placeholder="am-thuc-duong-pho" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex justify-end gap-2 pt-4">
          <Button type="button" variant="outline" onClick={onClose}>Hủy</Button>
          <Button type="submit" disabled={isPending}>
            {isPending ? 'Đang lưu...' : 'Lưu thay đổi'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
