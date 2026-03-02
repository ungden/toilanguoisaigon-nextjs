/**
 * Enrich Locations — Local CLI Script
 *
 * Backfills missing Google Maps data on published locations using Gemini AI.
 *
 * Usage:
 *   export SUPABASE_URL="https://xxx.supabase.co"
 *   export SUPABASE_SERVICE_ROLE_KEY="eyJ..."
 *   export GEMINI_API_KEY="AI..."
 *   npx tsx scripts/enrich-locations.ts
 *   npx tsx scripts/enrich-locations.ts --batch 20
 *   npx tsx scripts/enrich-locations.ts --dry-run
 */

import { createClient } from "@supabase/supabase-js";

// ─── Config ──────────────────────────────────────────────────────────────

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !GEMINI_API_KEY) {
  console.error("Missing env vars. Required: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, GEMINI_API_KEY");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
const GEMINI_MODEL = "gemini-2.5-flash";
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;
const DEFAULT_LAT = 10.7769;
const DEFAULT_LNG = 106.7009;

// ─── Args ────────────────────────────────────────────────────────────────

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const batchIdx = args.indexOf("--batch");
const batchSize = batchIdx !== -1 ? parseInt(args[batchIdx + 1], 10) || 10 : 10;

// ─── Junk filter ─────────────────────────────────────────────────────────

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
  for (const p of JUNK_PATTERNS) { if (p.test(t)) return null; }
  return t;
}

// ─── Helpers ─────────────────────────────────────────────────────────────

function logOk(msg: string) { console.log(`  ✅ ${msg}`); }
function logWarn(msg: string) { console.log(`  ⚠️  ${msg}`); }
function logError(msg: string) { console.error(`  ❌ ${msg}`); }

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ─── Main ────────────────────────────────────────────────────────────────

async function main() {
  console.log(`\n🔍 Enrich Locations — Batch size: ${batchSize}, Dry run: ${dryRun}\n`);

  // Find locations missing key data
  const { data: locations, error: fetchError } = await supabase
    .from("locations")
    .select("id, name, address, district, google_rating, google_review_summary, latitude, longitude, price_range, phone_number, opening_hours, google_place_id, description, review_insights")
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
    logError(`Failed to fetch: ${fetchError.message}`);
    process.exit(1);
  }

  if (!locations || locations.length === 0) {
    console.log("✨ Tất cả locations đã có đủ data, không cần enrich!\n");
    return;
  }

  console.log(`📋 Tìm thấy ${locations.length} locations cần enrich:\n`);

  // Show what's missing
  for (const loc of locations) {
    const missing: string[] = [];
    if (loc.google_rating === null) missing.push("rating");
    if (loc.google_review_summary === null) missing.push("review");
    if (loc.latitude === null) missing.push("lat/lng");
    if (loc.price_range === null) missing.push("price");
    if (loc.phone_number === null) missing.push("phone");
    console.log(`  📍 ${loc.name} (${loc.district}) — thiếu: ${missing.join(", ")}`);
  }
  console.log("");

  let enriched = 0;
  let failed = 0;
  let totalFields = 0;

  for (let i = 0; i < locations.length; i++) {
    const loc = locations[i];
    console.log(`[${i + 1}/${locations.length}] ${loc.name} (${loc.district})`);

    try {
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
        throw new Error(`Gemini API ${geminiResponse.status}: ${errText.substring(0, 200)}`);
      }

      const responseData = await geminiResponse.json();
      const candidate = responseData.candidates?.[0];
      if (!candidate) throw new Error("No candidate in response");

      // Extract text
      const parts = candidate.content?.parts || [];
      const generatedText = parts
        .filter((p: { text?: string }) => p.text)
        .map((p: { text: string }) => p.text)
        .join("");

      // Parse JSON
      const jsonMatch = generatedText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error("No JSON in response");

      const data = JSON.parse(jsonMatch[0]);

      if (!data.found) {
        logWarn("Không tìm thấy trên Google Maps");
        failed++;
        continue;
      }

      // Extract grounding metadata
      let mapsUri: string | null = null;
      let placeId: string | null = loc.google_place_id;
      if (candidate.groundingMetadata?.groundingChunks) {
        for (const chunk of candidate.groundingMetadata.groundingChunks) {
          if (chunk.maps) {
            if (!mapsUri && chunk.maps.uri) mapsUri = chunk.maps.uri;
            if (!placeId && chunk.maps.placeId) {
              placeId = chunk.maps.placeId.replace("places/", "");
            }
          }
        }
      }

      // Build update
      const update: Record<string, unknown> = {};
      const fields: string[] = [];

      if (loc.google_rating === null && typeof data.google_rating === "number") {
        update.google_rating = data.google_rating;
        update.google_review_count = typeof data.google_review_count === "number" ? data.google_review_count : null;
        update.average_rating = data.google_rating;
        fields.push(`rating: ${data.google_rating}`);
      }

      if (loc.google_review_summary === null) {
        const cleaned = cleanReview(data.google_review_summary);
        if (cleaned) {
          update.google_review_summary = cleaned;
          fields.push(`review: "${cleaned.substring(0, 50)}..."`);
        }
      }

      const highlights = Array.isArray(data.google_highlights)
        ? data.google_highlights.filter((h: string) => typeof h === "string" && h.trim().length > 1)
        : null;
      if (highlights && highlights.length > 0) {
        update.google_highlights = highlights;
        fields.push(`highlights: [${highlights.join(", ")}]`);
      }

      if (loc.latitude === null && typeof data.latitude === "number" && typeof data.longitude === "number"
        && data.latitude > 8 && data.latitude < 13 && data.longitude > 104 && data.longitude < 110) {
        update.latitude = data.latitude;
        update.longitude = data.longitude;
        fields.push(`lat/lng: ${data.latitude}, ${data.longitude}`);
      }

      if (loc.price_range === null && ["$", "$$", "$$$", "$$$$"].includes(data.price_range)) {
        update.price_range = data.price_range;
        fields.push(`price: ${data.price_range}`);
      }

      if (loc.phone_number === null && data.phone_number) {
        update.phone_number = data.phone_number;
        fields.push(`phone: ${data.phone_number}`);
      }

      if (loc.opening_hours === null && data.opening_hours && typeof data.opening_hours === "object" && !Array.isArray(data.opening_hours)) {
        update.opening_hours = data.opening_hours;
        fields.push("hours");
      }

      if (!loc.description && data.description && typeof data.description === "string" && data.description.length > 20) {
        update.description = data.description;
        fields.push("description");
      }

      if (mapsUri) {
        update.google_maps_uri = mapsUri;
        fields.push("maps_uri");
      }
      if (placeId && !loc.google_place_id) {
        update.google_place_id = placeId;
        fields.push("place_id");
      }

      if (Object.keys(update).length === 0) {
        logWarn("Gemini trả về nhưng không có data mới");
        continue;
      }

      if (dryRun) {
        logOk(`[DRY RUN] Sẽ update: ${fields.join(" | ")}`);
      } else {
        const { error: updateError } = await supabase
          .from("locations")
          .update(update)
          .eq("id", loc.id);

        if (updateError) throw new Error(`DB update: ${updateError.message}`);
        logOk(`Updated: ${fields.join(" | ")}`);
      }

      enriched++;
      totalFields += fields.length;

      // ─── Step 2: Google Search grounding for rich review data ──────
      // Only run if we don't have review_insights yet
      if (!loc.review_insights) {
        try {
          await sleep(1000); // Rate limit between steps

          const reviewPrompt = `Tìm địa điểm "${loc.name}" tại ${loc.address || ""}, ${loc.district || "TP.HCM"} trên Google Maps.

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
            const reviewData = await reviewResponse.json();
            const reviewParts = reviewData.candidates?.[0]?.content?.parts || [];
            const reviewText = reviewParts
              .filter((p: { text?: string }) => p.text)
              .map((p: { text: string }) => p.text)
              .join("");
            const reviewJsonMatch = reviewText.match(/\{[\s\S]*\}/);
            if (reviewJsonMatch) {
              const insights = JSON.parse(reviewJsonMatch[0]);
              // Validate structure
              if (insights.top_reviews || insights.review_themes || insights.pros) {
                if (!dryRun) {
                  await supabase.from("locations").update({ review_insights: insights }).eq("id", loc.id);
                }
                const reviewCount = (insights.top_reviews || []).length;
                const themeCount = (insights.review_themes || []).length;
                logOk(`  + review_insights: ${reviewCount} reviews, ${themeCount} themes, ${(insights.pros || []).length} pros, ${(insights.cons || []).length} cons`);
                totalFields++;
              }
            }
          }
        } catch (reviewErr) {
          // Non-fatal: review insights are a bonus
          logWarn(`  review_insights failed: ${(reviewErr as Error).message.substring(0, 80)}`);
        }
      }

      // Rate limit
      if (i < locations.length - 1) {
        await sleep(1500);
      }
    } catch (err) {
      logError((err as Error).message);
      failed++;
    }
  }

  console.log(`\n📊 Kết quả:`);
  console.log(`   Enriched: ${enriched}/${locations.length}`);
  console.log(`   Failed:   ${failed}`);
  console.log(`   Fields:   ${totalFields} fields updated`);
  if (dryRun) console.log(`   (Dry run — không có gì được lưu)`);
  console.log("");
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
