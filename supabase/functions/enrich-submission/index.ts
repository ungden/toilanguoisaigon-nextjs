/**
 * Enrich Submission
 *
 * Enriches pending community submissions with Google Maps data.
 * For each pending submission, searches Google Maps to find matching
 * locations and adds: rating, review count, review summary, highlights,
 * phone, opening hours, price range, photos, and Maps URI.
 *
 * This helps admins review submissions with full context.
 *
 * Called by daily-cron orchestrator or manually via admin action.
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
  for (const p of JUNK_PATTERNS) { if (p.test(t)) return null; }
  return t;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    if (!GEMINI_API_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("Missing required environment variables.");
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Fetch pending submissions that haven't been enriched yet
    // We use a convention: enriched submissions have `notes` starting with "[ENRICHED]"
    const { data: submissions, error: fetchErr } = await supabase
      .from("location_submissions")
      .select("id, name, address, district, description, notes")
      .eq("status", "pending")
      .order("created_at", { ascending: true })
      .limit(10); // Process max 10 per run to stay within Edge Function limits

    if (fetchErr) throw new Error(`DB error: ${fetchErr.message}`);
    if (!submissions || submissions.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: "Không có submission nào cần enrich.", enriched: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Filter out already-enriched
    const pending = submissions.filter(
      (s) => !s.notes?.startsWith("[ENRICHED]")
    );

    if (pending.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: "Tất cả submissions đã được enrich.", enriched: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const results = [];

    for (const sub of pending) {
      console.log(`[Enrich] Processing: ${sub.name} (${sub.district})`);

      try {
        const prompt = `Tìm thông tin chi tiết về địa điểm ẩm thực này trên Google Maps:
Tên: "${sub.name}"
Địa chỉ: "${sub.address}"
Quận: "${sub.district}"

Trả về JSON object với thông tin từ Google Maps:
{
  "found": true/false,
  "name_exact": "tên chính xác trên Google Maps",
  "address_exact": "địa chỉ đầy đủ",
  "phone_number": "số điện thoại hoặc null",
  "opening_hours": {"monday": "08:00-22:00", ...} hoặc null,
  "price_range": "$ hoặc $$ hoặc $$$ hoặc $$$$",
  "google_rating": 4.5,
  "google_review_count": 500,
  "google_review_summary": "Tóm tắt review tiếng Việt 2-3 câu (NẾU KHÔNG CÓ review thật thì set null, KHÔNG bịa)",
  "google_highlights": ["keyword1", "keyword2", "keyword3"],
  "description": "Mô tả hấp dẫn 2-3 câu tiếng Việt nếu chưa có"
}

Nếu không tìm thấy địa điểm, set "found": false và các field khác null.
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
            generationConfig: { temperature: 0.2, maxOutputTokens: 2048 },
          }),
        });

        if (!geminiResponse.ok) {
          console.error(`Gemini error for "${sub.name}": ${geminiResponse.status}`);
          continue;
        }

        const responseData = await geminiResponse.json();
        const candidate = responseData.candidates?.[0];
        if (!candidate) continue;

        const text = (candidate.content?.parts || [])
          .filter((p: { text?: string }) => p.text)
          .map((p: { text: string }) => p.text)
          .join("");

        // Parse grounding for Maps URI
        let mapsUri = null;
        let placeId = null;
        if (candidate.groundingMetadata?.groundingChunks) {
          for (const chunk of candidate.groundingMetadata.groundingChunks) {
            if (chunk.maps) {
              mapsUri = chunk.maps.uri || null;
              placeId = chunk.maps.placeId
                ? chunk.maps.placeId.replace("places/", "")
                : null;
              break;
            }
          }
        }

        // Parse JSON response
        let enrichData: Record<string, unknown> = {};
        try {
          const cleaned = text.replace(/```json\s*/g, "").replace(/```/g, "").trim();
          enrichData = JSON.parse(cleaned);
        } catch {
          console.error(`JSON parse failed for "${sub.name}"`);
          continue;
        }

        if (!enrichData.found) {
          // Mark as enriched but not found
          const note = `[ENRICHED] Không tìm thấy trên Google Maps. ${sub.notes || ""}`;
          await supabase
            .from("location_submissions")
            .update({ notes: note })
            .eq("id", sub.id);
          results.push({ id: sub.id, name: sub.name, status: "not_found" });
          continue;
        }

        // Build enrichment summary for admin
        const enrichSummary = [
          `[ENRICHED]`,
          `Google: ${enrichData.google_rating || "?"}/5 (${enrichData.google_review_count || 0} reviews)`,
          `Giá: ${enrichData.price_range || "?"}`,
          cleanReview(enrichData.google_review_summary as string)
            ? `Review: ${cleanReview(enrichData.google_review_summary as string)}`
            : null,
          enrichData.google_highlights
            ? `Nổi bật: ${(enrichData.google_highlights as string[]).join(", ")}`
            : null,
          mapsUri ? `Maps: ${mapsUri}` : null,
          placeId ? `Place ID: ${placeId}` : null,
          enrichData.phone_number ? `SĐT: ${enrichData.phone_number}` : null,
          `---`,
          sub.notes || "",
        ]
          .filter(Boolean)
          .join("\n");

        // Update description if empty, and always update notes
        const updates: Record<string, unknown> = {
          notes: enrichSummary,
        };
        if (!sub.description && enrichData.description) {
          updates.description = enrichData.description;
        }

        await supabase
          .from("location_submissions")
          .update(updates)
          .eq("id", sub.id);

        results.push({
          id: sub.id,
          name: sub.name,
          status: "enriched",
          rating: enrichData.google_rating,
          reviews: enrichData.google_review_count,
        });

        console.log(
          `  [Enriched] ${sub.name}: ${enrichData.google_rating}/5 (${enrichData.google_review_count} reviews)`
        );

        // Rate limit
        await new Promise((r) => setTimeout(r, 1500));
      } catch (subErr) {
        console.error(`Error enriching "${sub.name}":`, subErr);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        enriched: results.length,
        results,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[Enrich] Fatal:", error);
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
