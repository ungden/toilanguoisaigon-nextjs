import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Post } from '@/types/database';
import { slugify } from '@/lib/utils';
import { useEffect } from 'react';
import { Sparkles, Loader2 } from 'lucide-react';
import { useGeminiAssistant } from '@/hooks/data/useGeminiAssistant';
import { showError } from '@/utils/toast';
import { RichTextEditor } from './RichTextEditor';

const postFormSchema = z.object({
  title: z.string().min(3, { message: 'Tiêu đề phải có ít nhất 3 ký tự.' }),
  slug: z.string().min(3, { message: 'Slug phải có ít nhất 3 ký tự.' }),
  content: z.string().optional(),
  excerpt: z.string().max(300, { message: 'Tóm tắt không quá 300 ký tự.' }).optional(),
  cover_image_url: z.string().url({ message: 'URL hình ảnh không hợp lệ.' }).optional().or(z.literal('')),
  status: z.enum(['draft', 'published']),
});

export type PostFormValues = z.infer<typeof postFormSchema>;

interface PostFormProps {
  post?: Post | null;
  onSubmit: (values: PostFormValues) => void;
  isPending: boolean;
  onClose: () => void;
}

export function PostForm({ post, onSubmit, isPending, onClose }: PostFormProps) {
  const form = useForm<PostFormValues>({
    resolver: zodResolver(postFormSchema),
    defaultValues: {
      title: post?.title || '',
      slug: post?.slug || '',
      content: post?.content || '',
      excerpt: post?.excerpt || '',
      cover_image_url: post?.cover_image_url || '',
      status: (post?.status as 'draft' | 'published') || 'draft',
    },
  });

  const excerptAssistant = useGeminiAssistant({
    onSuccess: (result) => form.setValue('excerpt', result, { shouldValidate: true }),
  });

  const outlineAssistant = useGeminiAssistant({
    onSuccess: (result) => form.setValue('content', result, { shouldValidate: true }),
  });

  const handleAIAssist = (
    assistant: typeof excerptAssistant,
    task: 'generate_post_excerpt' | 'generate_post_outline'
  ) => {
    const title = form.getValues('title');
    if (!title) {
      showError('Vui lòng nhập Tiêu đề bài viết trước.');
      return;
    }
    assistant.mutate({ task, payload: { title } });
  };

  const watchedTitle = form.watch('title');
  useEffect(() => {
    if (watchedTitle && !form.getValues('slug')) {
      form.setValue('slug', slugify(watchedTitle));
    }
  }, [watchedTitle, form]);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tiêu đề</FormLabel>
              <FormControl><Input placeholder="Tiêu đề bài viết" {...field} /></FormControl>
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
              <FormControl><Input placeholder="tieu-de-bai-viet" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="excerpt"
          render={({ field }) => (
            <FormItem>
              <div className="flex items-center justify-between">
                <FormLabel>Tóm tắt</FormLabel>
                <Button type="button" variant="outline" size="sm" onClick={() => handleAIAssist(excerptAssistant, 'generate_post_excerpt')} disabled={excerptAssistant.isPending}>
                  {excerptAssistant.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4 mr-2 text-yellow-500" />}
                  Gợi ý
                </Button>
              </div>
              <FormControl><Textarea placeholder="Tóm tắt ngắn gọn nội dung bài viết..." {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="content"
          render={({ field }) => (
            <FormItem>
              <div className="flex items-center justify-between">
                <FormLabel>Nội dung</FormLabel>
                <Button type="button" variant="outline" size="sm" onClick={() => handleAIAssist(outlineAssistant, 'generate_post_outline')} disabled={outlineAssistant.isPending}>
                  {outlineAssistant.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4 mr-2 text-yellow-500" />}
                  Tạo dàn ý
                </Button>
              </div>
              <FormControl>
                <RichTextEditor
                  content={field.value || ''}
                  onChange={(html) => field.onChange(html)}
                  placeholder="Bắt đầu viết nội dung bài viết..."
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="cover_image_url"
          render={({ field }) => (
            <FormItem>
              <FormLabel>URL ảnh bìa</FormLabel>
              <FormControl><Input placeholder="https://..." {...field} /></FormControl>
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
                  <SelectItem value="draft">Nháp</SelectItem>
                  <SelectItem value="published">Xuất bản</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex justify-end gap-2 pt-4">
          <Button type="button" variant="outline" onClick={onClose}>Hủy</Button>
          <Button type="submit" disabled={isPending}>
            {isPending ? 'Đang lưu...' : 'Lưu bài viết'}
          </Button>
        </div>
      </form>
    </Form>
  );
}