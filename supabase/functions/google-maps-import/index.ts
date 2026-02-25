import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
const GEMINI_MODEL = "gemini-2.5-flash";
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;

// Default center: Ho Chi Minh City (District 1)
const DEFAULT_LAT = 10.7769;
const DEFAULT_LNG = 106.7009;

interface MapsImportRequest {
  query: string;
  latitude?: number;
  longitude?: number;
}

interface ParsedLocation {
  name: string;
  address: string;
  district: string;
  description: string;
  phone_number: string | null;
  opening_hours: Record<string, string> | null;
  price_range: "$" | "$$" | "$$$" | "$$$$" | null;
  latitude: number | null;
  longitude: number | null;
  google_maps_uri: string | null;
  google_place_id: string | null;
  google_rating: number | null;
  google_review_count: number | null;
  google_review_summary: string | null;
  google_highlights: string[] | null;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    if (!GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY is not configured.");
    }

    const { query, latitude, longitude }: MapsImportRequest = await req.json();

    if (!query || query.trim().length === 0) {
      throw new Error("Query is required.");
    }

    const lat = latitude ?? DEFAULT_LAT;
    const lng = longitude ?? DEFAULT_LNG;

    // Step 1: Call Gemini with Google Maps Grounding to get places
    const prompt = `Tìm danh sách các địa điểm ở TP. Hồ Chí Minh cho truy vấn sau: "${query}".

Với mỗi địa điểm tìm được, hãy KHAI THÁC TỐI ĐA dữ liệu từ Google Maps bao gồm:
- Tên chính xác
- Địa chỉ đầy đủ
- Quận/huyện
- Mô tả ngắn hấp dẫn (2-3 câu, viết bằng tiếng Việt, giọng văn tự nhiên)
- Số điện thoại (nếu có)
- Giờ mở cửa (nếu có)
- Mức giá ước tính ($ = dưới 50k, $$ = 50-150k, $$$ = 150-500k, $$$$ = trên 500k VND/người)
- QUAN TRỌNG - Thông tin review từ Google Maps:
  + Điểm đánh giá trung bình trên Google (ví dụ 4.5)
  + Số lượng review trên Google
  + Tóm tắt review: Tổng hợp ý kiến nổi bật từ các review Google thành 2-3 câu bằng tiếng Việt. Ví dụ: "Phở đậm đà, nước dùng trong veo, thịt bò mềm. Nhiều người khen phục vụ nhanh, không gian thoáng mát dù hơi đông vào giờ cao điểm."
  + Điểm nổi bật: Danh sách 3-5 keyword ngắn gọn rút ra từ review (ví dụ: ["phở đậm đà", "phục vụ nhanh", "giá hợp lý", "đông khách"])

Trả kết quả dưới dạng JSON array. Mỗi phần tử có format:
{
  "name": "tên địa điểm",
  "address": "địa chỉ đầy đủ",
  "district": "Quận X" hoặc "Thủ Đức" etc,
  "description": "mô tả tiếng Việt",
  "phone_number": "số điện thoại hoặc null",
  "opening_hours": {"monday": "08:00-22:00", ...} hoặc null,
  "price_range": "$" hoặc "$$" hoặc "$$$" hoặc "$$$$" hoặc null,
  "google_rating": 4.5,
  "google_review_count": 1234,
  "google_review_summary": "tóm tắt review bằng tiếng Việt",
  "google_highlights": ["keyword1", "keyword2", "keyword3"]
}

CHỈ trả về JSON array, không thêm markdown code block hay text nào khác.`;

    const geminiRequest = {
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      tools: [{ googleMaps: {} }],
      toolConfig: {
        retrievalConfig: {
          latLng: { latitude: lat, longitude: lng },
        },
      },
      generationConfig: {
        temperature: 0.3,
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
      throw new Error(
        `Gemini API error: ${geminiResponse.status} ${errorBody}`
      );
    }

    const responseData = await geminiResponse.json();
    const candidate = responseData.candidates?.[0];

    if (!candidate) {
      throw new Error("Không nhận được kết quả từ Gemini.");
    }

    // Concatenate all text parts (Gemini may split long responses)
    const generatedText = (candidate.content?.parts || [])
      .filter((p: { text?: string }) => p.text)
      .map((p: { text: string }) => p.text)
      .join("");
    const groundingMetadata = candidate.groundingMetadata;

    // Parse grounding chunks to get Maps URIs and Place IDs
    const mapsChunks: Array<{
      title: string;
      uri: string;
      placeId: string | null;
    }> = [];
    if (groundingMetadata?.groundingChunks) {
      for (const chunk of groundingMetadata.groundingChunks) {
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

    // Parse the JSON response from Gemini
    // Gemini may return multiple ```json blocks or truncated JSON
    let parsedLocations: ParsedLocation[] = [];
    try {
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
        throw new Error("No parseable JSON found");
      }

      const locations = bestResult;

      parsedLocations = (locations as Record<string, unknown>[]).map((loc) => {
        // Try to match with grounding chunks by name similarity
        const matchedChunk = mapsChunks.find(
          (chunk) =>
            chunk.title &&
            ((loc.name as string) || "")
              .toLowerCase()
              .includes(chunk.title.toLowerCase())
        ) || mapsChunks.find(
          (chunk) =>
            chunk.title &&
            chunk.title
              .toLowerCase()
              .includes(((loc.name as string) || "").toLowerCase())
        );

        // Parse google_highlights as string array
        let highlights: string[] | null = null;
        if (Array.isArray(loc.google_highlights)) {
          highlights = (loc.google_highlights as unknown[])
            .filter((h) => typeof h === "string")
            .map((h) => h as string);
          if (highlights.length === 0) highlights = null;
        }

        return {
          name: (loc.name as string) || "",
          address: (loc.address as string) || "",
          district: (loc.district as string) || "",
          description: (loc.description as string) || "",
          phone_number: (loc.phone_number as string) || null,
          opening_hours:
            loc.opening_hours &&
            typeof loc.opening_hours === "object" &&
            !Array.isArray(loc.opening_hours)
              ? (loc.opening_hours as Record<string, string>)
              : null,
          price_range: ["$", "$$", "$$$", "$$$$"].includes(
            loc.price_range as string
          )
            ? (loc.price_range as "$" | "$$" | "$$$" | "$$$$")
            : null,
          latitude: null,
          longitude: null,
          google_maps_uri: matchedChunk?.uri || null,
          google_place_id: matchedChunk?.placeId || null,
          google_rating:
            typeof loc.google_rating === "number" ? loc.google_rating : null,
          google_review_count:
            typeof loc.google_review_count === "number"
              ? loc.google_review_count
              : null,
          google_review_summary:
            (loc.google_review_summary as string) || null,
          google_highlights: highlights,
        };
      });
    } catch (parseError) {
      // If JSON parsing fails, return the raw text for debugging
      return new Response(
        JSON.stringify({
          error: "Không thể parse kết quả từ Gemini.",
          raw_text: generatedText,
          grounding_chunks: mapsChunks,
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 422,
        }
      );
    }

    return new Response(
      JSON.stringify({
        locations: parsedLocations,
        grounding_chunks: mapsChunks,
        query,
        total: parsedLocations.length,
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
