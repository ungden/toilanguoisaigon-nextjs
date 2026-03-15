/**
 * Generate AI food collections using a 2-phase approach:
 *
 * Phase 1 — RESEARCH: Call Gemini + Google Maps grounding to discover
 *   real, relevant locations for a specific theme (e.g. "quán mới mở đang hot",
 *   "quán ăn khuya nổi tiếng"). This returns real Google Maps data.
 *
 * Phase 2 — CURATE: Match discovered locations against the DB.
 *   Use existing entries when available; create new draft entries for
 *   genuinely new discoveries. Build the collection with proper ordering.
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

// HCMC coordinates for Google Maps grounding
const DEFAULT_LAT = 10.7769;
const DEFAULT_LNG = 106.7009;

const MOODS = [
  "morning", "lunch", "dinner", "late-night", "rainy-day", "weekend",
  "date-night", "family", "budget", "premium", "adventure", "comfort",
  "healthy", "street-food", "seasonal", "trending",
];

// Filter junk AI-generated text
const JUNK_PATTERNS = [
  /không\s*(được\s*)?cung\s*cấp/i, /không\s*có\s*thông\s*tin/i,
  /chưa\s*có\s*(thông\s*tin|review|đánh\s*giá)/i, /không\s*có\s*dữ\s*liệu/i,
  /không\s*tìm\s*thấy/i, /no\s*review/i, /not\s*(available|provided)/i, /n\/a/i,
];
function cleanReview(s: string | null | undefined): string | null {
  if (!s || typeof s !== "string") return null;
  const t = s.trim();
  if (t.length < 10) return null;
  for (const p of JUNK_PATTERNS) { if (p.test(t)) return null; }
  return t;
}

function slugify(text: string): string {
  return text
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d").replace(/Đ/g, "D")
    .toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function todayStr(): string {
  return new Date().toISOString().split("T")[0];
}

function pickRandom<T>(arr: T[], n: number): T[] {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, n);
}

// ─── Theme Pool ───────────────────────────────────────────────────────────
// Each theme has a Google Maps research query and collection metadata.
// Themes are designed so Gemini uses grounding to find REAL, RELEVANT places.

interface Theme {
  research_query: string;        // query for Google Maps grounding
  title_template: string;        // collection title (can include {date}, {day})
  description_template: string;  // collection description
  mood: string;
  emoji: string;
}

const THEME_POOL: Theme[] = [
  // ── Trending / New ──
  {
    research_query: "quán ăn mới mở đang hot ở Sài Gòn 2025 2026, được nhiều người đánh giá tốt gần đây",
    title_template: "Quán Mới Đang Hot Tuần Này",
    description_template: "Những quán ăn mới toanh đang viral trên mạng xã hội. Đi thử trước khi đông!",
    mood: "trending", emoji: "🔥",
  },
  {
    research_query: "quán ăn viral trên TikTok Instagram Sài Gòn, quán nổi tiếng giới trẻ check-in",
    title_template: "Viral Alert: Sài Gòn Đang Check-in Ở Đâu?",
    description_template: "Những quán đang cháy trên TikTok và Instagram. Sống ảo cháy máy!",
    mood: "adventure", emoji: "📱",
  },
  // ── Time-based ──
  {
    research_query: "quán ăn sáng ngon nhất Sài Gòn, phở sáng bún sáng bánh mì sáng xôi sáng nổi tiếng",
    title_template: "Sáng Nay Ăn Gì? Đặc Sản Bữa Sáng Sài Gòn",
    description_template: "Bắt đầu ngày mới với những quán ăn sáng huyền thoại Sài Gòn — phở, bún, bánh mì, xôi nóng hổi.",
    mood: "morning", emoji: "🌅",
  },
  {
    research_query: "quán ăn trưa văn phòng ngon Sài Gòn, cơm trưa bún trưa gần trung tâm",
    title_template: "Trưa Nay Ăn Gì? Cơm Trưa Chất Lừ",
    description_template: "Hết ý tưởng ăn trưa? Những quán cơm trưa ngon, nhanh, giá hợp lý cho dân văn phòng.",
    mood: "lunch", emoji: "🍱",
  },
  {
    research_query: "quán ăn khuya ngon Sài Gòn mở tới 2h 3h sáng, đồ ăn đêm nổi tiếng",
    title_template: "Sài Gòn Không Ngủ: Ăn Khuya Đi!",
    description_template: "Đói lúc nửa đêm? Những quán ăn khuya huyền thoại mở tới 2-3 giờ sáng.",
    mood: "late-night", emoji: "🌙",
  },
  // ── Style-based ──
  {
    research_query: "quán ăn vỉa hè ngon nhất Sài Gòn, quán bình dân nổi tiếng rating cao",
    title_template: "Vỉa Hè Tinh Hoa: Ngon Rẻ Bất Ngờ",
    description_template: "Ghế nhựa, bàn inox, mà ngon đến mức hàng dài xếp hàng. Chất Sài Gòn là đây!",
    mood: "street-food", emoji: "🛵",
  },
  {
    research_query: "nhà hàng lãng mạn hẹn hò Sài Gòn, quán ăn view đẹp cho couple date night",
    title_template: "Date Night Hoàn Hảo",
    description_template: "Những nhà hàng lãng mạn nhất Sài Gòn cho buổi hẹn hò đáng nhớ.",
    mood: "date-night", emoji: "💕",
  },
  {
    research_query: "quán cà phê đẹp Sài Gòn sân vườn rooftop view đẹp, quán cafe nổi tiếng",
    title_template: "Cà Phê & Chill: View Đẹp Thả Hồn",
    description_template: "Sáng cuối tuần thong thả, cà phê ngon, view đẹp, chill hết nấc.",
    mood: "weekend", emoji: "☕",
  },
  {
    research_query: "quán ăn gia đình Sài Gòn rộng rãi, nhà hàng phù hợp gia đình trẻ em",
    title_template: "Cuối Tuần Cùng Gia Đình",
    description_template: "Những quán ăn rộng rãi, đồ ăn đa dạng, phù hợp cho cả nhà từ lớn đến bé.",
    mood: "family", emoji: "👨‍👩‍👧‍👦",
  },
  // ── Food-specific ──
  {
    research_query: "phở ngon nhất Sài Gòn 2025 2026, quán phở nổi tiếng rating cao review tốt",
    title_template: "Phở Sài Gòn: Bát Nào Ngon Nhất?",
    description_template: "Cuộc chiến phở Sài Gòn — từ phở gánh vỉa hè đến phở nhà hàng. Bạn team nào?",
    mood: "comfort", emoji: "🍜",
  },
  {
    research_query: "lẩu nướng ngon Sài Gòn, buffet BBQ hotpot rating cao nổi tiếng",
    title_template: "Lẩu Nướng Sài Gòn: Ăn Thả Ga",
    description_template: "Đi nhóm ăn gì? Lẩu nướng thôi! Những quán lẩu nướng ngon nhất Sài Gòn.",
    mood: "adventure", emoji: "🥘",
  },
  {
    research_query: "ốc hải sản ngon Sài Gòn, quán ốc nổi tiếng rating cao giá bình dân",
    title_template: "Ốc Sài Gòn: Hút Hồn Từng Miếng",
    description_template: "Ốc luộc, ốc nướng, ốc xào — tổng hợp quán ốc ngon nhức nách Sài Gòn.",
    mood: "street-food", emoji: "🐚",
  },
  {
    research_query: "quán chè trà sữa kem ngon Sài Gòn, tráng miệng dessert nổi tiếng",
    title_template: "Ngọt Ngào Sài Gòn: Chè Kem Thả Ga",
    description_template: "Chiều nóng cần gì? Chè, kem, trà sữa — ngọt lịm mà mát rượi.",
    mood: "comfort", emoji: "🍧",
  },
  {
    research_query: "quán nhậu bia craft ngon Sài Gòn, quán nhậu nổi tiếng đồ nhắm ngon",
    title_template: "Nhậu & Chill: Bia Lạnh Đồ Ngon",
    description_template: "Cuối tuần nhậu ở đâu? Tuyển chọn quán nhậu ngon, bia ngon, không khí vui.",
    mood: "late-night", emoji: "🍺",
  },
  // ── Budget ──
  {
    research_query: "quán ăn ngon giá rẻ dưới 50k Sài Gòn, ăn no không lo ví cho sinh viên",
    title_template: "Ăn No Không Lo Giá: Dưới 50K",
    description_template: "Ngon, no, rẻ — những quán ăn dưới 50k mà chất lượng không hề rẻ tiền.",
    mood: "budget", emoji: "💰",
  },
  // ── Special ──
  {
    research_query: "quán ăn trong hẻm bí mật Sài Gòn, hidden gem ẩm thực chỉ dân local biết",
    title_template: "Hẻm Sài Gòn: Bí Mật Ẩm Thực",
    description_template: "Lạc vào hẻm nhỏ, gặp quán ngon. Những hidden gem chỉ dân Sài Gòn chính hiệu mới biết.",
    mood: "adventure", emoji: "🗺️",
  },
  {
    research_query: "quán ăn healthy eat clean Sài Gòn, salad smoothie bowl organic vegetarian",
    title_template: "Sài Gòn Healthy: Ăn Sạch Sống Khỏe",
    description_template: "Eat clean không nhàm chán — những quán healthy ngon miệng đẹp mắt.",
    mood: "healthy", emoji: "🥗",
  },
  {
    research_query: "quán bánh mì ngon nhất Sài Gòn, bánh mì nổi tiếng rating cao",
    title_template: "Bánh Mì Sài Gòn: Ổ Nào Ngon Nhất?",
    description_template: "Từ Bánh Mì Huỳnh Hoa đến những xe bánh mì vỉa hè huyền thoại.",
    mood: "street-food", emoji: "🥖",
  },
];

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
    const mood = body.mood || null;
    const count = body.count || 1;
    const autoPublish = body.auto_publish ?? false;

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const today = todayStr();
    const dayOfWeek = new Date().toLocaleDateString("vi-VN", { weekday: "long" });

    // Pre-fetch existing locations for matching
    const { data: existingLocations, error: locError } = await supabase
      .from("locations")
      .select("id, name, slug")
      .eq("status", "published");
    if (locError) throw new Error(`DB error: ${locError.message}`);
    const allLocations = existingLocations || [];

    // Pick random themes (avoid repeating today's slugs)
    const { data: todayCollections } = await supabase
      .from("collections")
      .select("slug")
      .gte("created_at", `${today}T00:00:00`);
    const todaySlugs = new Set((todayCollections || []).map((c: { slug: string }) => c.slug));

    const availableThemes = THEME_POOL.filter((t) => {
      const slug = `${slugify(t.title_template)}-${today}`;
      return !todaySlugs.has(slug);
    });

    const selectedThemes = mood
      ? availableThemes.filter((t) => t.mood === mood).slice(0, count)
      : pickRandom(availableThemes, count);

    if (selectedThemes.length === 0) {
      return new Response(
        JSON.stringify({ success: true, playlists: [], collections: [], total: 0, date: today }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const createdCollections = [];

    for (const theme of selectedThemes) {
      const collTitle = theme.title_template;
      const slug = `${slugify(collTitle)}-${today}`;

      // Skip if slug already exists
      const { data: existing } = await supabase
        .from("collections").select("id").eq("slug", slug).maybeSingle();
      if (existing) continue;

      console.log(`[Playlist] Researching: "${theme.research_query}"`);

      // ─── Phase 1: Research via Google Maps grounding ───────────
      const researchPrompt = `Tìm 6-8 quán ăn/nhà hàng/quán cà phê CỤ THỂ ở TP.HCM cho chủ đề: "${theme.research_query}".

YÊU CẦU QUAN TRỌNG:
- Chỉ trả về quán CÓ THẬT, có trên Google Maps.
- Ưu tiên quán có nhiều review (>100), rating cao (>4.0).
- Đa dạng quận/huyện, không tập trung 1 chỗ.
- KHÔNG bịa quán. Nếu không chắc, bỏ qua.

Trả về JSON array:
[{"name":"Tên chính xác trên Google Maps","address":"Địa chỉ đầy đủ","district":"Quận/Huyện","description":"1 câu tại sao quán này phù hợp chủ đề","price_range":"$|$$|$$$|$$$$","google_rating":4.5,"google_review_count":1000}]

CHỈ JSON, không markdown.`;

      const researchResp = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: researchPrompt }] }],
          tools: [{ googleMaps: {} }],
          toolConfig: {
            retrievalConfig: {
              latLng: { latitude: DEFAULT_LAT, longitude: DEFAULT_LNG },
            },
          },
          generationConfig: {
            temperature: 0.3,
            maxOutputTokens: 4096,
          },
        }),
      });

      if (!researchResp.ok) {
        console.error(`[Playlist] Research failed: ${researchResp.status}`);
        continue;
      }

      const researchData = await researchResp.json();
      const researchText = (researchData.candidates?.[0]?.content?.parts || [])
        .filter((p: { text?: string }) => p.text)
        .map((p: { text: string }) => p.text)
        .join("");

      // Also extract grounding chunks for Google Place IDs
      const mapsChunks: Array<{ title: string; placeId: string | null }> = [];
      const groundingMeta = researchData.candidates?.[0]?.groundingMetadata;
      if (groundingMeta?.groundingChunks) {
        for (const chunk of groundingMeta.groundingChunks) {
          if (chunk.maps) {
            mapsChunks.push({
              title: chunk.maps.title || "",
              placeId: chunk.maps.placeId
                ? chunk.maps.placeId.replace("places/", "")
                : null,
            });
          }
        }
      }

      // Parse research results
      let researchLocations: Array<Record<string, unknown>> = [];
      try {
        let cleaned = researchText.trim()
          .replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/, "");
        const parsed = JSON.parse(cleaned);
        researchLocations = Array.isArray(parsed) ? parsed : [parsed];
      } catch {
        // Try progressive repair
        let cleaned = researchText.trim()
          .replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/, "");
        let pos = cleaned.length;
        for (let i = 0; i < 30; i++) {
          pos = cleaned.lastIndexOf("}", pos - 1);
          if (pos <= 0) break;
          try {
            const repaired = JSON.parse(cleaned.substring(0, pos + 1) + "]");
            researchLocations = Array.isArray(repaired) ? repaired : [repaired];
            break;
          } catch { /* continue */ }
        }
      }

      if (researchLocations.length === 0) {
        console.error("[Playlist] Research parse failed, raw:", researchText.substring(0, 300));
        continue;
      }

      console.log(`[Playlist] Research found ${researchLocations.length} places`);

      // ─── Phase 2: Match & Curate ─────────────────────────────
      const { data: newCollection, error: colError } = await supabase
        .from("collections")
        .insert({
          title: collTitle,
          slug,
          description: theme.description_template,
          mood: MOODS.includes(theme.mood) ? theme.mood : null,
          emoji: theme.emoji,
          status: autoPublish ? "published" : "draft",
          is_featured: false,
          generated_date: today,
          ai_context: `Research: "${theme.research_query}", Date: ${today}, Day: ${dayOfWeek}`,
          source: "ai",
        })
        .select("id")
        .single();

      if (colError || !newCollection) {
        console.error(`[Playlist] Failed to create collection:`, colError);
        continue;
      }

      const collectionLocations = [];
      let newLocCount = 0;

      for (let i = 0; i < researchLocations.length; i++) {
        const loc = researchLocations[i];
        const locName = String(loc.name || "").trim();
        if (!locName || locName === "Unknown Place") continue;

        // Try matching existing DB location by name (case-insensitive, contains)
        const locNameLower = locName.toLowerCase();
        const matched = allLocations.find((el) => {
          const elLower = el.name.toLowerCase();
          return elLower === locNameLower ||
            elLower.includes(locNameLower) ||
            locNameLower.includes(elLower);
        });

        if (matched) {
          collectionLocations.push({
            collection_id: newCollection.id,
            location_id: matched.id,
            position: i,
            ai_note: String(loc.description || ""),
          });
        } else {
          // Try slug match
          const locSlug = slugify(locName);
          const { data: bySlug } = await supabase
            .from("locations").select("id").eq("slug", locSlug).maybeSingle();

          if (bySlug) {
            collectionLocations.push({
              collection_id: newCollection.id,
              location_id: bySlug.id,
              position: i,
              ai_note: String(loc.description || ""),
            });
          } else {
            // Create new location as draft
            const matchedChunk = mapsChunks.find(
              (c) => c.title && (
                locNameLower.includes(c.title.toLowerCase()) ||
                c.title.toLowerCase().includes(locNameLower)
              )
            );

            const { data: created, error: createErr } = await supabase
              .from("locations")
              .insert({
                name: locName,
                slug: locSlug,
                address: String(loc.address || ""),
                district: String(loc.district || ""),
                description: String(loc.description || ""),
                price_range: ["$", "$$", "$$$", "$$$$"].includes(String(loc.price_range))
                  ? loc.price_range : null,
                google_rating: typeof loc.google_rating === "number" ? loc.google_rating : null,
                google_review_count: typeof loc.google_review_count === "number" ? loc.google_review_count : null,
                google_review_summary: cleanReview(loc.google_review_summary as string),
                google_place_id: matchedChunk?.placeId || null,
                status: "draft",
                average_rating: 0,
                review_count: 0,
              })
              .select("id")
              .single();

            if (!createErr && created) {
              collectionLocations.push({
                collection_id: newCollection.id,
                location_id: created.id,
                position: i,
                ai_note: String(loc.description || ""),
              });
              newLocCount++;
            }
          }
        }
      }

      // Insert collection_locations
      if (collectionLocations.length > 0) {
        await supabase.from("collection_locations").insert(collectionLocations);
      }

      createdCollections.push({
        id: newCollection.id,
        title: collTitle,
        slug,
        mood: theme.mood,
        emoji: theme.emoji,
        location_count: collectionLocations.length,
        new_locations_created: newLocCount,
      });

      console.log(
        `[Playlist] Created "${collTitle}" with ${collectionLocations.length} locations (${newLocCount} new)`
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        playlists: createdCollections,
        collections: createdCollections,
        total: createdCollections.length,
        date: today,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
