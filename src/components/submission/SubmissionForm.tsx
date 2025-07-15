import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useSubmitLocation } from '@/hooks/data/useSubmitLocation';

const submissionFormSchema = z.object({
  name: z.string().min(3, 'Tên địa điểm phải có ít nhất 3 ký tự.'),
  address: z.string().min(10, 'Địa chỉ phải có ít nhất 10 ký tự.'),
  district: z.string().min(2, 'Vui lòng nhập quận/huyện.'),
  description: z.string().optional(),
  notes: z.string().optional(),
});

type SubmissionFormValues = z.infer<typeof submissionFormSchema>;

interface SubmissionFormProps {
  onSuccess: () => void;
}

export function SubmissionForm({ onSuccess }: SubmissionFormProps) {
  const submitLocationMutation = useSubmitLocation();

  const form = useForm<SubmissionFormValues>({
    resolver: zodResolver(submissionFormSchema),
    defaultValues: {
      name: '',
      address: '',
      district: '',
      description: '',
      notes: '',
    },
  });

  function onSubmit(data: SubmissionFormValues) {
    // Tạo payload một cách tường minh để đảm bảo kiểu dữ liệu chính xác
    const payload = {
      name: data.name,
      address: data.address,
      district: data.district,
      description: data.description,
      notes: data.notes,
    };

    submitLocationMutation.mutate(payload, {
      onSuccess: () => {
        form.reset();
        onSuccess();
      },
    });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField control={form.control} name="name" render={({ field }) => ( <FormItem> <FormLabel>Tên địa điểm</FormLabel> <FormControl><Input placeholder="Ví dụ: Bún Bò Huế 123" {...field} /></FormControl> <FormMessage /> </FormItem> )}/>
        <FormField control={form.control} name="address" render={({ field }) => ( <FormItem> <FormLabel>Địa chỉ chính xác</FormLabel> <FormControl><Input placeholder="123 Đường ABC, Phường X, Quận Y" {...field} /></FormControl> <FormMessage /> </FormItem> )}/>
        <FormField control={form.control} name="district" render={({ field }) => ( <FormItem> <FormLabel>Quận / Huyện</FormLabel> <FormControl><Input placeholder="Quận 1" {...field} /></FormControl> <FormMessage /> </FormItem> )}/>
        <FormField control={form.control} name="description" render={({ field }) => ( <FormItem> <FormLabel>Mô tả ngắn</FormLabel> <FormControl><Textarea placeholder="Mô tả về không gian, món ăn đặc trưng, hoặc điểm nổi bật của quán..." {...field} /></FormControl> <FormMessage /> </FormItem> )}/>
        <FormField control={form.control} name="notes" render={({ field }) => ( <FormItem> <FormLabel>Ghi chú thêm (tùy chọn)</FormLabel> <FormControl><Textarea placeholder="Ví dụ: Quán mới mở, nên đi buổi tối, có món X rất ngon..." {...field} /></FormControl> <FormMessage /> </FormItem> )}/>
        <Button type="submit" className="btn-vietnam w-full" disabled={submitLocationMutation.isPending}>
          {submitLocationMutation.isPending ? 'Đang gửi...' : 'Gửi đề xuất'}
        </Button>
      </form>
    </Form>
  );
}