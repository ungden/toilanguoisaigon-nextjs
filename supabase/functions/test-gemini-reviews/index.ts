import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const GEMINI_MODEL = "gemini-2.5-flash";
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req: any) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS_HEADERS });
  }

  try {
    const { name, address, district, action } = await req.json();

    // DDL action: run ALTER TABLE
    if (action === "add_column") {
      const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);
      // Use raw SQL via pg_query extension or just test
      // Actually, use the database URL directly
      const dbUrl = Deno.env.get("SUPABASE_DB_URL");
      if (!dbUrl) {
        return new Response(JSON.stringify({ error: "No DB URL" }), {
          status: 500,
          headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
        });
      }
      // Import postgres
      const { default: postgres } = await import("https://deno.land/x/postgresjs@v3.4.4/mod.js");
      const sql = postgres(dbUrl);
      await sql`ALTER TABLE locations ADD COLUMN IF NOT EXISTS review_insights jsonb DEFAULT NULL`;
      await sql`COMMENT ON COLUMN locations.review_insights IS 'Rich review data from Google Search: top_reviews, themes, pros, cons, best_dishes, atmosphere, typical_visit'`;
      await sql.end();
      return new Response(JSON.stringify({ success: true, message: "review_insights column added" }), {
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      });
    }

    if (!name) {
      return new Response(JSON.stringify({ error: "Missing 'name'" }), {
        status: 400,
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      });
    }

    // Prompt 1: General info + reviews summary
    const prompt1 = `Tìm địa điểm "${name}" tại ${address || ""}, ${district || "TP.HCM"} trên Google Maps.

Trả về JSON:
{
  "found": true/false,
  "google_rating": number,
  "google_review_count": number,
  "top_reviews": [
    {"author": "tên", "rating": 5, "text": "nội dung review gốc", "time": "2 tháng trước"},
    ...tối đa 5 reviews
  ],
  "review_themes": ["chủ đề phổ biến trong reviews 1", "chủ đề 2", ...],
  "pros": ["điểm mạnh 1", "điểm mạnh 2", ...],
  "cons": ["điểm yếu 1", "điểm yếu 2", ...],
  "best_dishes": ["món nổi bật 1", "món 2", ...],
  "atmosphere": "mô tả không khí quán",
  "price_level": "$/$$/$$$/$$$$",
  "typical_visit": "mô tả trải nghiệm 1 lần ghé quán",
  "google_highlights": ["highlight 1", "highlight 2", ...],
  "opening_hours": {"monday": "08:00-22:00", ...},
  "phone": "số điện thoại",
  "latitude": 10.xxx,
  "longitude": 106.xxx
}

QUAN TRỌNG:
- top_reviews: lấy TỐI ĐA 5 review THẬT từ Google Maps, giữ nguyên ngôn ngữ gốc
- review_themes: tổng hợp các chủ đề hay được nhắc đến trong reviews
- pros/cons: tổng hợp từ reviews thật, KHÔNG bịa
- best_dishes: món ăn/đồ uống được khen nhiều nhất
- CHỈ trả JSON, không markdown`;

    // Use Google Search only (NOT Maps) to get review content from web
    const geminiResponse = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt1 }] }],
        tools: [
          { googleSearch: {} },
        ],
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: 4096,
        },
      }),
    });

    const responseData: any = await geminiResponse.json();

    // Extract text from response
    const textPart = responseData?.candidates?.[0]?.content?.parts?.find(
      (p: any) => p.text
    );
    const rawText = textPart?.text || "";

    // Extract grounding metadata
    const grounding = responseData?.candidates?.[0]?.groundingMetadata || null;

    return new Response(
      JSON.stringify({
        name,
        raw_text: rawText,
        grounding_metadata: grounding,
        full_response_keys: Object.keys(responseData?.candidates?.[0] || {}),
      }),
      {
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      }
    );
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  }
});
