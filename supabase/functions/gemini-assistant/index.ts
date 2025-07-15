import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// Define CORS headers directly inside the function
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`;

// --- Prompt Templates ---

const PROMPTS = {
  generate_location_description: (payload: { name: string; district: string; }) => `
    Bạn là một blogger ẩm thực chuyên nghiệp tại Sài Gòn, với văn phong trẻ trung, hấp dẫn và lôi cuốn.
    Hãy viết một đoạn mô tả ngắn (khoảng 3-4 câu, tối đa 150 từ) cho một địa điểm có tên là "${payload.name}" ở "${payload.district}".
    
    Yêu cầu:
    - Giọng văn phải thật tự nhiên, như đang giới thiệu cho bạn bè.
    - Tập trung vào việc khơi gợi sự tò mò và cảm giác muốn đến thử.
    - Không cần ghi lại tên địa điểm hay quận trong đoạn văn.
    - Chỉ trả về nội dung mô tả, không thêm bất kỳ lời chào hay ghi chú nào khác.
  `,
  generate_post_excerpt: (payload: { title: string; }) => `
    Bạn là một biên tập viên tài năng. Hãy viết một đoạn tóm tắt (excerpt) thật hấp dẫn (khoảng 2-3 câu, tối đa 50 từ) cho một bài blog có tiêu đề: "${payload.title}".
    Mục tiêu là làm cho người đọc tò mò và muốn nhấp vào xem chi tiết.
    Chỉ trả về nội dung tóm tắt, không thêm bất kỳ lời chào hay ghi chú nào khác.
  `,
  generate_post_outline: (payload: { title: string; }) => `
    Bạn là một blogger ẩm thực chuyên nghiệp. Hãy tạo một dàn ý chi tiết dưới dạng HTML cho một bài blog có tiêu đề: "${payload.title}".
    
    Yêu cầu:
    - Sử dụng các thẻ h3 cho các mục chính và p cho các đoạn văn mô tả ngắn gọn bên dưới mỗi mục.
    - Gợi ý ít nhất 3-4 mục chính.
    - Mỗi mục chính nên có một đoạn mô tả ngắn gọn về nội dung sẽ viết.
    - Ví dụ: <h3>1. Không gian ấn tượng</h3><p>Mô tả về thiết kế, không gian, cảm giác khi bước vào...</p>
    - Chỉ trả về nội dung HTML, không thêm bất kỳ lời chào hay ghi chú nào khác.
  `
};

// --- Main Function Logic ---

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { task, payload } = await req.json();

    if (!task || !PROMPTS[task]) {
      throw new Error("Invalid task provided.");
    }

    const prompt = PROMPTS[task](payload);

    const geminiRequest = {
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.7,
        topK: 1,
        topP: 1,
        maxOutputTokens: 512,
      },
    };

    const geminiResponse = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(geminiRequest),
    });

    if (!geminiResponse.ok) {
      const errorBody = await geminiResponse.text();
      throw new Error(`Gemini API error: ${geminiResponse.status} ${errorBody}`);
    }

    const responseData = await geminiResponse.json();
    const generatedText = responseData.candidates[0]?.content.parts[0]?.text || "";

    return new Response(JSON.stringify({ result: generatedText.trim() }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});