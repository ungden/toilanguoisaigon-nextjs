-- Add review_insights JSONB column to locations table
-- Stores rich review data from Google Search grounding:
-- {
--   "top_reviews": [{"author": "...", "rating": 5, "text": "...", "time": "..."}],
--   "review_themes": ["chủ đề 1", "chủ đề 2"],
--   "pros": ["điểm mạnh 1", ...],
--   "cons": ["điểm yếu 1", ...],
--   "best_dishes": ["món nổi bật 1", ...],
--   "atmosphere": "mô tả không gian",
--   "typical_visit": "mô tả trải nghiệm 1 lần ghé quán"
-- }

ALTER TABLE locations ADD COLUMN IF NOT EXISTS review_insights jsonb DEFAULT NULL;

COMMENT ON COLUMN locations.review_insights IS 'Rich review data from Google Search: top_reviews, themes, pros, cons, best_dishes, atmosphere, typical_visit';
