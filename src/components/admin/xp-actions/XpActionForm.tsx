import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { XpAction } from '@/types/database';

const xpActionFormSchema = z.object({
  xp_value: z.coerce.number().int().min(0, { message: 'XP phải là số không âm.' }),
  description: z.string().optional(),
});

export type XpActionFormValues = z.infer<typeof xpActionFormSchema>;

interface XpActionFormProps {
  action: XpAction;
  onSubmit: (values: XpActionFormValues) => void;
  isPending: boolean;
  onClose: () => void;
}

export function XpActionForm({ action, onSubmit, isPending, onClose }: XpActionFormProps) {
  const form = useForm<XpActionFormValues>({
    resolver: zodResolver(xpActionFormSchema),
    defaultValues: {
      xp_value: action.xp_value,
      description: action.description || '',
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormItem>
          <FormLabel>Tên hành động (Không thể thay đổi)</FormLabel>
          <FormControl>
            <Input value={action.action_name} disabled />
          </FormControl>
        </FormItem>
        <FormField
          control={form.control}
          name="xp_value"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Điểm XP</FormLabel>
              <FormControl><Input type="number" placeholder="25" {...field} /></FormControl>
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
              <FormControl><Textarea placeholder="Mô tả ngắn về hành động này..." {...field} /></FormControl>
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