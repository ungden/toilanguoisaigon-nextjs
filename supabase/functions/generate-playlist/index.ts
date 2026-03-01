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
  for (const p of JUNK_PATTERNS) { if (p.test(t)) return null; }
  return t;
}

// HCMC coordinates
const DEFAULT_LAT = 10.7769;
const DEFAULT_LNG = 106.7009;

const MOODS = [
  "morning",
  "lunch",
  "dinner",
  "late-night",
  "rainy-day",
  "weekend",
  "date-night",
  "family",
  "budget",
  "premium",
  "adventure",
  "comfort",
  "healthy",
  "street-food",
  "seasonal",
];

// ─── Helpers ──────────────────────────────────────────────────────────────

function slugify(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function todayStr(): string {
  return new Date().toISOString().split("T")[0];
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
    const mood = body.mood || null; // optional: force specific mood
    const count = body.count || 3; // how many playlists to generate
    const autoPublish = body.auto_publish ?? false;

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Step 1: Get all published locations from DB
    const { data: existingLocations, error: locError } = await supabase
      .from("locations")
      .select("id, name, slug, address, district, description, price_range, average_rating, main_image_url")
      .eq("status", "published")
      .order("average_rating", { ascending: false })
      .limit(200);

    if (locError) throw new Error(`DB error: ${locError.message}`);

    const locationNames = (existingLocations || [])
      .map((l) => `- ${l.name} (${l.district}, ${l.price_range || "?"})`)
      .join("\n");

    const today = todayStr();
    const dayOfWeek = new Date().toLocaleDateString("vi-VN", { weekday: "long" });
    const month = new Date().toLocaleDateString("vi-VN", { month: "long" });

    // Step 2: Call Gemini to generate playlist ideas
    const prompt = `Bạn là một food curator chuyên nghiệp tại Sài Gòn, chuyên tạo các "playlist ẩm thực" hàng ngày - giống như Spotify nhưng cho đồ ăn.

Hôm nay là ${dayOfWeek}, ngày ${today}, tháng ${month}.

${mood ? `Tâm trạng/chủ đề yêu cầu: "${mood}"` : "Hãy tự chọn chủ đề phù hợp với ngày hôm nay (thời tiết, ngày trong tuần, mùa, trend, sự kiện...)."}

Dưới đây là danh sách các địa điểm đã có trong hệ thống:
${locationNames || "(Chưa có địa điểm nào)"}

Hãy tạo ${count} playlist ẩm thực, mỗi playlist gồm 5-8 địa điểm.

QUY TẮC QUAN TRỌNG:
1. ƯU TIÊN chọn địa điểm từ danh sách có sẵn ở trên (match bằng tên chính xác).
2. Nếu không đủ địa điểm phù hợp trong DB, BỔ SUNG thêm địa điểm mới từ kiến thức của bạn về Sài Gòn.
3. Mỗi playlist phải có tên sáng tạo, hấp dẫn, ngắn gọn (kiểu Spotify playlist name).
4. Mô tả playlist ngắn gọn, gợi cảm, 2-3 câu.
5. Chọn mood phù hợp từ danh sách: ${MOODS.join(", ")}.
6. Chọn 1 emoji đại diện cho playlist.

Trả kết quả dưới dạng JSON array:
[
  {
    "title": "Tên playlist sáng tạo",
    "description": "Mô tả ngắn gọn hấp dẫn",
    "mood": "mood_value",
    "emoji": "🍜",
    "locations": [
      {
        "name": "Tên chính xác của địa điểm",
        "is_existing": true,
        "address": "địa chỉ (chỉ cần nếu là địa điểm mới)",
        "district": "quận (chỉ cần nếu là địa điểm mới)",
        "description": "ghi chú ngắn 1 câu tại sao nên đến đây trong context playlist này, CÓ THỂ đề cập điểm nổi bật từ review Google nếu có (ví dụ: 'Rated 4.7 trên Google, nổi tiếng với phở bò tái lăn')",
        "price_range": "$ hoặc $$ hoặc $$$ hoặc $$$$",
        "google_rating": 4.5,
        "google_review_count": 500,
        "google_review_summary": "tóm tắt ngắn gọn nhận xét nổi bật từ Google reviews (chỉ cho địa điểm mới, NẾU KHÔNG CÓ review thật thì set null)",
        "google_highlights": ["keyword1", "keyword2"]
      }
    ]
  }
]

CHỈ trả về JSON, không markdown code block.`;

    // Call Gemini WITH Google Maps grounding for new location suggestions
    const geminiRequest = {
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      tools: [{ googleMaps: {} }],
      toolConfig: {
        retrievalConfig: {
          latLng: { latitude: DEFAULT_LAT, longitude: DEFAULT_LNG },
        },
      },
      generationConfig: {
        temperature: 0.8, // higher creativity for playlist names
        maxOutputTokens: 8192,
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
    const candidate = responseData.candidates?.[0];
    if (!candidate) throw new Error("Không nhận được kết quả từ Gemini.");

    // Concatenate all text parts (Gemini may split long responses)
    const generatedText = (candidate.content?.parts || [])
      .filter((p: { text?: string }) => p.text)
      .map((p: { text: string }) => p.text)
      .join("");

    // Parse JSON — handle multiple blocks and truncated output
    const jsonBlocks: string[] = [];
    const blockPattern = /```json\s*([\s\S]*?)(?:```|$)/g;
    let blockMatch: RegExpExecArray | null;
    while ((blockMatch = blockPattern.exec(generatedText)) !== null) {
      jsonBlocks.push(blockMatch[1].trim());
    }
    if (jsonBlocks.length === 0) {
      jsonBlocks.push(generatedText.trim());
    }

    const tryParseArray = (text: string): unknown[] | null => {
      try {
        const p = JSON.parse(text);
        return Array.isArray(p) ? p : [p];
      } catch {
        let pos = text.length;
        for (let i = 0; i < 50; i++) {
          pos = text.lastIndexOf("}", pos - 1);
          if (pos <= 0) break;
          try {
            const p = JSON.parse(text.substring(0, pos + 1) + "\n]");
            return Array.isArray(p) ? p : [p];
          } catch { /* continue */ }
        }
        return null;
      }
    };

    let bestResult: unknown[] | null = null;
    for (const block of jsonBlocks) {
      const result = tryParseArray(block);
      if (result && (!bestResult || result.length > bestResult.length)) {
        bestResult = result;
      }
    }

    if (!bestResult || bestResult.length === 0) {
      throw new Error("Không thể parse kết quả từ Gemini.");
    }
    const playlistsArray = bestResult;

    // Step 3: Process each playlist and save to collections table
    const createdCollections = [];

    for (const pl of playlistsArray as Record<string, any>[]) {
      const baseSlug = slugify(pl.title);
      const slug = `${baseSlug}-${today}`;

      // Check if slug exists in collections
      const { data: existingCollection } = await supabase
        .from("collections")
        .select("id")
        .eq("slug", slug)
        .maybeSingle();

      if (existingCollection) {
        continue; // skip duplicate
      }

      // Create collection with source='ai'
      const { data: newCollection, error: colError } = await supabase
        .from("collections")
        .insert({
          title: pl.title,
          slug,
          description: pl.description || null,
          mood: MOODS.includes(pl.mood) ? pl.mood : null,
          emoji: pl.emoji || null,
          status: autoPublish ? "published" : "draft",
          is_featured: false,
          generated_date: today,
          ai_context: `Query: ${mood || "auto"}, Date: ${today}, Day: ${dayOfWeek}`,
          source: "ai",
        })
        .select("id")
        .single();

      if (colError || !newCollection) {
        console.error(`Failed to create collection "${pl.title}":`, colError);
        continue;
      }

      // Match locations and create collection_locations
      const collectionLocations = [];
      const newLocationsToCreate = [];

      for (let i = 0; i < (pl.locations || []).length; i++) {
        const loc = pl.locations[i];

        // Try to find existing location by name (fuzzy match)
        const matchedExisting = (existingLocations || []).find(
          (el) => el.name.toLowerCase() === (loc.name || "").toLowerCase()
        );

        if (matchedExisting) {
          collectionLocations.push({
            collection_id: newCollection.id,
            location_id: matchedExisting.id,
            position: i,
            ai_note: loc.description || null,
          });
        } else {
          // New location from Google Maps / Gemini knowledge
          newLocationsToCreate.push({
            index: i,
            data: loc,
          });
        }
      }

      // Create new locations that don't exist yet
      for (const newLoc of newLocationsToCreate) {
        const locSlug = slugify(newLoc.data.name);

        // Check if slug exists
        const { data: existingBySlug } = await supabase
          .from("locations")
          .select("id")
          .eq("slug", locSlug)
          .maybeSingle();

        if (existingBySlug) {
          // Already exists with this slug, use it
          collectionLocations.push({
            collection_id: newCollection.id,
            location_id: existingBySlug.id,
            position: newLoc.index,
            ai_note: newLoc.data.description || null,
          });
          continue;
        }

        // Parse google_highlights
        let highlights = null;
        if (Array.isArray(newLoc.data.google_highlights)) {
          highlights = newLoc.data.google_highlights.filter(
            (h: unknown) => typeof h === "string"
          );
          if (highlights.length === 0) highlights = null;
        }

        const { data: createdLoc, error: locCreateErr } = await supabase
          .from("locations")
          .insert({
            name: newLoc.data.name,
            slug: locSlug,
            address: newLoc.data.address || "",
            district: newLoc.data.district || "",
            description: newLoc.data.description || null,
            price_range: ["$", "$$", "$$$", "$$$$"].includes(newLoc.data.price_range)
              ? newLoc.data.price_range
              : null,
            google_rating:
              typeof newLoc.data.google_rating === "number"
                ? newLoc.data.google_rating
                : null,
            google_review_count:
              typeof newLoc.data.google_review_count === "number"
                ? newLoc.data.google_review_count
                : null,
            google_review_summary: cleanReview(newLoc.data.google_review_summary),
            google_highlights: highlights,
            status: "draft",
            average_rating: 0,
            review_count: 0,
          })
          .select("id")
          .single();

        if (!locCreateErr && createdLoc) {
          collectionLocations.push({
            collection_id: newCollection.id,
            location_id: createdLoc.id,
            position: newLoc.index,
            ai_note: newLoc.data.description || null,
          });
        }
      }

      // Insert collection_locations
      if (collectionLocations.length > 0) {
        const { error: colLocError } = await supabase
          .from("collection_locations")
          .insert(collectionLocations);

        if (colLocError) {
          console.error(`Failed to add locations to collection:`, colLocError);
        }
      }

      createdCollections.push({
        id: newCollection.id,
        title: pl.title,
        slug,
        mood: pl.mood,
        emoji: pl.emoji,
        location_count: collectionLocations.length,
        new_locations_created: newLocationsToCreate.length,
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        collections: createdCollections,
        total: createdCollections.length,
        date: today,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
