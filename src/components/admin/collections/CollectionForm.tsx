import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Collection } from '@/types/database';
import { slugify } from '@/lib/utils';
import { useEffect } from 'react';
import { useCollectionCategories } from '@/hooks/data/useCollectionCategories';
import { useAdminCollectionDetail } from '@/hooks/data/useAdminCollectionDetail';
import { ManageCollectionLocations } from './ManageCollectionLocations';
import { Skeleton } from '@/components/ui/skeleton';

const collectionFormSchema = z.object({
  title: z.string().min(3, { message: 'Tiêu đề phải có ít nhất 3 ký tự.' }),
  slug: z.string().min(3, { message: 'Slug phải có ít nhất 3 ký tự.' }),
  description: z.string().optional(),
  cover_image_url: z.string().url({ message: 'URL hình ảnh không hợp lệ.' }).optional().or(z.literal('')),
  category_id: z.coerce.number().optional().nullable(),
});

type CollectionFormValues = z.infer<typeof collectionFormSchema>;

interface CollectionFormProps {
  collection?: Collection | null;
  onSubmit: (values: CollectionFormValues) => void;
  isPending: boolean;
  onClose: () => void;
}

export function CollectionForm({ collection, onSubmit, isPending, onClose }: CollectionFormProps) {
  const { data: categories, isLoading: isLoadingCategories } = useCollectionCategories();
  
  const { data: collectionDetail, isLoading: isLoadingDetail } = useAdminCollectionDetail(collection?.id || null);

  const form = useForm<CollectionFormValues>({
    resolver: zodResolver(collectionFormSchema),
    defaultValues: {
      title: collection?.title || '',
      slug: collection?.slug || '',
      description: collection?.description || '',
      cover_image_url: collection?.cover_image_url || '',
      category_id: collection?.category_id || null,
    },
  });

  const watchedTitle = form.watch('title');
  useEffect(() => {
    if (watchedTitle && !form.getValues('slug')) {
      form.setValue('slug', slugify(watchedTitle));
    }
  }, [watchedTitle, form]);

  const currentLocations = collectionDetail?.collection_locations.map(cl => cl.locations).filter(Boolean) || [];

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 max-h-[80vh] overflow-y-auto pr-4">
        {/* Metadata Form */}
        <FormField control={form.control} name="title" render={({ field }) => ( <FormItem> <FormLabel>Tiêu đề</FormLabel> <FormControl><Input placeholder="Ví dụ: Top quán cafe sống ảo" {...field} /></FormControl> <FormMessage /> </FormItem> )}/>
        <FormField control={form.control} name="slug" render={({ field }) => ( <FormItem> <FormLabel>Slug (URL)</FormLabel> <FormControl><Input placeholder="vi-du-top-quan-cafe-song-ao" {...field} /></FormControl> <FormMessage /> </FormItem> )}/>
        <FormField control={form.control} name="description" render={({ field }) => ( <FormItem> <FormLabel>Mô tả</FormLabel> <FormControl><Textarea placeholder="Mô tả ngắn về bộ sưu tập..." {...field} /></FormControl> <FormMessage /> </FormItem> )}/>
        <FormField control={form.control} name="cover_image_url" render={({ field }) => ( <FormItem> <FormLabel>URL ảnh bìa</FormLabel> <FormControl><Input placeholder="https://..." {...field} /></FormControl> <FormMessage /> </FormItem> )}/>
        <FormField control={form.control} name="category_id" render={({ field }) => ( <FormItem> <FormLabel>Danh mục</FormLabel> <Select onValueChange={field.onChange} defaultValue={String(field.value || '')}> <FormControl> <SelectTrigger disabled={isLoadingCategories}> <SelectValue placeholder="Chọn một danh mục" /> </SelectTrigger> </FormControl> <SelectContent> {categories?.map(cat => ( <SelectItem key={cat.id} value={String(cat.id)}>{cat.name}</SelectItem> ))} </SelectContent> </Select> <FormMessage /> </FormItem> )}/>
        
        {/* Location Management Section */}
        {collection && (
          isLoadingDetail ? (
            <div className="space-y-4 pt-4">
              <Skeleton className="h-px w-full" />
              <Skeleton className="h-6 w-1/2" />
              <Skeleton className="h-48 w-full" />
              <Skeleton className="h-6 w-1/3" />
              <Skeleton className="h-48 w-full" />
            </div>
          ) : (
            <ManageCollectionLocations 
              collectionId={collection.id}
              currentLocations={currentLocations}
            />
          )
        )}

        <div className="flex justify-end gap-2 pt-4 sticky bottom-0 bg-background pb-2">
          <Button type="button" variant="outline" onClick={onClose}>Hủy</Button>
          <Button type="submit" disabled={isPending}>
            {isPending ? 'Đang lưu...' : 'Lưu thay đổi'}
          </Button>
        </div>
      </form>
    </Form>
  );
}