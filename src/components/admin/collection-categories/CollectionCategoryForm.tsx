import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { CollectionCategory } from '@/types/database';
import { slugify } from '@/lib/utils';

const collectionCategoryFormSchema = z.object({
  name: z.string().min(3, { message: 'Tên danh mục phải có ít nhất 3 ký tự.' }),
  slug: z.string().optional(),
  description: z.string().optional(),
  icon: z.string().optional(),
});

export type CollectionCategoryFormValues = z.infer<typeof collectionCategoryFormSchema>;

interface CollectionCategoryFormProps {
  category?: CollectionCategory | null;
  onSubmit: (values: CollectionCategoryFormValues) => void;
  isPending: boolean;
  onClose: () => void;
}

export function CollectionCategoryForm({ category, onSubmit, isPending, onClose }: CollectionCategoryFormProps) {
  const form = useForm<CollectionCategoryFormValues>({
    resolver: zodResolver(collectionCategoryFormSchema),
    defaultValues: {
      name: category?.name || '',
      slug: category?.slug || '',
      description: category?.description || '',
      icon: category?.icon || '',
    },
  });

  const watchedName = form.watch('name');

  useEffect(() => {
    if (watchedName && !form.getValues('slug')) {
      form.setValue('slug', slugify(watchedName));
    }
  }, [watchedName, form]);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tên danh mục</FormLabel>
              <FormControl>
                <Input placeholder="Ẩm thực đường phố" {...field} />
              </FormControl>
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
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Mô tả</FormLabel>
              <FormControl><Textarea placeholder="Mô tả ngắn gọn về danh mục" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="icon"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tên Icon (Lucide)</FormLabel>
              <FormControl><Input placeholder="FolderOpen" {...field} /></FormControl>
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
