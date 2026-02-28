-- ============================================================
-- Daily Cron Setup
-- 
-- Replaces the old daily-playlist-cron with a unified daily-cron
-- orchestrator that runs:
--   1. daily-location-crawl (crawl new locations from Google Maps)
--   2. enrich-submission (enrich pending community submissions)
--   3. generate-playlist (create AI playlists)
--
-- Prerequisites: pg_cron and pg_net must be enabled in Supabase Dashboard
--   Database → Extensions → Enable pg_cron and pg_net
--
-- Apply via Supabase Dashboard → SQL Editor
-- ============================================================

-- Enable extensions (idempotent)
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Remove old schedule if exists
SELECT cron.unschedule('daily-playlist')
WHERE EXISTS (
  SELECT 1 FROM cron.job WHERE jobname = 'daily-playlist'
);

-- Schedule the unified daily cron
-- Runs at 6:00 AM UTC = 1:00 PM Vietnam time (ICT, UTC+7)
SELECT cron.schedule(
  'daily-automation',
  '0 6 * * *',
  $$
  SELECT net.http_post(
    url := current_setting('app.settings.supabase_url') || '/functions/v1/daily-cron',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key'),
      'Content-Type', 'application/json'
    ),
    body := '{}'::jsonb
  );
  $$
);

-- Verify setup
-- SELECT * FROM cron.job;
-- To manually trigger: SELECT net.http_post(...) with the daily-cron URL
