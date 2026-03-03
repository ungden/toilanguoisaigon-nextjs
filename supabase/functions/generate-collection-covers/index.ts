import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const GEMINI_IMAGE_MODEL = "gemini-2.5-flash-image";

const STYLE_PREFIX =
  "A beautiful warm watercolor illustration in the style of Vietnamese traditional art, wide landscape composition suitable for website hero image, soft warm lighting, nostalgic Saigon mood, muted earth tones with pops of red and gold. No text, no watermark, no writing.";

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

  if (!resp.ok) return null;
  const data: any = await resp.json();
  const candidates = data?.candidates || [];
  if (!candidates.length) return null;

  const parts = candidates[0]?.content?.parts || [];
  for (const part of parts) {
    const mime = part?.inlineData?.mimeType || "";
    const b64 = part?.inlineData?.data || "";
    if (mime.startsWith("image/") && b64) {
      return decodeBase64ToBytes(b64);
    }
  }

  return null;
}

async function uploadCover(slug: string, imageBytes: Uint8Array): Promise<string | null> {
  const objectPath = `collection-covers/${slug}.png`;
  const uploadUrl = `${SUPABASE_URL}/storage/v1/object/location-images/${objectPath}`;

  const uploadResp = await fetch(uploadUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      "Content-Type": "image/png",
      "x-upsert": "true",
    },
    body: imageBytes,
  });

  if (!uploadResp.ok) return null;
  return `${SUPABASE_URL}/storage/v1/object/public/location-images/${objectPath}`;
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    if (!GEMINI_API_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("Missing GEMINI_API_KEY, SUPABASE_URL, or SUPABASE_SERVICE_ROLE_KEY");
    }

    const body: any = await req.json().catch(() => ({}));
    const limit = Number(body.limit || 5);

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { data: rows, error } = await supabase
      .from("collections")
      .select("id,title,slug")
      .is("cover_image_url", null)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) throw error;

    const collections = rows || [];
    let generated = 0;
    const errors: string[] = [];

    for (const c of collections) {
      try {
        const prompt = `${STYLE_PREFIX} Scene concept: ${c.title}.`; 
        const imgBytes = await generateImageBytes(prompt);
        if (!imgBytes) {
          errors.push(`Generate failed: ${c.slug}`);
          continue;
        }

        const coverUrl = await uploadCover(c.slug, imgBytes);
        if (!coverUrl) {
          errors.push(`Upload failed: ${c.slug}`);
          continue;
        }

        const { error: updateErr } = await supabase
          .from("collections")
          .update({ cover_image_url: coverUrl })
          .eq("id", c.id);

        if (updateErr) {
          errors.push(`DB update failed: ${c.slug}`);
          continue;
        }

        generated += 1;
      } catch (e) {
        errors.push(`${c.slug}: ${(e as Error).message}`);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        checked: collections.length,
        generated,
        errors,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
