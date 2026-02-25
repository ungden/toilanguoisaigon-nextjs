/**
 * Daily Playlist Cron Job
 *
 * This function is meant to be called by a Supabase cron job (pg_cron)
 * or an external scheduler (e.g., GitHub Actions, Vercel Cron) once per day.
 *
 * It calls the generate-playlist Edge Function to create daily playlists.
 *
 * Setup in Supabase SQL Editor:
 *   SELECT cron.schedule(
 *     'daily-playlist',
 *     '0 6 * * *',  -- Every day at 6:00 AM UTC (1:00 PM Vietnam time)
 *     $$
 *     SELECT net.http_post(
 *       url := '<SUPABASE_URL>/functions/v1/daily-playlist-cron',
 *       headers := jsonb_build_object(
 *         'Authorization', 'Bearer <SUPABASE_SERVICE_ROLE_KEY>',
 *         'Content-Type', 'application/json'
 *       ),
 *       body := '{}'::jsonb
 *     );
 *     $$
 *   );
 *
 * Or via external HTTP call:
 *   curl -X POST '<SUPABASE_URL>/functions/v1/daily-playlist-cron' \
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

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
    }

    console.log(`[Daily Playlist Cron] Starting at ${new Date().toISOString()}`);

    // Call generate-playlist function
    const response = await fetch(
      `${SUPABASE_URL}/functions/v1/generate-playlist`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          count: 3,
          auto_publish: true,
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `generate-playlist failed: ${response.status} ${errorText}`
      );
    }

    const result = await response.json();

    console.log(
      `[Daily Playlist Cron] Created ${result.total} playlists for ${result.date}`
    );

    return new Response(
      JSON.stringify({
        success: true,
        message: `Created ${result.total} playlists`,
        details: result,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("[Daily Playlist Cron] Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
