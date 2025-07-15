import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Level } from '@/types/database';

const levelFormSchema = z.object({
  level: z.coerce.number().int().min(1, { message: 'Cấp độ phải là số nguyên dương.' }),
  xp_required: z.coerce.number().int().min(0, { message: 'XP yêu cầu phải là số không âm.' }),
  title: z.string().min(3, { message: 'Tiêu đề phải có ít nhất 3 ký tự.' }),
  description: z.string().optional(),
});

type LevelFormValues = z.infer<typeof levelFormSchema>;

interface LevelFormProps {
  level?: Level | null;
  onSubmit: (values: LevelFormValues) => void;
  isPending: boolean;
  onClose: () => void;
}

export function LevelForm({ level, onSubmit, isPending, onClose }: LevelFormProps) {
  const form = useForm<LevelFormValues>({
    resolver: zodResolver(levelFormSchema),
    defaultValues: {
      level: level?.level || undefined,
      xp_required: level?.xp_required || 0,
      title: level?.title || '',
      description: level?.description || '',
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="level"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Cấp độ</FormLabel>
              <FormControl><Input type="number" placeholder="1" {...field} disabled={!!level} /></FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="xp_required"
          render={({ field }) => (
            <FormItem>
              <FormLabel>XP yêu cầu</FormLabel>
              <FormControl><Input type="number" placeholder="100" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Danh hiệu</FormLabel>
              <FormControl><Input placeholder="Tân binh Sài Gòn" {...field} /></FormControl>
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
              <FormControl><Textarea placeholder="Mô tả ngắn về cấp độ này..." {...field} /></FormControl>
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