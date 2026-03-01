/**
 * CLI Script: Import locations from Google Maps via Gemini AI
 *
 * Usage:
 *   npx tsx scripts/import-from-maps.ts "quán phở ngon quận 1"
 *   npx tsx scripts/import-from-maps.ts --file queries.txt
 *   npx tsx scripts/import-from-maps.ts --file queries.txt --dry-run
 *
 * Environment variables required:
 *   GEMINI_API_KEY          - Google Gemini API key
 *   NEXT_PUBLIC_SUPABASE_URL - Supabase project URL
 *   SUPABASE_SERVICE_ROLE_KEY - Supabase service role key (for direct DB insert)
 *
 * Options:
 *   --file <path>   Read queries from a text file (one query per line)
 *   --dry-run       Preview results without inserting into database
 *   --delay <ms>    Delay between queries in ms (default: 2000)
 */

import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";
import * as path from "path";

// ─── Junk review filter ──────────────────────────────────────────────────
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

// ─── Config ──────────────────────────────────────────────────────────────

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const GEMINI_MODEL = "gemini-2.5-flash";
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;

// Default: Ho Chi Minh City center
const DEFAULT_LAT = 10.7769;
const DEFAULT_LNG = 106.7009;

// ─── Types ───────────────────────────────────────────────────────────────

interface ParsedLocation {
  name: string;
  address: string;
  district: string;
  description: string;
  phone_number: string | null;
  opening_hours: Record<string, string> | null;
  price_range: "$" | "$$" | "$$$" | "$$$$" | null;
  google_maps_uri: string | null;
  google_place_id: string | null;
  google_rating: number | null;
  google_review_count: number | null;
  google_review_summary: string | null;
  google_highlights: string[] | null;
}

// ─── Helpers ─────────────────────────────────────────────────────────────

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

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function log(message: string) {
  const time = new Date().toLocaleTimeString("vi-VN");
  console.log(`[${time}] ${message}`);
}

function logError(message: string) {
  const time = new Date().toLocaleTimeString("vi-VN");
  console.error(`[${time}] ERROR: ${message}`);
}

// ─── Gemini + Google Maps Grounding ──────────────────────────────────────

async function searchGoogleMaps(
  query: string
): Promise<ParsedLocation[]> {
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
  + Tóm tắt review: Tổng hợp ý kiến nổi bật từ các review Google thành 2-3 câu bằng tiếng Việt
  + Điểm nổi bật: Danh sách 3-5 keyword ngắn gọn rút ra từ review

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
  "google_review_summary": "tóm tắt review bằng tiếng Việt (NẾU KHÔNG CÓ review thật thì set null, KHÔNG bịa)",
  "google_highlights": ["keyword1", "keyword2", "keyword3"]
}

CHỈ trả về JSON array, không thêm markdown code block hay text nào khác.`;

  const geminiRequest = {
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    tools: [{ googleMaps: {} }],
    toolConfig: {
      retrievalConfig: {
        latLng: { latitude: DEFAULT_LAT, longitude: DEFAULT_LNG },
      },
    },
    generationConfig: {
      temperature: 0.3,
      maxOutputTokens: 8192,
    },
  };

  const response = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(geminiRequest),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Gemini API error ${response.status}: ${errorBody}`);
  }

  const data = await response.json();
  const candidate = data.candidates?.[0];

  if (!candidate) {
    throw new Error("No candidates in Gemini response");
  }

  // Concatenate all text parts (Gemini may split long responses across multiple parts)
  const generatedText = (candidate.content?.parts || [])
    .filter((p: { text?: string }) => p.text)
    .map((p: { text: string }) => p.text)
    .join("");
  const groundingMetadata = candidate.groundingMetadata;

  // Extract Maps grounding chunks
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

  // Parse JSON from Gemini response
  // Gemini sometimes returns multiple ```json blocks or truncated JSON.
  // Strategy: extract all JSON blocks, try each, pick the one that parses
  // with the most results.
  const jsonBlocks: string[] = [];
  const blockPattern = /```json\s*([\s\S]*?)(?:```|$)/g;
  let blockMatch: RegExpExecArray | null;
  while ((blockMatch = blockPattern.exec(generatedText)) !== null) {
    jsonBlocks.push(blockMatch[1].trim());
  }
  // If no fenced blocks, treat the whole text as JSON
  if (jsonBlocks.length === 0) {
    jsonBlocks.push(generatedText.trim());
  }
  if (jsonBlocks.length > 1) {
    log(`  (Found ${jsonBlocks.length} JSON blocks in response, trying each)`);
  }

  function tryParseJsonArray(text: string): unknown[] | null {
    // Direct parse
    try {
      const parsed = JSON.parse(text);
      const arr = Array.isArray(parsed) ? parsed : [parsed];
      return arr;
    } catch {
      // Progressive repair: walk backwards through "}" to find valid JSON
      let pos = text.length;
      for (let attempt = 0; attempt < 50; attempt++) {
        pos = text.lastIndexOf("}", pos - 1);
        if (pos <= 0) break;
        try {
          const repaired = text.substring(0, pos + 1) + "\n]";
          const parsed = JSON.parse(repaired);
          return Array.isArray(parsed) ? parsed : [parsed];
        } catch {
          // keep trying
        }
      }
      return null;
    }
  }

  let parsed: unknown[] | null = null;
  for (const block of jsonBlocks) {
    const result = tryParseJsonArray(block);
    if (result && (!parsed || result.length > parsed.length)) {
      parsed = result;
    }
  }

  if (!parsed || parsed.length === 0) {
    const debugPath = "scripts/debug-gemini-response.txt";
    fs.writeFileSync(debugPath, generatedText);
    throw new Error(
      `Cannot parse Gemini JSON response. Raw text saved to ${debugPath}`
    );
  }

  if (jsonBlocks.length > 1 || parsed.length < jsonBlocks.length) {
    log(`  (Parsed ${parsed.length} locations from best JSON block)`);
  }

  const locations = parsed;

  return locations.map((loc: Record<string, unknown>) => {
    const matchedChunk =
      mapsChunks.find(
        (chunk) =>
          chunk.title &&
          ((loc.name as string) || "")
            .toLowerCase()
            .includes(chunk.title.toLowerCase())
      ) ||
      mapsChunks.find(
        (chunk) =>
          chunk.title &&
          chunk.title
            .toLowerCase()
            .includes(((loc.name as string) || "").toLowerCase())
      );

    // Parse google_highlights
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
      google_maps_uri: matchedChunk?.uri || null,
      google_place_id: matchedChunk?.placeId || null,
      google_rating:
        typeof loc.google_rating === "number" ? loc.google_rating : null,
      google_review_count:
        typeof loc.google_review_count === "number"
          ? loc.google_review_count
          : null,
      google_review_summary: cleanReview(loc.google_review_summary as string),
      google_highlights: highlights,
    };
  });
}

// ─── Database Insert ─────────────────────────────────────────────────────

async function insertLocations(
  supabase: ReturnType<typeof createClient>,
  locations: ParsedLocation[]
): Promise<{ inserted: number; skipped: number; errors: number }> {
  let inserted = 0;
  let skipped = 0;
  let errors = 0;

  for (const loc of locations) {
    const slug = slugify(loc.name);

    // Check for duplicate
    const { data: existing } = await supabase
      .from("locations")
      .select("id")
      .eq("slug", slug)
      .maybeSingle();

    if (existing) {
      log(`  SKIP: "${loc.name}" (slug đã tồn tại: ${slug})`);
      skipped++;
      continue;
    }

    const { error } = await supabase.from("locations").insert({
      name: loc.name,
      slug,
      address: loc.address,
      district: loc.district,
      description: loc.description,
      phone_number: loc.phone_number,
      opening_hours: loc.opening_hours as unknown,
      price_range: loc.price_range,
      status: "published",
      average_rating: loc.google_rating || 0,
      review_count: loc.google_review_count || 0,
      google_maps_uri: loc.google_maps_uri,
      google_place_id: loc.google_place_id,
      google_rating: loc.google_rating,
      google_review_count: loc.google_review_count,
      google_review_summary: loc.google_review_summary,
      google_highlights: loc.google_highlights,
    } as never);

    if (error) {
      logError(`  FAIL: "${loc.name}" - ${error.message}`);
      errors++;
    } else {
      log(`  OK: "${loc.name}" (${loc.district})`);
      inserted++;
    }
  }

  return { inserted, skipped, errors };
}

// ─── Main ────────────────────────────────────────────────────────────────

async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0 || args.includes("--help")) {
    console.log(`
Import locations from Google Maps via Gemini AI

Usage:
  npx tsx scripts/import-from-maps.ts "quán phở ngon quận 1"
  npx tsx scripts/import-from-maps.ts --file queries.txt
  npx tsx scripts/import-from-maps.ts --file queries.txt --dry-run

Options:
  --file <path>   Read queries from a text file (one per line)
  --dry-run       Preview without inserting into DB
  --delay <ms>    Delay between queries (default: 2000)
  --help          Show this help
    `);
    process.exit(0);
  }

  // Validate env
  if (!GEMINI_API_KEY) {
    logError("GEMINI_API_KEY is not set");
    process.exit(1);
  }

  const isDryRun = args.includes("--dry-run");
  const delayIndex = args.indexOf("--delay");
  const delay = delayIndex >= 0 ? parseInt(args[delayIndex + 1], 10) : 2000;

  // Parse queries
  let queries: string[] = [];
  const fileIndex = args.indexOf("--file");
  if (fileIndex >= 0) {
    const filePath = args[fileIndex + 1];
    if (!filePath) {
      logError("--file requires a file path argument");
      process.exit(1);
    }
    const resolvedPath = path.resolve(filePath);
    if (!fs.existsSync(resolvedPath)) {
      logError(`File not found: ${resolvedPath}`);
      process.exit(1);
    }
    queries = fs
      .readFileSync(resolvedPath, "utf-8")
      .split("\n")
      .map((q) => q.trim())
      .filter((q) => q && !q.startsWith("#"));
  } else {
    // Collect non-flag arguments as queries
    queries = args.filter(
      (a) => !a.startsWith("--") && (args.indexOf(a) === 0 || !args[args.indexOf(a) - 1]?.startsWith("--"))
    );
  }

  if (queries.length === 0) {
    logError("No queries provided");
    process.exit(1);
  }

  log(`Mode: ${isDryRun ? "DRY RUN" : "LIVE INSERT"}`);
  log(`Queries: ${queries.length}`);
  log(`Delay: ${delay}ms between queries`);
  console.log("");

  // Init Supabase client (only if not dry-run)
  let supabase: ReturnType<typeof createClient> | null = null;
  if (!isDryRun) {
    if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
      logError(
        "NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required for live insert"
      );
      process.exit(1);
    }
    supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
  }

  let totalInserted = 0;
  let totalSkipped = 0;
  let totalErrors = 0;
  let totalFound = 0;

  for (let i = 0; i < queries.length; i++) {
    const query = queries[i];
    log(`[${i + 1}/${queries.length}] Searching: "${query}"`);

    try {
      const locations = await searchGoogleMaps(query);
      totalFound += locations.length;
      log(`  Found ${locations.length} locations`);

      if (isDryRun) {
        // Print preview
        for (const loc of locations) {
          console.log(`    - ${loc.name}`);
          console.log(`      ${loc.address} (${loc.district})`);
          console.log(
            `      ${loc.description.substring(0, 100)}${loc.description.length > 100 ? "..." : ""}`
          );
          if (loc.price_range) console.log(`      Giá: ${loc.price_range}`);
          if (loc.google_rating) console.log(`      Google: ${loc.google_rating}/5 (${loc.google_review_count || '?'} reviews)`);
          if (loc.google_review_summary) console.log(`      Review: "${loc.google_review_summary.substring(0, 120)}${loc.google_review_summary.length > 120 ? '...' : ''}"`);
          if (loc.google_highlights?.length) console.log(`      Tags: ${loc.google_highlights.join(', ')}`);
          if (loc.google_maps_uri)
            console.log(`      Maps: ${loc.google_maps_uri}`);
          console.log("");
        }
      } else if (supabase) {
        const result = await insertLocations(supabase, locations);
        totalInserted += result.inserted;
        totalSkipped += result.skipped;
        totalErrors += result.errors;
      }
    } catch (error) {
      logError(
        `Query "${query}" failed: ${error instanceof Error ? error.message : String(error)}`
      );
      totalErrors++;
    }

    // Delay between queries to avoid rate limiting
    if (i < queries.length - 1) {
      await sleep(delay);
    }
  }

  // Summary
  console.log("");
  log("═══════════════════════════════════════");
  log("KẾT QUẢ TỔNG HỢP");
  log("═══════════════════════════════════════");
  log(`Tổng tìm thấy: ${totalFound} địa điểm`);
  if (!isDryRun) {
    log(`Đã import:      ${totalInserted}`);
    log(`Đã bỏ qua:      ${totalSkipped} (trùng)`);
    log(`Lỗi:            ${totalErrors}`);
  }
}

main().catch((err) => {
  logError(err.message || String(err));
  process.exit(1);
});
