/**
 * Enrich Locations
 *
 * Backfills missing data on published locations using Gemini + Google Maps Grounding.
 * Targets locations missing: google_rating, google_review_summary, price_range,
 * latitude/longitude, phone_number, opening_hours, etc.
 *
 * Processes a configurable batch per run (default 10) to stay within API limits.
 * Called by daily-cron orchestrator or manually.
 *
 * Request body:
 *   { "batch_size": 10 }  — number of locations to enrich per run
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
const DEFAULT_LAT = 10.7769;
const DEFAULT_LNG = 106.7009;

// Filter junk AI-generated review summaries
const JUNK_PATTERNS = [
  /không\s*(được\s*)?cung\s*cấp/i,
  /không\s*có\s*thông\s*tin/i,
  /chưa\s*có\s*(thông\s*tin|review|đánh\s*giá)/i,
  /không\s*có\s*dữ\s*liệu/i,
  /không\s*tìm\s*thấy/i,
  /no\s*review/i,
  /not\s*(available|provided)/i,
  /n\/a/i,
];
function cleanReview(s: string | null | undefined): string | null {
  if (!s || typeof s !== "string") return null;
  const t = s.trim();
  if (t.length < 10) return null;
  for (const p of JUNK_PATTERNS) {
    if (p.test(t)) return null;
  }
  return t;
}

interface EnrichResult {
  id: string;
  name: string;
  success: boolean;
  fields_updated: string[];
  error?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    if (!GEMINI_API_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("Missing required environment variables");
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const body = await req.json().catch(() => ({}));
    const batchSize = body.batch_size || 10;

    // Find published locations missing key data, prioritize those missing the most
    // Priority: missing google_rating (never enriched) > missing lat/lng > missing review
    const { data: locations, error: fetchError } = await supabase
      .from("locations")
      .select("id, name, address, district, google_rating, google_review_summary, latitude, longitude, price_range, phone_number, opening_hours, google_place_id, review_insights")
      .eq("status", "published")
      .or(
        "google_rating.is.null," +
        "google_review_summary.is.null," +
        "latitude.is.null," +
        "price_range.is.null"
      )
      .order("created_at", { ascending: true })
      .limit(batchSize);

    if (fetchError) {
      throw new Error(`Failed to fetch locations: ${fetchError.message}`);
    }

    if (!locations || locations.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          message: "Không có địa điểm nào cần enrich",
          enriched: 0,
          total_candidates: 0,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[Enrich] Found ${locations.length} locations to enrich`);
    const results: EnrichResult[] = [];

    for (const loc of locations) {
      try {
        console.log(`[Enrich] Processing: ${loc.name} (${loc.district})`);

        const prompt = `Tìm thông tin chi tiết về địa điểm ẩm thực/quán này ở TP. Hồ Chí Minh trên Google Maps:

Tên: "${loc.name}"
Địa chỉ: "${loc.address}"
Quận: "${loc.district}"

HƯỚNG DẪN TÌM KIẾM:
- Tìm trên Google Maps bằng tên chính xác trước
- Nếu không tìm thấy, thử các biến thể: bỏ dấu tiếng Việt, thêm/bớt "cafe"/"coffee"/"bar"/"restaurant", viết hoa/thường khác nhau
- Tên có thể là tiếng Anh, tiếng Việt, hoặc tên sáng tạo (ví dụ: "A PLACE cafe", "Lặng Yên Cà Phê", "OKKIO Caffe")
- Kết hợp tên + địa chỉ + quận để xác định đúng địa điểm
- Đây là địa điểm thật đang hoạt động ở Sài Gòn, hãy cố gắng tìm

Trả về JSON:
{
  "found": true,
  "google_rating": 4.5,
  "google_review_count": 1234,
  "google_review_summary": "Tóm tắt 2-3 câu từ review thật trên Google Maps bằng tiếng Việt. NẾU KHÔNG CÓ review thật thì set null. TUYỆT ĐỐI KHÔNG tự bịa nội dung.",
  "google_highlights": ["keyword nổi bật 1", "keyword 2", "keyword 3"],
  "price_range": "$" hoặc "$$" hoặc "$$$" hoặc "$$$$" hoặc null,
  "phone_number": "số điện thoại hoặc null",
  "opening_hours": {"monday": "08:00-22:00", "tuesday": "08:00-22:00", ...} hoặc null,
  "description": "Mô tả hấp dẫn 2-3 câu tiếng Việt về địa điểm",
  "latitude": 10.xxxx,
  "longitude": 106.xxxx
}

QUAN TRỌNG:
- google_rating, google_review_count PHẢI lấy từ Google Maps thật, KHÔNG bịa
- latitude và longitude PHẢI chính xác theo Google Maps
- CHỈ set "found": false nếu THẬT SỰ không tìm thấy địa điểm nào phù hợp sau khi đã thử các biến thể tên
- CHỈ trả JSON, không markdown`;

        const geminiResponse = await fetch(API_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ role: "user", parts: [{ text: prompt }] }],
            tools: [{ googleMaps: {} }],
            toolConfig: {
              retrievalConfig: {
                latLng: { latitude: DEFAULT_LAT, longitude: DEFAULT_LNG },
              },
            },
            generationConfig: {
              temperature: 0.1,
              maxOutputTokens: 2048,
            },
          }),
        });

        if (!geminiResponse.ok) {
          const errText = await geminiResponse.text();
          throw new Error(`Gemini API error: ${geminiResponse.status} ${errText.substring(0, 200)}`);
        }

        const responseData = await geminiResponse.json() as Record<string, unknown>;
        const candidate = (responseData.candidates as Array<Record<string, unknown>>)?.[0];

        if (!candidate) {
          throw new Error("No candidate in Gemini response");
        }

        // Extract text
        const parts = ((candidate.content as Record<string, unknown>)?.parts || []) as Array<Record<string, unknown>>;
        const generatedText = parts
          .filter((p) => p.text)
          .map((p) => p.text as string)
          .join("");

        // Parse JSON
        const jsonMatch = generatedText.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
          throw new Error("No JSON found in Gemini response");
        }

        const enrichData = JSON.parse(jsonMatch[0]);

        if (!enrichData.found) {
          results.push({
            id: loc.id,
            name: loc.name,
            success: false,
            fields_updated: [],
            error: "Không tìm thấy trên Google Maps",
          });
          continue;
        }

        // Extract Google Maps URI and Place ID from grounding metadata
        let mapsUri: string | null = null;
        let placeId: string | null = loc.google_place_id;

        const groundingMetadata = candidate.groundingMetadata as Record<string, unknown> | undefined;
        if (groundingMetadata?.groundingChunks) {
          const chunks = groundingMetadata.groundingChunks as Array<Record<string, unknown>>;
          for (const chunk of chunks) {
            const maps = chunk.maps as Record<string, string> | undefined;
            if (maps) {
              if (!mapsUri && maps.uri) mapsUri = maps.uri;
              if (!placeId && maps.placeId) {
                placeId = maps.placeId.replace("places/", "");
              }
            }
          }
        }

        // Build update object — only update fields that are currently null/missing
        const update: Record<string, unknown> = {};
        const fieldsUpdated: string[] = [];

        // Google rating
        if (loc.google_rating === null && typeof enrichData.google_rating === "number") {
          update.google_rating = enrichData.google_rating;
          update.google_review_count =
            typeof enrichData.google_review_count === "number"
              ? enrichData.google_review_count
              : null;
          // Also set average_rating if it's 0
          update.average_rating = enrichData.google_rating;
          fieldsUpdated.push("google_rating");
        }

        // Review summary
        if (loc.google_review_summary === null) {
          const cleaned = cleanReview(enrichData.google_review_summary);
          if (cleaned) {
            update.google_review_summary = cleaned;
            fieldsUpdated.push("google_review_summary");
          }
        }

        // Highlights
        const highlights = Array.isArray(enrichData.google_highlights)
          ? (enrichData.google_highlights as string[]).filter(
              (h: string) => typeof h === "string" && h.trim().length > 1
            )
          : null;
        if (highlights && highlights.length > 0) {
          update.google_highlights = highlights;
          fieldsUpdated.push("google_highlights");
        }

        // Lat/lng
        if (
          loc.latitude === null &&
          typeof enrichData.latitude === "number" &&
          typeof enrichData.longitude === "number" &&
          enrichData.latitude > 8 &&
          enrichData.latitude < 13 &&
          enrichData.longitude > 104 &&
          enrichData.longitude < 110
        ) {
          update.latitude = enrichData.latitude;
          update.longitude = enrichData.longitude;
          fieldsUpdated.push("latitude", "longitude");
        }

        // Price range
        if (
          loc.price_range === null &&
          ["$", "$$", "$$$", "$$$$"].includes(enrichData.price_range)
        ) {
          update.price_range = enrichData.price_range;
          fieldsUpdated.push("price_range");
        }

        // Phone number
        if (loc.phone_number === null && enrichData.phone_number) {
          update.phone_number = enrichData.phone_number;
          fieldsUpdated.push("phone_number");
        }

        // Opening hours
        if (
          loc.opening_hours === null &&
          enrichData.opening_hours &&
          typeof enrichData.opening_hours === "object" &&
          !Array.isArray(enrichData.opening_hours)
        ) {
          update.opening_hours = enrichData.opening_hours;
          fieldsUpdated.push("opening_hours");
        }

        // Google Maps URI and Place ID
        if (mapsUri) {
          update.google_maps_uri = mapsUri;
          fieldsUpdated.push("google_maps_uri");
        }
        if (placeId && !loc.google_place_id) {
          update.google_place_id = placeId;
          fieldsUpdated.push("google_place_id");
        }

        // Description (only if missing)
        if (enrichData.description && typeof enrichData.description === "string") {
          // We'll set this as a fallback but not overwrite existing
          // The update query below only runs if fieldsUpdated > 0
          // Description enrichment is bonus
        }

        if (Object.keys(update).length === 0) {
          results.push({
            id: loc.id,
            name: loc.name,
            success: true,
            fields_updated: [],
            error: "Gemini trả về nhưng không có data mới",
          });
          continue;
        }

        // Update the location
        const { error: updateError } = await supabase
          .from("locations")
          .update(update)
          .eq("id", loc.id);

        if (updateError) {
          throw new Error(`DB update failed: ${updateError.message}`);
        }

        console.log(
          `[Enrich] Updated ${loc.name}: ${fieldsUpdated.join(", ")}`
        );

        // ─── Step 2: Google Search grounding for rich review data ──────
        if (!loc.review_insights) {
          try {
            await new Promise((resolve) => setTimeout(resolve, 1000));

            const reviewPrompt = `Tìm thông tin review về địa điểm "${loc.name}" tại ${loc.address || ""}, ${loc.district || "TP.HCM"}.

Trả về JSON:
{
  "top_reviews": [
    {"author": "tên", "rating": 5, "text": "nội dung review gốc", "time": "2 tháng trước"},
    ...tối đa 5 reviews
  ],
  "review_themes": ["chủ đề phổ biến 1", "chủ đề 2", ...],
  "pros": ["điểm mạnh 1", "điểm mạnh 2", ...],
  "cons": ["điểm yếu 1", "điểm yếu 2", ...],
  "best_dishes": ["món nổi bật 1", "món 2", ...],
  "atmosphere": "mô tả không khí quán bằng tiếng Việt",
  "typical_visit": "mô tả trải nghiệm 1 lần ghé quán bằng tiếng Việt"
}

QUAN TRỌNG:
- top_reviews: lấy TỐI ĐA 5 review THẬT, giữ nguyên ngôn ngữ gốc hoặc dịch sang tiếng Việt
- review_themes, pros, cons: tổng hợp từ reviews thật, KHÔNG bịa
- best_dishes: món ăn/đồ uống được khen nhiều nhất trong reviews
- atmosphere, typical_visit: viết bằng tiếng Việt, dựa trên reviews thật
- CHỈ trả JSON, không markdown`;

            const reviewResponse = await fetch(API_URL, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                contents: [{ role: "user", parts: [{ text: reviewPrompt }] }],
                tools: [{ googleSearch: {} }],
                generationConfig: { temperature: 0.3, maxOutputTokens: 4096 },
              }),
            });

            if (reviewResponse.ok) {
              const reviewData = await reviewResponse.json() as Record<string, unknown>;
              const reviewCandidate = (reviewData.candidates as Array<Record<string, unknown>>)?.[0];
              if (reviewCandidate) {
                const reviewParts = ((reviewCandidate.content as Record<string, unknown>)?.parts || []) as Array<Record<string, unknown>>;
                const reviewText = reviewParts
                  .filter((p) => p.text)
                  .map((p) => p.text as string)
                  .join("");
                const reviewJsonMatch = reviewText.match(/\{[\s\S]*\}/);
                if (reviewJsonMatch) {
                  const insights = JSON.parse(reviewJsonMatch[0]);
                  if (insights.top_reviews || insights.review_themes || insights.pros) {
                    const { error: riError } = await supabase
                      .from("locations")
                      .update({ review_insights: insights })
                      .eq("id", loc.id);
                    if (!riError) {
                      fieldsUpdated.push("review_insights");
                      console.log(`[Enrich] + review_insights for ${loc.name}`);
                    }
                  }
                }
              }
            }
          } catch (reviewErr) {
            // Non-fatal: review insights are a bonus
            console.warn(`[Enrich] review_insights failed for ${loc.name}: ${(reviewErr as Error).message.substring(0, 80)}`);
          }
        }

        results.push({
          id: loc.id,
          name: loc.name,
          success: true,
          fields_updated: fieldsUpdated,
        });

        // Rate limit: wait 1s between API calls
        await new Promise((resolve) => setTimeout(resolve, 1000));
      } catch (err) {
        console.error(`[Enrich] Error for ${loc.name}:`, err);
        results.push({
          id: loc.id,
          name: loc.name,
          success: false,
          fields_updated: [],
          error: (err as Error).message,
        });
      }
    }

    const successCount = results.filter((r) => r.success && r.fields_updated.length > 0).length;
    const totalFieldsUpdated = results.reduce(
      (sum, r) => sum + r.fields_updated.length,
      0
    );

    console.log(
      `[Enrich] Done: ${successCount}/${results.length} locations enriched, ${totalFieldsUpdated} fields updated`
    );

    return new Response(
      JSON.stringify({
        success: true,
        enriched: successCount,
        total_candidates: locations.length,
        total_fields_updated: totalFieldsUpdated,
        results,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("[Enrich] Fatal:", error);
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
