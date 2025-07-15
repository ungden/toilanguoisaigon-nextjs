import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Location, PriceRange, LocationStatus } from '@/types/database';
import { slugify } from '@/lib/utils';
import { useEffect } from 'react';

const locationFormSchema = z.object({
  name: z.string().min(3, { message: 'Tên phải có ít nhất 3 ký tự.' }),
  slug: z.string().min(3, { message: 'Slug phải có ít nhất 3 ký tự.' }),
  address: z.string().min(5, { message: 'Địa chỉ phải có ít nhất 5 ký tự.' }),
  district: z.string().min(2, { message: 'Quận phải có ít nhất 2 ký tự.' }),
  description: z.string().optional(),
  main_image_url: z.string().url({ message: 'URL hình ảnh không hợp lệ.' }).optional().or(z.literal('')),
  gallery_urls: z.string().optional(),
  phone_number: z.string().optional(),
  opening_hours: z.string().optional(),
  price_range: z.enum(['$', '$$', '$$$', '$$$$']).optional().nullable(),
  status: z.enum(['draft', 'published', 'rejected']),
});

type LocationFormValues = z.infer<typeof locationFormSchema>;

interface LocationFormProps {
  location?: Location | null;
  onSubmit: (values: LocationFormValues) => void;
  isPending: boolean;
  onClose: () => void;
}

export function LocationForm({ location, onSubmit, isPending, onClose }: LocationFormProps) {
  const form = useForm<LocationFormValues>({
    resolver: zodResolver(locationFormSchema),
    defaultValues: {
      name: location?.name || '',
      slug: location?.slug || '',
      address: location?.address || '',
      district: location?.district || '',
      description: location?.description || '',
      main_image_url: location?.main_image_url || '',
      gallery_urls: location?.gallery_urls?.join('\n') || '',
      phone_number: location?.phone_number || '',
      opening_hours: location?.opening_hours ? JSON.stringify(location.opening_hours, null, 2) : '',
      price_range: location?.price_range || null,
      status: location?.status || 'draft',
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
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tên địa điểm</FormLabel>
              <FormControl><Input placeholder="Ví dụ: Phở Hòa Pasteur" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="slug"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Slug (URL)</FormLabel>
              <FormControl><Input placeholder="vi-du-pho-hoa-pasteur" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="address"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Địa chỉ</FormLabel>
              <FormControl><Input placeholder="260C Pasteur, Phường 8..." {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="district"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Quận</FormLabel>
              <FormControl><Input placeholder="Quận 3" {...field} /></FormControl>
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
              <FormControl><Textarea placeholder="Mô tả ngắn về địa điểm..." {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="main_image_url"
          render={({ field }) => (
            <FormItem>
              <FormLabel>URL ảnh chính</FormLabel>
              <FormControl><Input placeholder="https://..." {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="gallery_urls"
          render={({ field }) => (
            <FormItem>
              <FormLabel>URL thư viện ảnh (mỗi URL một dòng)</FormLabel>
              <FormControl><Textarea placeholder="https://...\nhttps://..." {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="phone_number"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Số điện thoại</FormLabel>
              <FormControl><Input placeholder="090..." {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="opening_hours"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Giờ mở cửa (JSON)</FormLabel>
              <FormControl><Textarea placeholder='{ "monday": "08:00-22:00", ... }' {...field} className="min-h-[100px]" /></FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="price_range"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Mức giá</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value || ''}>
                  <FormControl><SelectTrigger><SelectValue placeholder="Chọn mức giá" /></SelectTrigger></FormControl>
                  <SelectContent>
                    {(['$', '$$', '$$$', '$$$$'] as PriceRange[]).map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Trạng thái</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl><SelectTrigger><SelectValue placeholder="Chọn trạng thái" /></SelectTrigger></FormControl>
                  <SelectContent>
                    {(['draft', 'published', 'rejected'] as LocationStatus[]).map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
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