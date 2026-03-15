/**
 * Generate SEO-optimized blog posts using Gemini AI + real location data.
 *
 * Called daily by daily-cron. Each run generates `count` articles (default 2).
 * Topics are picked randomly from a rotating pool, skipping already-published slugs.
 *
 * POST body: { count?: number }
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

const GEMINI_MODEL = "gemini-2.5-flash";
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;

const SITE_URL = "https://www.toilanguoisaigon.com";

// ─── Helpers ──────────────────────────────────────────────────────────────

function slugify(text: string): string {
  return text
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function pickRandom<T>(arr: T[], n: number): T[] {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, n);
}

function estimateReadingTime(html: string): number {
  const text = html.replace(/<[^>]+>/g, " ");
  const words = text.split(/\s+/).filter(Boolean).length;
  return Math.max(3, Math.ceil(words / 200));
}

function formatLocations(
  locations: Array<Record<string, unknown>>
): string {
  return locations
    .map((loc) => {
      const parts = [`- **${loc.name}**`];
      if (loc.address)
        parts.push(`  Địa chỉ: ${loc.address}, ${loc.district || ""}`);
      if (loc.google_rating)
        parts.push(
          `  Rating: ${loc.google_rating}/5 (${loc.google_review_count || 0} reviews)`
        );
      if (loc.price_range) {
        const pr: Record<string, string> = {
          $: "dưới 50k",
          $$: "50k-200k",
          $$$: "200k-500k",
          $$$$: "trên 500k",
        };
        parts.push(`  Giá: ${pr[loc.price_range as string] || loc.price_range}`);
      }
      if (loc.google_review_summary) {
        const s = String(loc.google_review_summary).substring(0, 150);
        parts.push(`  Nhận xét: "${s}"`);
      }
      if (loc.slug) parts.push(`  Link: /place/${loc.slug}`);
      return parts.join("\n");
    })
    .join("\n\n");
}

// ─── Topic Pool ───────────────────────────────────────────────────────────

interface Topic {
  title: string;
  category: string;
  tags: string[];
  meta_description: string;
  prompt_template: string;
  /** Supabase REST filters to fetch relevant locations */
  location_filter: {
    column?: string;
    op?: string;
    value?: string;
    text_search?: string; // ilike pattern on name
    order_by?: string;
    limit?: number;
  };
}

/**
 * Rotating pool of daily topic "themes".
 * Each theme generates a unique article title including the current date
 * so we never run out of topics.
 */
function buildDailyTopics(today: string, dayOfWeek: string): Topic[] {
  const month = new Date().toLocaleDateString("vi-VN", { month: "long" });
  const year = new Date().getFullYear();

  // We generate date-stamped titles so each day produces unique articles
  const themes: Topic[] = [
    // ── Daily rotating by day-of-week ──
    {
      title: `Ăn gì ${dayOfWeek} này? Gợi ý ẩm thực Sài Gòn ${today}`,
      category: "guide",
      tags: ["ăn gì hôm nay", "sài gòn", dayOfWeek.toLowerCase()],
      meta_description: `Gợi ý quán ăn ngon Sài Gòn cho ${dayOfWeek} ${today} — từ sáng đến khuya, đủ mọi phong cách.`,
      prompt_template: "daily_suggestion",
      location_filter: {
        order_by: "average_rating",
        limit: 15,
      },
    },
    {
      title: `Top quán ăn mới Sài Gòn tuần này (${today})`,
      category: "listicle",
      tags: ["quán mới", "sài gòn", "cập nhật"],
      meta_description: `Danh sách quán ăn mới nhất Sài Gòn tuần này — check-in ngay trước khi đông!`,
      prompt_template: "new_places",
      location_filter: {
        order_by: "created_at",
        limit: 12,
      },
    },
    {
      title: `Bản đồ ăn vặt Sài Gòn: Cập nhật ${tháng(month)} ${year}`,
      category: "guide",
      tags: ["ăn vặt", "sài gòn", "bản đồ"],
      meta_description: `Tổng hợp quán ăn vặt ngon nhất Sài Gòn — bánh tráng, chè, kem, xiên nướng. Cập nhật mới nhất.`,
      prompt_template: "snack_map",
      location_filter: {
        text_search: "%chè%|%kem%|%bánh%|%xiên%|%trà%|%sinh tố%|%nước%",
        limit: 15,
      },
    },
    {
      title: `Sài Gòn ăn gì cho ngày ${dayOfWeek} chill? Gợi ý ${today}`,
      category: "tip",
      tags: ["ăn gì", "chill", dayOfWeek.toLowerCase()],
      meta_description: `${dayOfWeek} rảnh rỗi ăn gì ở Sài Gòn? Gợi ý quán ngon, view đẹp, giá hợp lý.`,
      prompt_template: "chill_day",
      location_filter: {
        text_search: "%cafe%|%cà phê%|%garden%|%sân vườn%",
        limit: 12,
      },
    },
    {
      title: `Đi đâu ăn gì Sài Gòn hôm nay? Lịch trình ẩm thực ${today}`,
      category: "guide",
      tags: ["lịch trình", "ẩm thực", "sài gòn"],
      meta_description: `Lịch trình ẩm thực Sài Gòn trọn ngày — sáng, trưa, xế, tối. Ăn gì? Đi đâu? Bao nhiêu tiền?`,
      prompt_template: "itinerary",
      location_filter: {
        order_by: "average_rating",
        limit: 20,
      },
    },
    // ── District rotating ──
    ...randomDistrictTopics(today, year),
    // ── Food category rotating ──
    ...randomFoodTopics(today, year),
  ];

  return themes;
}

function tháng(m: string): string {
  return m.charAt(0).toUpperCase() + m.slice(1);
}

function randomDistrictTopics(today: string, year: number): Topic[] {
  const districts = [
    "Quận 1", "Quận 3", "Quận 4", "Quận 5", "Quận 7", "Quận 10",
    "Bình Thạnh", "Phú Nhuận", "Gò Vấp", "Thủ Đức", "Tân Bình", "Tân Phú",
  ];
  // Pick 2 random districts for today
  const picked = pickRandom(districts, 2);
  return picked.map((d) => ({
    title: `Ăn gì ở ${d} hôm nay? Update ${today}`,
    category: "guide",
    tags: [d.toLowerCase(), "ăn gì", "quán ngon"],
    meta_description: `Khám phá quán ăn ngon nhất ${d} — cập nhật mới nhất ${today}. Bình dân đến sang trọng.`,
    prompt_template: "district_guide",
    location_filter: {
      column: "district",
      op: "eq",
      value: d,
      limit: 12,
    },
  }));
}

function randomFoodTopics(today: string, year: number): Topic[] {
  const foods: Array<{ name: string; pattern: string }> = [
    { name: "Phở", pattern: "%phở%" },
    { name: "Bún bò", pattern: "%bún bò%" },
    { name: "Bánh mì", pattern: "%bánh mì%" },
    { name: "Cơm tấm", pattern: "%cơm tấm%" },
    { name: "Cà phê", pattern: "%cà phê%|%cafe%|%coffee%" },
    { name: "Lẩu & Nướng", pattern: "%lẩu%|%nướng%|%bbq%" },
    { name: "Hủ tiếu", pattern: "%hủ tiếu%" },
    { name: "Ốc & Hải sản", pattern: "%ốc%|%hải sản%|%seafood%" },
    { name: "Chè & Kem", pattern: "%chè%|%kem%|%gelato%" },
    { name: "Xôi", pattern: "%xôi%" },
    { name: "Bánh canh", pattern: "%bánh canh%" },
    { name: "Cháo", pattern: "%cháo%" },
  ];
  const picked = pickRandom(foods, 2);
  return picked.map((f) => ({
    title: `${f.name} ngon nhất Sài Gòn: Cập nhật ${today}`,
    category: "guide",
    tags: [f.name.toLowerCase(), "sài gòn", "quán ngon"],
    meta_description: `Tổng hợp quán ${f.name.toLowerCase()} ngon nhất Sài Gòn — review chi tiết kèm địa chỉ, giá, rating. Cập nhật ${year}.`,
    prompt_template: "food_category_guide",
    location_filter: {
      text_search: f.pattern,
      limit: 12,
    },
  }));
}

// ─── Prompt Builder ───────────────────────────────────────────────────────

function buildPrompt(topic: Topic, locationsText: string): string {
  const templateInstructions: Record<string, string> = {
    daily_suggestion: `
HƯỚNG DẪN:
- Chia bài theo bữa: Sáng, Trưa, Xế/Chiều, Tối, Khuya (nếu có).
- Mỗi bữa gợi ý 2-3 quán, mô tả ngắn gọn hấp dẫn.
- Thêm tips: quán nào đông nên đến sớm, quán nào phù hợp nhóm/cặp đôi/gia đình.
- Tone thân thiện như đang nhắn tin cho bạn bè.`,

    new_places: `
HƯỚNG DẪN:
- Focus vào quán MỚI nhất (mở gần đây).
- Mỗi quán: mô tả concept, món signature, giá, không gian.
- Đánh giá ngắn: worth it hay hype?
- Kết bài: ranking nhanh top 3 đáng thử nhất.`,

    snack_map: `
HƯỚNG DẪN:
- Nhóm theo loại: đồ ngọt, đồ mặn, nước uống, kem.
- Mỗi quán: tên, địa chỉ, món must-try, giá, review 1-2 câu.
- Thêm "combo lý tưởng" — gợi ý ăn vặt từ sáng đến tối.
- Tone vui tươi, trẻ trung.`,

    chill_day: `
HƯỚNG DẪN:
- Gợi ý quán có không gian chill: sân vườn, view đẹp, yên tĩnh.
- Combo: cafe sáng → brunch → trà chiều → dinner nhẹ.
- Mỗi quán: điểm nổi bật về không gian + đồ ăn/uống.`,

    itinerary: `
HƯỚNG DẪN:
- Viết dạng lịch trình theo giờ (8h → 10h → 12h → 15h → 18h → 21h).
- Mỗi time slot: 1-2 quán, mô tả ngắn, tips di chuyển.
- Tính tổng chi phí ước tính cho cả ngày.
- Cuối bài: bản tóm tắt lịch trình dạng bullet points.`,

    district_guide: `
HƯỚNG DẪN:
- Mở đầu giới thiệu nét đặc trưng ẩm thực khu vực.
- Nhóm quán theo loại món (phở/bún, cơm, cafe, nhậu...).
- Mỗi quán: món nên thử, giá, không gian, tips.
- Cuối: "Top 5 must-try" tóm tắt nhanh.`,

    food_category_guide: `
HƯỚNG DẪN:
- Mở đầu bằng 2-3 câu về văn hóa/lịch sử món này ở Sài Gòn.
- Chia theo phong cách: vỉa hè bình dân, quán có không gian, nhà hàng.
- Mỗi quán: món signature, giá, review nhanh.
- So sánh: quán nào ngon nhất, rẻ nhất, đặc biệt nhất.`,
  };

  const specific =
    templateInstructions[topic.prompt_template] ||
    templateInstructions["daily_suggestion"];

  return `Bạn là food blogger chuyên nghiệp tại Sài Gòn, viết cho website toilanguoisaigon.com.
Viết bài blog SEO-friendly bằng tiếng Việt có dấu đầy đủ.

TIÊU ĐỀ: ${topic.title}

YÊU CẦU:
- HTML (h2, h3, p, ul, li, strong, em). KHÔNG dùng h1.
- 1200-2000 từ, chia nhiều section với headings rõ ràng.
- Giọng tự nhiên, trẻ trung, như kể cho bạn bè. Không giọng quảng cáo.
- Mỗi quán: tên (in đậm), địa chỉ, giá, mô tả ngắn.
- Cuối bài có "Lời kết" tóm tắt.
- KHÔNG mở đầu bằng "Xin chào". Vào thẳng nội dung.
- KHÔNG thêm h1. KHÔNG bịa quán — chỉ dùng data bên dưới.
- Khi nhắc đến quán, tạo link HTML: <a href="/place/[slug]">[Tên quán]</a>
${specific}

DỮ LIỆU QUÁN ĂN:
${locationsText}

CHỈ TRẢ VỀ HTML. KHÔNG markdown wrapper.`;
}

// ─── Main ─────────────────────────────────────────────────────────────────

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    if (!GEMINI_API_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("Missing required environment variables.");
    }

    const body = await req.json().catch(() => ({}));
    const count = body.count || 2;

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const today = new Date().toISOString().split("T")[0];
    const dayOfWeek = new Date().toLocaleDateString("vi-VN", {
      weekday: "long",
    });

    // Get existing post slugs to avoid duplicates
    const { data: existingPosts } = await supabase
      .from("posts")
      .select("slug");
    const existingSlugs = new Set(
      (existingPosts || []).map((p: { slug: string }) => p.slug)
    );

    // Build topic pool and filter out already-published
    const allTopics = buildDailyTopics(today, dayOfWeek);
    const available = allTopics.filter(
      (t) => !existingSlugs.has(slugify(t.title))
    );

    if (available.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          message: "Tất cả topics hôm nay đã được publish.",
          generated: 0,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Pick topics to generate
    const selected = available.slice(0, count);
    const results: Array<{
      title: string;
      slug: string;
      success: boolean;
      error?: string;
    }> = [];

    for (const topic of selected) {
      const slug = slugify(topic.title);
      console.log(`[Blog] Generating: ${topic.title}`);

      try {
        // 1. Fetch locations based on filter
        let query = supabase
          .from("locations")
          .select(
            "name, slug, address, district, google_rating, google_review_count, price_range, google_review_summary"
          )
          .eq("status", "published");

        const f = topic.location_filter;
        if (f.column && f.op === "eq" && f.value) {
          query = query.eq(f.column, f.value);
        }
        if (f.text_search) {
          // Multiple patterns separated by |
          const patterns = f.text_search.split("|").map((p) => p.trim());
          // Use ilike with first pattern, then filter in memory for OR
          query = query.ilike("name", patterns[0]);
        }

        const orderCol = f.order_by || "average_rating";
        const orderAsc = orderCol === "created_at"; // newest first for created_at
        query = query
          .order(orderCol, { ascending: orderAsc, nullsFirst: false })
          .limit(f.limit || 12);

        const { data: locations, error: locError } = await query;
        if (locError) throw new Error(`DB error: ${locError.message}`);

        // If text_search has multiple patterns and first returned few, try broader
        let locs = locations || [];
        if (locs.length < 5 && f.text_search && f.text_search.includes("|")) {
          // Fallback: get top rated locations
          const { data: fallback } = await supabase
            .from("locations")
            .select(
              "name, slug, address, district, google_rating, google_review_count, price_range, google_review_summary"
            )
            .eq("status", "published")
            .order("average_rating", { ascending: false, nullsFirst: false })
            .limit(12);
          if (fallback && fallback.length > locs.length) {
            locs = fallback;
          }
        }

        if (locs.length === 0) {
          results.push({ title: topic.title, slug, success: false, error: "No locations found" });
          continue;
        }

        const locationsText = formatLocations(locs);
        const locationSlugs = locs
          .filter((l: Record<string, unknown>) => l.slug)
          .map((l: Record<string, unknown>) => l.slug as string)
          .slice(0, 15);

        // 2. Generate article via Gemini
        const prompt = buildPrompt(topic, locationsText);

        const geminiResp = await fetch(API_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ role: "user", parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: 0.8,
              maxOutputTokens: 8192,
            },
          }),
        });

        if (!geminiResp.ok) {
          const errText = await geminiResp.text();
          throw new Error(`Gemini ${geminiResp.status}: ${errText.substring(0, 200)}`);
        }

        const geminiData = await geminiResp.json();
        const contentParts = geminiData.candidates?.[0]?.content?.parts || [];
        let content = contentParts
          .filter((p: { text?: string }) => p.text)
          .map((p: { text: string }) => p.text)
          .join("");

        if (!content || content.length < 200) {
          throw new Error("Gemini returned empty/short content");
        }

        // Clean markdown wrappers
        content = content.replace(/^```html\s*/i, "").replace(/\s*```\s*$/, "");

        const readingTime = estimateReadingTime(content);

        // 3. Generate excerpt
        const excerptPrompt = `Viết đoạn tóm tắt hấp dẫn, tối đa 40 từ, tiếng Việt có dấu, cho bài: "${topic.title}". Khiến người đọc muốn click. Chỉ trả về nội dung.`;
        const excerptResp = await fetch(API_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ role: "user", parts: [{ text: excerptPrompt }] }],
            generationConfig: { temperature: 0.7, maxOutputTokens: 256 },
          }),
        });
        let excerpt = topic.meta_description.substring(0, 200);
        if (excerptResp.ok) {
          const excerptData = await excerptResp.json();
          const excerptText =
            excerptData.candidates?.[0]?.content?.parts?.[0]?.text;
          if (excerptText) {
            excerpt = excerptText.trim().replace(/^["']|["']$/g, "");
          }
        }

        // 4. Build meta_title
        let metaTitle = `${topic.title} | Tôi Là Người Sài Gòn`;
        if (metaTitle.length > 60) {
          metaTitle = topic.title.substring(0, 57) + "...";
        }

        // 5. Insert into DB
        const { error: insertError } = await supabase.from("posts").insert({
          title: topic.title,
          slug,
          content,
          excerpt: excerpt.substring(0, 300),
          status: "published",
          category: topic.category,
          tags: topic.tags,
          meta_title: metaTitle,
          meta_description: topic.meta_description.substring(0, 160),
          reading_time: readingTime,
          published_at: new Date().toISOString(),
          related_location_slugs: locationSlugs,
        });

        if (insertError) {
          throw new Error(`Insert error: ${insertError.message}`);
        }

        console.log(`[Blog] Published: /blog/${slug}`);
        results.push({ title: topic.title, slug, success: true });
      } catch (err) {
        console.error(`[Blog] Failed: ${topic.title}`, err);
        results.push({
          title: topic.title,
          slug,
          success: false,
          error: (err as Error).message,
        });
      }

      // Rate limit between articles
      await new Promise((r) => setTimeout(r, 3000));
    }

    const successCount = results.filter((r) => r.success).length;

    return new Response(
      JSON.stringify({
        success: successCount > 0,
        generated: successCount,
        total_attempted: results.length,
        results,
        date: today,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[Blog] Fatal:", error);
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
