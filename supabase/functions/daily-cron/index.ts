/**
 * Daily Cron Orchestrator
 *
 * Runs all daily automated tasks in sequence:
 *   1. Crawl new locations from Google Maps (daily-location-crawl)
 *   2. Enrich pending community submissions (enrich-submission)
 *   3. Enrich published locations missing data (enrich-locations)
 *   4. Generate AI collections (generate-playlist)
 *   5. Generate covers for collections missing cover_image_url (generate-collection-covers)
 *   6. Generate SEO blog posts (generate-blog-posts)
 *   7. Generate covers for blog posts missing cover_image_url (generate-blog-covers)
 *
 * Setup in Supabase SQL Editor:
 *   -- Enable extensions (one-time)
 *   CREATE EXTENSION IF NOT EXISTS pg_cron;
 *   CREATE EXTENSION IF NOT EXISTS pg_net;
 *
 *   -- Schedule daily at 6:00 AM UTC (1:00 PM Vietnam time)
 *   SELECT cron.schedule(
 *     'daily-automation',
 *     '0 6 * * *',
 *     $$
 *     SELECT net.http_post(
 *       url := '<SUPABASE_URL>/functions/v1/daily-cron',
 *       headers := jsonb_build_object(
 *         'Authorization', 'Bearer <SUPABASE_SERVICE_ROLE_KEY>',
 *         'Content-Type', 'application/json'
 *       ),
 *       body := '{}'::jsonb
 *     );
 *     $$
 *   );
 *
 *   -- To remove old schedule:
 *   SELECT cron.unschedule('daily-playlist');
 *
 * Or via external HTTP call:
 *   curl -X POST '<SUPABASE_URL>/functions/v1/daily-cron' \
 *     -H 'Authorization: Bearer <SERVICE_ROLE_KEY>'
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

interface TaskResult {
  name: string;
  success: boolean;
  duration_ms: number;
  data?: unknown;
  error?: string;
}

async function runTask(name: string, functionName: string, body: unknown): Promise<TaskResult> {
  const start = Date.now();
  console.log(`[Daily Cron] Starting task: ${name}`);

  try {
    const response = await fetch(
      `${SUPABASE_URL}/functions/v1/${functionName}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      }
    );

    const duration = Date.now() - start;

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[Daily Cron] Task ${name} failed: ${response.status} ${errorText}`);
      return {
        name,
        success: false,
        duration_ms: duration,
        error: `HTTP ${response.status}: ${errorText.substring(0, 200)}`,
      };
    }

    const result = await response.json();
    console.log(`[Daily Cron] Task ${name} completed in ${duration}ms`);

    return {
      name,
      success: true,
      duration_ms: duration,
      data: result,
    };
  } catch (err) {
    const duration = Date.now() - start;
    console.error(`[Daily Cron] Task ${name} error:`, err);
    return {
      name,
      success: false,
      duration_ms: duration,
      error: (err as Error).message,
    };
  }
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
    }

    const startTime = Date.now();
    const today = new Date().toISOString();
    console.log(`[Daily Cron] Starting at ${today}`);

    const body: any = await req.json().catch(() => ({}));
    // Allow skipping tasks via request body
    const skipCrawl = body.skip_crawl === true;
    const skipEnrich = body.skip_enrich === true;
    const skipEnrichLocations = body.skip_enrich_locations === true;
    const skipPlaylist = body.skip_playlist === true;
    const skipCollectionCovers = body.skip_collection_covers === true;
    const skipBlogPosts = body.skip_blog_posts === true;
    const skipBlogCovers = body.skip_blog_covers === true;

    const results: TaskResult[] = [];

    // Task 1: Crawl new locations (3 random queries)
    if (!skipCrawl) {
      const crawlResult = await runTask(
        "Crawl địa điểm mới",
        "daily-location-crawl",
        { query_count: 3 }
      );
      results.push(crawlResult);
    }

    // Task 2: Enrich pending submissions
    if (!skipEnrich) {
      const enrichResult = await runTask(
        "Enrich submissions",
        "enrich-submission",
        {}
      );
      results.push(enrichResult);
    }

    // Task 3: Enrich published locations missing data
    if (!skipEnrichLocations) {
      const enrichLocResult = await runTask(
        "Enrich locations thiếu data",
        "enrich-locations",
        { batch_size: 10 }
      );
      results.push(enrichLocResult);
    }

    // Task 4: Generate AI collections (one at a time for reliability)
    if (!skipPlaylist) {
      const playlistCount = 3;
      for (let i = 1; i <= playlistCount; i++) {
        const playlistResult = await runTask(
          `Tạo bộ sưu tập AI (${i}/${playlistCount})`,
          "generate-playlist",
          { count: 1, auto_publish: true }
        );
        results.push(playlistResult);
        // Small delay between requests to avoid rate limits
        if (i < playlistCount) {
          await new Promise((r) => setTimeout(r, 2000));
        }
      }
    }

    // Task 5: Generate covers for collections missing images
    if (!skipCollectionCovers) {
      const coverResult = await runTask(
        "Tạo ảnh cover bộ sưu tập",
        "generate-collection-covers",
        { limit: 5 }
      );
      results.push(coverResult);
    }

    // Task 6: Generate SEO blog posts (2 per day)
    if (!skipBlogPosts) {
      const blogResult = await runTask(
        "Tạo bài blog SEO",
        "generate-blog-posts",
        { count: 2 }
      );
      results.push(blogResult);
    }

    // Task 7: Generate covers for blog posts missing images
    if (!skipBlogCovers) {
      const blogCoverResult = await runTask(
        "Tạo ảnh cover bài blog",
        "generate-blog-covers",
        { limit: 3 }
      );
      results.push(blogCoverResult);
    }

    const totalDuration = Date.now() - startTime;
    const successCount = results.filter((r) => r.success).length;

    console.log(
      `[Daily Cron] Completed: ${successCount}/${results.length} tasks in ${totalDuration}ms`
    );

    return new Response(
      JSON.stringify({
        success: successCount === results.length,
        date: today,
        total_duration_ms: totalDuration,
        tasks_completed: successCount,
        tasks_total: results.length,
        results,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("[Daily Cron] Fatal:", error);
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
