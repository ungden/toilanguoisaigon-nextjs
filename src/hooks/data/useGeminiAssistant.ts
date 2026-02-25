import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { showError } from '@/utils/toast';

type AssistantTask = 'generate_location_description' | 'generate_post_excerpt' | 'generate_post_outline';

interface UseGeminiAssistantProps {
  onSuccess: (result: string) => void;
}

export const useGeminiAssistant = ({ onSuccess }: UseGeminiAssistantProps) => {
  return useMutation({
    mutationFn: async ({ task, payload }: { task: AssistantTask, payload: Record<string, unknown> }) => {
      const { data, error } = await supabase.functions.invoke('gemini-assistant', {
        body: { task, payload },
      });

      if (error) {
        throw new Error(`Lỗi gọi Edge Function: ${error.message}`);
      }

      if (data.error) {
        throw new Error(`Lỗi từ Gemini: ${data.error}`);
      }

      return data.result as string;
    },
    onSuccess: (result) => {
      onSuccess(result);
    },
    onError: (error: Error) => {
      console.error('Lỗi trợ lý AI:', error);
      showError(error.message || 'Không thể nhận phản hồi từ AI. Vui lòng thử lại.');
    },
  });
};