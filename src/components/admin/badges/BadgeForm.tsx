import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Badge } from '@/types/database';

const badgeFormSchema = z.object({
  name: z.string().min(3, { message: 'Tên huy hiệu phải có ít nhất 3 ký tự.' }),
  description: z.string().optional(),
  icon_name: z.string().optional(),
});

type BadgeFormValues = z.infer<typeof badgeFormSchema>;

interface BadgeFormProps {
  badge?: Badge | null;
  onSubmit: (values: BadgeFormValues) => void;
  isPending: boolean;
  onClose: () => void;
}

export function BadgeForm({ badge, onSubmit, isPending, onClose }: BadgeFormProps) {
  const form = useForm<BadgeFormValues>({
    resolver: zodResolver(badgeFormSchema),
    defaultValues: {
      name: badge?.name || '',
      description: badge?.description || '',
      icon_name: badge?.icon_name || '',
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tên huy hiệu</FormLabel>
              <FormControl><Input placeholder="Nhà phê bình ẩm thực" {...field} /></FormControl>
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
              <FormControl><Textarea placeholder="Đạt được khi viết 10 bài đánh giá" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="icon_name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tên Icon (Lucide)</FormLabel>
              <FormControl><Input placeholder="PenTool" {...field} /></FormControl>
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