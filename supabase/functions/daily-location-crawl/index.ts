/**
 * Daily Location Crawl
 *
 * Automatically discovers new food locations in HCMC via Google Maps,
 * inserts them as "draft" status, auto-categorizes and auto-assigns to collections.
 *
 * Flow:
 *   1. Pick random search queries from a rotating pool
 *   2. Call Gemini + Google Maps Grounding to find locations
 *   3. Deduplicate against existing DB (by slug or google_place_id)
 *   4. Insert new locations as status: "draft"
 *   5. Auto-categorize (match name keywords → categories)
 *   6. Auto-tag (match attributes → tags)
 *   7. Auto-assign to matching collections
 *
 * Called by daily-cron orchestrator.
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
const DEFAULT_LAT = 10.7769;
const DEFAULT_LNG = 106.7009;

// ─── Rotating query pool ────────────────────────────────────────────────
// Each day picks a subset to avoid re-crawling the same queries
const QUERY_POOL = [
  // By food type
  "quán phở ngon mới mở Sài Gòn",
  "bún bò Huế ngon quận 1 quận 3",
  "cơm tấm ngon nhất Sài Gòn 2025",
  "bánh mì ngon Sài Gòn",
  "quán cà phê mới mở đẹp Sài Gòn",
  "quán ốc hải sản ngon Sài Gòn",
  "quán lẩu nướng ngon giá rẻ Sài Gòn",
  "quán chè ngon truyền thống Sài Gòn",
  "hủ tiếu Nam Vang ngon Sài Gòn",
  "quán chay ngon Sài Gòn",
  "quán nhậu bình dân ngon Sài Gòn",
  "bánh canh cua ngon Sài Gòn",
  "quán cháo ngon khuya Sài Gòn",
  "xôi ngon buổi sáng Sài Gòn",
  "quán kem gelato ngon Sài Gòn",
  "trà sữa ngon Sài Gòn",
  // By district
  "quán ăn ngon quận Bình Thạnh",
  "quán ăn ngon quận Phú Nhuận",
  "quán ăn ngon Thủ Đức",
  "quán ăn ngon quận 7",
  "quán ăn ngon quận Tân Bình",
  "quán ăn ngon quận Gò Vấp",
  "quán ăn ngon quận 2 Thảo Điền",
  "quán ăn ngon quận 5 Chợ Lớn",
  "quán ăn ngon quận 10",
  "quán ăn ngon quận 4 vỉa hè",
  // By style / occasion
  "nhà hàng fine dining mới Sài Gòn",
  "quán ăn vỉa hè đánh giá cao Sài Gòn",
  "quán cà phê rooftop view đẹp Sài Gòn",
  "quán ăn gia đình cuối tuần Sài Gòn",
  "quán ăn khuya 24h Sài Gòn",
  "quán ăn sáng ngon bổ rẻ Sài Gòn",
  "quán brunch mới mở Sài Gòn",
  "quán nướng BBQ Hàn Quốc Sài Gòn",
  "quán ăn Nhật ngon Sài Gòn",
  "quán ăn Thái ngon Sài Gòn",
  "pizza pasta ngon Sài Gòn",
  "quán pet friendly Sài Gòn",
  "quán có phòng riêng Sài Gòn",
  "quán live music Sài Gòn",
];

// ─── Category keyword mapping (matches seed-categories-tags.py) ─────────
const CATEGORY_KEYWORDS: Record<string, string[]> = {
  "pho": ["phở", "pho"],
  "bun": ["bún", "bun"],
  "com": ["cơm", "com tấm", "cơm tấm", "com tam"],
  "banh-mi": ["bánh mì", "banh mi", "bánh mỳ"],
  "cafe": ["cà phê", "cafe", "coffee", "cà fê", "ca phe", "caffe", "cappuccino"],
  "oc-hai-san": ["ốc", "ghẹ", "cua", "hải sản", "seafood"],
  "lau-nuong": ["lẩu", "lau", "hotpot", "nướng", "bbq", "buffet nướng"],
  "che-trang-mieng": ["chè", "kem", "bánh", "dessert", "sinh tố", "trà sữa", "nước ép"],
  "hu-tieu-mi": ["hủ tiếu", "hủ tíu", "hu tieu", "mì "],
  "chay": ["chay", "vegetarian", "zen"],
  "nhau-bia": ["nhậu", "bia", "beer", "quán nhậu"],
  "banh-canh": ["bánh canh"],
  "chao": ["cháo"],
  "banh-cuon": ["bánh cuốn"],
  "xoi": ["xôi"],
  "goi-cuon-nem": ["gỏi cuốn", "nem"],
  "nha-hang": ["nhà hàng", "restaurant"],
  "kem-gelato": ["kem", "gelato", "ice cream"],
  "nuoc-uong-sinh-to": ["nước", "sinh tố", "smoothie", "juice"],
  "mon-quoc-te": ["pizza", "pasta", "steak", "burger", "sushi", "ramen", "korean", "nhật", "hàn", "thái"],
};

// ─── Tag keyword mapping ────────────────────────────────────────────────
const TAG_KEYWORDS: Record<string, string[]> = {
  "an-sang": ["sáng", "breakfast", "morning"],
  "an-trua": ["trưa", "lunch"],
  "an-toi": ["tối", "dinner"],
  "an-khuya": ["khuya", "24h", "đêm", "midnight"],
  "binh-dan": ["bình dân", "giá rẻ", "vỉa hè"],
  "sang-trong": ["sang trọng", "fine dining", "premium", "luxury"],
  "quan-via-he": ["vỉa hè", "hẻm", "lề đường", "street food"],
  "co-wifi": ["wifi"],
  "co-may-lanh": ["máy lạnh", "air con"],
  "giao-hang": ["giao hàng", "delivery"],
  "co-cho-dau-xe": ["đậu xe", "parking"],
  "view-dep": ["view", "rooftop", "sky", "terrace"],
  "pet-friendly": ["pet", "thú cưng", "dog", "cat"],
};

// ─── Collection matching rules (matches populate-collection-locations.py) ─
const COLLECTION_RULES: Record<string, {
  category_slugs?: string[];
  tag_slugs?: string[];
  name_keywords?: string[];
  price_ranges?: string[];
  min_rating?: number;
}> = {
  "saigon-khong-ngu": { tag_slugs: ["an-khuya"], name_keywords: ["đêm", "khuya", "24h"] },
  "bua-sang-nap-nang-luong": { tag_slugs: ["an-sang"], category_slugs: ["pho", "bun", "banh-mi", "xoi", "banh-cuon", "chao", "hu-tieu-mi"] },
  "com-trua-van-phong-chat-lu": { tag_slugs: ["an-trua"], category_slugs: ["com"] },
  "bua-toi-chill-chill": { tag_slugs: ["an-toi"], price_ranges: ["$$", "$$$"] },
  "via-he-tinh-hoa": { tag_slugs: ["quan-via-he", "binh-dan"], min_rating: 4.0 },
  "rooftop-long-gio-view-bac-ty": { tag_slugs: ["view-dep", "sang-trong"], price_ranges: ["$$$", "$$$$"] },
  "xanh-muot-mat-cafe-san-vuon": { category_slugs: ["cafe"], name_keywords: ["sân vườn", "garden", "xanh"] },
  "check-in-song-ao-trieu-like": { name_keywords: ["decor", "art", "concept", "sống ảo"] },
  "goc-rieng-cho-hai-nguoi": { name_keywords: ["hẹn hò", "romantic", "riêng tư"], price_ranges: ["$$", "$$$", "$$$$"] },
  "hop-nhom-cang-dong-cang-vui": { category_slugs: ["lau-nuong", "nhau-bia"], name_keywords: ["lẩu", "nướng", "bbq", "buffet"] },
  "workstation-ly-tuong": { tag_slugs: ["co-wifi"], category_slugs: ["cafe"] },
  "mot-minh-van-chill": { category_slugs: ["cafe", "pho", "bun", "com", "banh-mi"], min_rating: 4.0 },
  "finedining": { tag_slugs: ["sang-trong"], category_slugs: ["nha-hang", "mon-quoc-te"], price_ranges: ["$$$", "$$$$"] },
  "thuong-thuc-am-nhac-live": { name_keywords: ["live", "music", "acoustic", "jazz"], category_slugs: ["nhau-bia"] },
  "cuoi-tuan-cung-gia-dinh": { name_keywords: ["gia đình", "family", "buffet"] },
  "boss-di-cung-sen-vui-ve-pet-friendly": { tag_slugs: ["pet-friendly"], name_keywords: ["pet", "thú cưng"] },
};

// ─── Helpers ────────────────────────────────────────────────────────────

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

function pickRandom<T>(arr: T[], n: number): T[] {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, n);
}

function matchCategories(name: string): string[] {
  const lower = name.toLowerCase();
  const matched: string[] = [];
  for (const [slug, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (keywords.some((kw) => lower.includes(kw))) {
      matched.push(slug);
    }
  }
  return matched;
}

function matchTags(name: string, description: string): string[] {
  const text = `${name} ${description}`.toLowerCase();
  const matched: string[] = [];
  for (const [slug, keywords] of Object.entries(TAG_KEYWORDS)) {
    if (keywords.some((kw) => text.includes(kw))) {
      matched.push(slug);
    }
  }
  return matched;
}

function matchCollections(
  categoryMatches: string[],
  tagMatches: string[],
  name: string,
  priceRange: string | null,
  rating: number | null
): string[] {
  const matched: string[] = [];
  const nameLower = name.toLowerCase();

  for (const [collSlug, rules] of Object.entries(COLLECTION_RULES)) {
    let score = 0;

    if (rules.category_slugs) {
      const overlap = rules.category_slugs.filter((c) => categoryMatches.includes(c));
      score += overlap.length * 3;
    }
    if (rules.tag_slugs) {
      const overlap = rules.tag_slugs.filter((t) => tagMatches.includes(t));
      score += overlap.length * 5;
    }
    if (rules.name_keywords) {
      for (const kw of rules.name_keywords) {
        if (nameLower.includes(kw.toLowerCase())) score += 2;
      }
    }
    if (rules.price_ranges && priceRange && rules.price_ranges.includes(priceRange)) {
      score += 1;
    }
    if (rules.min_rating && (rating || 0) < rules.min_rating) {
      continue; // Skip if below minimum rating
    }

    if (score > 0) {
      matched.push(collSlug);
    }
  }

  return matched;
}

// ─── Main ───────────────────────────────────────────────────────────────

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    if (!GEMINI_API_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("Missing required environment variables.");
    }

    const body = await req.json().catch(() => ({}));
    const queryCount = body.query_count || 3; // how many queries to run per invocation
    const queries: string[] = body.queries || pickRandom(QUERY_POOL, queryCount);

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Pre-fetch existing slugs and google_place_ids for dedup
    const { data: existingSlugs } = await supabase
      .from("locations")
      .select("slug, google_place_id");
    const slugSet = new Set((existingSlugs || []).map((l) => l.slug));
    const placeIdSet = new Set(
      (existingSlugs || [])
        .filter((l) => l.google_place_id)
        .map((l) => l.google_place_id)
    );

    // Pre-fetch categories and tags for ID lookup
    const { data: categories } = await supabase
      .from("categories")
      .select("id, slug");
    const catMap = new Map((categories || []).map((c) => [c.slug, c.id]));

    const { data: tags } = await supabase
      .from("tags")
      .select("id, slug");
    const tagMap = new Map((tags || []).map((t) => [t.slug, t.id]));

    // Pre-fetch collections for assignment
    const { data: collections } = await supabase
      .from("collections")
      .select("id, slug");
    const collMap = new Map((collections || []).map((c) => [c.slug, c.id]));

    const stats = {
      queries_run: 0,
      locations_found: 0,
      locations_new: 0,
      locations_duplicate: 0,
      categories_assigned: 0,
      tags_assigned: 0,
      collections_assigned: 0,
      errors: [] as string[],
    };

    for (const query of queries) {
      stats.queries_run++;
      console.log(`[Crawl] Query: "${query}"`);

      try {
        // Call Gemini + Google Maps Grounding
        const prompt = `Tìm danh sách các địa điểm ẩm thực ở TP. Hồ Chí Minh cho truy vấn: "${query}".

Với mỗi địa điểm, cung cấp đầy đủ:
- Tên chính xác từ Google Maps
- Địa chỉ đầy đủ
- Quận/huyện
- Mô tả ngắn hấp dẫn (2-3 câu, tiếng Việt, giọng food blogger)
- Số điện thoại (nếu có)
- Giờ mở cửa (nếu có)
- Mức giá: $ (<50k), $$ (50-150k), $$$ (150-500k), $$$$ (>500k VND/người)
- Điểm Google Maps, số review, tóm tắt review tiếng Việt (NẾU KHÔNG CÓ review thật thì set null, KHÔNG tự bịa), 3-5 keyword nổi bật

Trả kết quả JSON array:
[{"name":"","address":"","district":"","description":"","phone_number":null,"opening_hours":null,"price_range":"$$","google_rating":4.5,"google_review_count":500,"google_review_summary":"","google_highlights":[]}]

CHỈ JSON, không markdown.`;

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
            generationConfig: { temperature: 0.3, maxOutputTokens: 8192 },
          }),
        });

        if (!geminiResponse.ok) {
          stats.errors.push(`Gemini error for "${query}": ${geminiResponse.status}`);
          continue;
        }

        const responseData = await geminiResponse.json();
        const candidate = responseData.candidates?.[0];
        if (!candidate) {
          stats.errors.push(`No candidates for "${query}"`);
          continue;
        }

        const generatedText = (candidate.content?.parts || [])
          .filter((p: { text?: string }) => p.text)
          .map((p: { text: string }) => p.text)
          .join("");

        // Parse grounding chunks for Maps data
        const mapsChunks: Array<{ title: string; uri: string; placeId: string | null }> = [];
        if (candidate.groundingMetadata?.groundingChunks) {
          for (const chunk of candidate.groundingMetadata.groundingChunks) {
            if (chunk.maps) {
              mapsChunks.push({
                title: chunk.maps.title || "",
                uri: chunk.maps.uri || "",
                placeId: chunk.maps.placeId
                  ? chunk.maps.placeId.replace("places/", "")
                  : null,
              });
            }
          }
        }

        // Parse JSON
        let locations: Record<string, unknown>[] = [];
        try {
          const jsonBlocks: string[] = [];
          const blockPattern = /```json\s*([\s\S]*?)(?:```|$)/g;
          let m: RegExpExecArray | null;
          while ((m = blockPattern.exec(generatedText)) !== null) {
            jsonBlocks.push(m[1].trim());
          }
          if (jsonBlocks.length === 0) jsonBlocks.push(generatedText.trim());

          for (const block of jsonBlocks) {
            try {
              const parsed = JSON.parse(block);
              locations = Array.isArray(parsed) ? parsed : [parsed];
              break;
            } catch {
              // Try progressive repair for truncated JSON
              let pos = block.length;
              for (let i = 0; i < 50; i++) {
                pos = block.lastIndexOf("}", pos - 1);
                if (pos <= 0) break;
                try {
                  const repaired = JSON.parse(block.substring(0, pos + 1) + "\n]");
                  locations = Array.isArray(repaired) ? repaired : [repaired];
                  break;
                } catch { /* continue */ }
              }
              if (locations.length > 0) break;
            }
          }
        } catch {
          stats.errors.push(`JSON parse failed for "${query}"`);
          continue;
        }

        stats.locations_found += locations.length;

        // Process each location
        for (const loc of locations) {
          const name = (loc.name as string) || "";
          if (!name) continue;

          const locSlug = slugify(name);

          // Match grounding chunk
          const matchedChunk = mapsChunks.find(
            (c) => c.title && name.toLowerCase().includes(c.title.toLowerCase())
          ) || mapsChunks.find(
            (c) => c.title && c.title.toLowerCase().includes(name.toLowerCase())
          );

          const placeId = matchedChunk?.placeId || null;

          // Dedup check
          if (slugSet.has(locSlug) || (placeId && placeIdSet.has(placeId))) {
            stats.locations_duplicate++;
            continue;
          }

          // Parse highlights
          let highlights: string[] | null = null;
          if (Array.isArray(loc.google_highlights)) {
            highlights = (loc.google_highlights as unknown[])
              .filter((h) => typeof h === "string") as string[];
            if (highlights.length === 0) highlights = null;
          }

          // Insert location as draft
          const { data: newLoc, error: insertErr } = await supabase
            .from("locations")
            .insert({
              name,
              slug: locSlug,
              address: (loc.address as string) || "",
              district: (loc.district as string) || "",
              description: (loc.description as string) || null,
              phone_number: (loc.phone_number as string) || null,
              opening_hours:
                loc.opening_hours && typeof loc.opening_hours === "object" && !Array.isArray(loc.opening_hours)
                  ? loc.opening_hours
                  : null,
              price_range: ["$", "$$", "$$$", "$$$$"].includes(loc.price_range as string)
                ? loc.price_range
                : null,
              google_maps_uri: matchedChunk?.uri || null,
              google_place_id: placeId,
              google_rating: typeof loc.google_rating === "number" ? loc.google_rating : null,
              google_review_count: typeof loc.google_review_count === "number" ? loc.google_review_count : null,
              google_review_summary: cleanReview(loc.google_review_summary as string),
              google_highlights: highlights,
              status: "draft",
              average_rating: typeof loc.google_rating === "number" ? loc.google_rating : 0,
              review_count: 0,
            })
            .select("id")
            .single();

          if (insertErr || !newLoc) {
            stats.errors.push(`Insert failed for "${name}": ${insertErr?.message}`);
            continue;
          }

          stats.locations_new++;
          slugSet.add(locSlug);
          if (placeId) placeIdSet.add(placeId);

          // Auto-categorize
          const catMatches = matchCategories(name);
          for (const catSlug of catMatches) {
            const catId = catMap.get(catSlug);
            if (catId) {
              await supabase
                .from("location_categories")
                .insert({ location_id: newLoc.id, category_id: catId })
                .select()
                .maybeSingle();
              stats.categories_assigned++;
            }
          }

          // Auto-tag
          const tagMatches = matchTags(name, (loc.description as string) || "");
          for (const tagSlug of tagMatches) {
            const tagId = tagMap.get(tagSlug);
            if (tagId) {
              await supabase
                .from("location_tags")
                .insert({ location_id: newLoc.id, tag_id: tagId })
                .select()
                .maybeSingle();
              stats.tags_assigned++;
            }
          }

          // Auto-assign to collections
          const collMatches = matchCollections(
            catMatches,
            tagMatches,
            name,
            (loc.price_range as string) || null,
            typeof loc.google_rating === "number" ? loc.google_rating : null
          );
          for (const collSlug of collMatches) {
            const collId = collMap.get(collSlug);
            if (collId) {
              await supabase
                .from("collection_locations")
                .insert({ collection_id: collId, location_id: newLoc.id })
                .select()
                .maybeSingle();
              stats.collections_assigned++;
            }
          }

          console.log(
            `  [New] ${name} → cats:${catMatches.length} tags:${tagMatches.length} colls:${collMatches.length}`
          );
        }

        // Small delay between queries to avoid rate limits
        if (queries.indexOf(query) < queries.length - 1) {
          await new Promise((r) => setTimeout(r, 2000));
        }
      } catch (queryErr) {
        stats.errors.push(`Query "${query}" error: ${(queryErr as Error).message}`);
      }
    }

    console.log(`[Crawl] Done: ${JSON.stringify(stats)}`);

    return new Response(
      JSON.stringify({
        success: true,
        ...stats,
        queries_used: queries,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[Crawl] Fatal:", error);
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
