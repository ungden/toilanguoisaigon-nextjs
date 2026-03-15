/**
 * Generate watercolor cover images for blog posts that lack them.
 * Uses Gemini image generation, uploads to Supabase Storage, updates posts table.
 *
 * POST body: { limit?: number }  (default 3)
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

const GEMINI_IMAGE_MODEL = "gemini-2.5-flash-image";

const STYLE_PREFIX =
  "A beautiful warm watercolor illustration in the style of Vietnamese traditional art, " +
  "wide landscape composition (16:9) suitable for a blog hero image, " +
  "soft warm lighting, nostalgic Saigon mood, muted earth tones with pops of red and gold. " +
  "No text, no watermark, no writing, no letters, no numbers. ";

// Map keywords in title/tags to scene descriptions
const SCENE_MAP: Array<{ keywords: string[]; scene: string }> = [
  // Districts
  { keywords: ["quận 1"], scene: "Iconic Saigon District 1 with French colonial buildings, food stalls, warm golden light." },
  { keywords: ["quận 3"], scene: "Charming Saigon District 3 with tree-lined streets, cozy cafes, hidden food alleys." },
  { keywords: ["quận 5", "chợ lớn"], scene: "Saigon Chinatown with Chinese lanterns, dim sum steamers, temple roof, food stalls." },
  { keywords: ["quận 7"], scene: "Modern Phu My Hung with international restaurants, clean streets, contemporary dining." },
  { keywords: ["quận 10"], scene: "Busy District 10 intersection with street food vendors, students, old shophouses." },
  { keywords: ["bình thạnh"], scene: "Vibrant Binh Thanh with local food stalls near a canal, colorful market." },
  { keywords: ["phú nhuận"], scene: "Phu Nhuan cozy alley food scene with noodle shops, local coffee stalls." },
  { keywords: ["gò vấp"], scene: "Go Vap street food scene with affordable eateries, bustling evening market." },
  { keywords: ["thủ đức"], scene: "Thu Duc with modern buildings mixed with traditional food stalls, green parks." },
  // Food categories
  { keywords: ["phở"], scene: "A steaming bowl of pho with rice noodles, beef, herbs, golden broth. Bean sprouts and lime." },
  { keywords: ["bún bò"], scene: "A fiery red bowl of bun bo Hue with thick noodles, beef shank, chili oil, fresh herbs." },
  { keywords: ["bánh mì"], scene: "Crispy banh mi being assembled with pate, cold cuts, pickled carrots, cilantro." },
  { keywords: ["cơm tấm", "cơm"], scene: "Broken rice with grilled pork chop, sunny egg, pickled vegetables, fish sauce." },
  { keywords: ["cà phê", "cafe", "coffee"], scene: "Vietnamese ca phe sua da dripping through phin filter on a cafe table. Morning light." },
  { keywords: ["lẩu", "nướng", "bbq"], scene: "Bubbling hot pot with plates of vegetables, meat, seafood. Steam rising, chopsticks." },
  { keywords: ["ốc", "hải sản"], scene: "Colorful spread of Vietnamese snail and seafood dishes on a street food table." },
  { keywords: ["chè", "kem"], scene: "Colorful che desserts in glass bowls — che ba mau, che dau xanh with shaved ice." },
  { keywords: ["hủ tiếu"], scene: "Bowl of clear hu tieu soup with pork, shrimp, wontons. Morning breakfast scene." },
  { keywords: ["xôi"], scene: "Colorful sticky rice — xoi xeo, xoi gac — in banana leaves at morning vendor." },
  { keywords: ["cháo"], scene: "Comforting bowl of rice porridge with chicken, ginger, fried shallots." },
  { keywords: ["bánh canh"], scene: "Hearty bowl of banh canh with crab, thick tapioca noodles in rich broth." },
  { keywords: ["chay", "vegan"], scene: "Beautiful vegetarian meal with tofu, mushrooms, vegetables, temple background." },
  { keywords: ["nhậu", "bia"], scene: "Lively Vietnamese drinking scene with bia hoi, grilled squid, plastic tables." },
  // Themes
  { keywords: ["ăn vặt"], scene: "A fun assortment of Vietnamese street snacks — banh trang nuong, che, xien nuong, tra sua." },
  { keywords: ["khuya", "đêm"], scene: "Late night Saigon food scene under fluorescent lights, noodle stall with steam." },
  { keywords: ["view đẹp", "rooftop"], scene: "Stunning rooftop cafe in Saigon with panoramic city view, plants, coffee cup." },
  { keywords: ["hẻm", "bí mật"], scene: "Mysterious narrow Saigon alley with hidden food stalls, vines, warm lamplight." },
  { keywords: ["hẹn hò", "date"], scene: "Romantic dinner for two — candlelit table, garden restaurant with fairy lights." },
  { keywords: ["healthy", "eat clean"], scene: "Fresh healthy meal — smoothie bowl, salad, grilled fish on clean white table." },
  { keywords: ["giá rẻ", "bình dân", "50k", "sinh viên"], scene: "Humble delicious street food spread on plastic table with tiny stools. Under 50k VND." },
  { keywords: ["mưa"], scene: "Rainy Saigon with people eating hot soup under awnings, steam rising, cozy atmosphere." },
  { keywords: ["lịch trình", "food tour"], scene: "Food tour group walking Saigon streets, tasting dishes at stalls, cameras in hand." },
  { keywords: ["gia đình", "cuối tuần"], scene: "Wholesome Vietnamese family meal — three generations sharing dishes happily." },
  { keywords: ["quán mới", "viral"], scene: "Trendy modern restaurant with Instagram-worthy plating, neon signs, young people." },
  { keywords: ["chill"], scene: "A serene Saigon cafe with garden, hammock, cold drinks, dappled sunlight through trees." },
];

function getScene(title: string, tags: string[]): string {
  const text = `${title} ${tags.join(" ")}`.toLowerCase();

  // Sort by keyword length desc (most specific match first)
  const sorted = [...SCENE_MAP].sort(
    (a, b) =>
      Math.max(...b.keywords.map((k) => k.length)) -
      Math.max(...a.keywords.map((k) => k.length))
  );

  for (const entry of sorted) {
    if (entry.keywords.some((kw) => text.includes(kw))) {
      return entry.scene;
    }
  }

  return "A vibrant Saigon street food scene with diverse dishes, bustling sidewalk, warm evening light, happy diners.";
}

function decodeBase64ToBytes(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

async function generateImageBytes(prompt: string): Promise<Uint8Array | null> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_IMAGE_MODEL}:generateContent?key=${GEMINI_API_KEY}`;

  const resp = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { responseModalities: ["TEXT", "IMAGE"] },
    }),
  });

  if (!resp.ok) {
    console.error(`Gemini image error: ${resp.status}`);
    return null;
  }

  const data = await resp.json();
  const parts = data?.candidates?.[0]?.content?.parts || [];
  for (const part of parts) {
    const mime = part?.inlineData?.mimeType || "";
    const b64 = part?.inlineData?.data || "";
    if (mime.startsWith("image/") && b64) {
      return decodeBase64ToBytes(b64);
    }
  }
  return null;
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    if (!GEMINI_API_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("Missing GEMINI_API_KEY, SUPABASE_URL, or SUPABASE_SERVICE_ROLE_KEY");
    }

    const body = await req.json().catch(() => ({}));
    const limit = Number(body.limit || 3);

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Fetch published posts without cover images
    const { data: posts, error } = await supabase
      .from("posts")
      .select("id,title,slug,category,tags")
      .eq("status", "published")
      .is("cover_image_url", null)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) throw error;

    const postList = posts || [];
    let generated = 0;
    const errors: string[] = [];

    for (const post of postList) {
      try {
        const scene = getScene(post.title, post.tags || []);
        const prompt = STYLE_PREFIX + scene;

        console.log(`[BlogCover] Generating for: ${post.title}`);

        const imgBytes = await generateImageBytes(prompt);
        if (!imgBytes) {
          errors.push(`Generate failed: ${post.slug}`);
          continue;
        }

        // Upload to Supabase Storage
        const objectPath = `blog-covers/${post.slug}.png`;
        const uploadUrl = `${SUPABASE_URL}/storage/v1/object/location-images/${objectPath}`;

        const uploadResp = await fetch(uploadUrl, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
            "Content-Type": "image/png",
            "x-upsert": "true",
          },
          body: imgBytes,
        });

        if (!uploadResp.ok) {
          errors.push(`Upload failed: ${post.slug}`);
          continue;
        }

        const coverUrl = `${SUPABASE_URL}/storage/v1/object/public/location-images/${objectPath}`;

        // Update post
        const { error: updateErr } = await supabase
          .from("posts")
          .update({ cover_image_url: coverUrl })
          .eq("id", post.id);

        if (updateErr) {
          errors.push(`DB update failed: ${post.slug}`);
          continue;
        }

        generated += 1;
        console.log(`[BlogCover] Done: ${coverUrl}`);
      } catch (e) {
        errors.push(`${post.slug}: ${(e as Error).message}`);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        checked: postList.length,
        generated,
        errors,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    return new Response(
      JSON.stringify({ error: (e as Error).message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
