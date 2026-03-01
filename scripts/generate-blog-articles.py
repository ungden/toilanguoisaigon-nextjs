"""
Generate SEO-optimized blog articles using Gemini AI + real location data.

Each article references real locations from the database (name, address, rating,
price, review summary) so the content is genuinely useful — not generic AI slop.

Usage:
  export SUPABASE_URL="https://wsysphytctpgbzoatuzw.supabase.co"
  export SUPABASE_SERVICE_ROLE_KEY="eyJ..."
  export GEMINI_API_KEY="AIzaSy..."
  python3 scripts/generate-blog-articles.py
  python3 scripts/generate-blog-articles.py --dry-run     # preview topics only
  python3 scripts/generate-blog-articles.py --limit 5     # generate only 5 articles
"""

import argparse
import json
import math
import os
import re
import sys
import time
import unicodedata
import requests
from typing import Optional

# ─── Config ──────────────────────────────────────────────────────────────────

SUPABASE_URL = os.environ.get("SUPABASE_URL", "")
SERVICE_ROLE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "")
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "")
PROJECT_REF = os.environ.get("SUPABASE_PROJECT_REF", "wsysphytctpgbzoatuzw")
MGMT_API_URL = f"https://api.supabase.com/v1/projects/{PROJECT_REF}/database/query"
MGMT_TOKEN = os.environ.get("SUPABASE_ACCESS_TOKEN", "")

GEMINI_MODEL = "gemini-3-flash-preview"
GEMINI_URL = f"https://generativelanguage.googleapis.com/v1beta/models/{GEMINI_MODEL}:generateContent?key={GEMINI_API_KEY}"

SITE_URL = "https://www.toilanguoisaigon.com"

HEADERS_REST = {
    "apikey": SERVICE_ROLE_KEY,
    "Authorization": f"Bearer {SERVICE_ROLE_KEY}",
    "Content-Type": "application/json",
    "Prefer": "return=representation",
}

HEADERS_MGMT = {
    "Authorization": f"Bearer {MGMT_TOKEN}",
    "Content-Type": "application/json",
}


# ─── Helpers ─────────────────────────────────────────────────────────────────

def slugify(text: str) -> str:
    """Vietnamese-safe slugify."""
    text = unicodedata.normalize("NFD", text)
    text = "".join(c for c in text if unicodedata.category(c) != "Mn")
    text = re.sub(r"[^\w\s-]", "", text.lower())
    text = re.sub(r"[-\s]+", "-", text).strip("-")
    return text


def run_sql(sql: str):
    """Execute SQL via Supabase Management API."""
    if not MGMT_TOKEN:
        return None
    resp = requests.post(MGMT_API_URL, headers=HEADERS_MGMT, json={"query": sql})
    if resp.status_code not in (200, 201):
        print(f"  SQL ERROR ({resp.status_code}): {resp.text[:500]}")
        return None
    return resp.json()


def rest_get(table: str, params: dict = None):
    url = f"{SUPABASE_URL}/rest/v1/{table}"
    resp = requests.get(url, headers=HEADERS_REST, params=params or {})
    if resp.status_code != 200:
        print(f"  REST GET error ({resp.status_code}): {resp.text[:300]}")
        return []
    return resp.json()


def rest_post(table: str, data):
    url = f"{SUPABASE_URL}/rest/v1/{table}"
    resp = requests.post(url, headers=HEADERS_REST, json=data)
    if resp.status_code not in (200, 201):
        print(f"  REST POST error ({resp.status_code}): {resp.text[:300]}")
        return None
    return resp.json()


def call_gemini(prompt: str, max_tokens: int = 8192, temperature: float = 0.8) -> Optional[str]:
    """Call Gemini API and return text response."""
    body = {
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {
            "temperature": temperature,
            "maxOutputTokens": max_tokens,
        },
    }
    for attempt in range(3):
        try:
            resp = requests.post(GEMINI_URL, json=body, timeout=120)
            if resp.status_code == 429:
                wait = 30 * (attempt + 1)
                print(f"  Rate limited, waiting {wait}s...")
                time.sleep(wait)
                continue
            if resp.status_code != 200:
                print(f"  Gemini error ({resp.status_code}): {resp.text[:300]}")
                return None
            data = resp.json()
            text = data["candidates"][0]["content"]["parts"][0]["text"]
            return text.strip()
        except Exception as e:
            print(f"  Gemini exception: {e}")
            time.sleep(5)
    return None


def estimate_reading_time(html: str) -> int:
    """Estimate reading time in minutes from HTML content."""
    text = re.sub(r"<[^>]+>", " ", html)
    words = len(text.split())
    return max(3, math.ceil(words / 200))


def format_location_data(locations: list) -> str:
    """Format location data for Gemini prompt context."""
    lines = []
    for loc in locations:
        parts = [f"- **{loc['name']}**"]
        if loc.get("address"):
            parts.append(f"  Địa chỉ: {loc['address']}, {loc.get('district', '')}")
        if loc.get("google_rating"):
            parts.append(f"  Rating: {loc['google_rating']}/5 ({loc.get('google_review_count', 0)} reviews)")
        if loc.get("price_range"):
            pr = {"$": "dưới 50k", "$$": "50k-200k", "$$$": "200k-500k", "$$$$": "trên 500k"}.get(loc["price_range"], loc["price_range"])
            parts.append(f"  Giá: {pr}")
        if loc.get("google_review_summary"):
            summary = loc["google_review_summary"][:150]
            parts.append(f"  Nhận xét: \"{summary}\"")
        if loc.get("slug"):
            parts.append(f"  Link: /place/{loc['slug']}")
        lines.append("\n".join(parts))
    return "\n\n".join(lines)


def get_existing_slugs() -> set:
    """Get slugs of already-published posts."""
    posts = rest_get("posts", {"select": "slug", "status": "eq.published"})
    return {p["slug"] for p in posts} if posts else set()


# ─── Topic Definitions ───────────────────────────────────────────────────────

def build_topics() -> list:
    """Build the full list of 50 article topics with SQL queries for location data."""
    topics = []

    # ── 10 District Guides ──
    top_districts = [
        ("Quận 1", 20), ("Quận 3", 15), ("Bình Thạnh", 12), ("Quận 5", 12),
        ("Quận 10", 12), ("Thủ Đức", 10), ("Quận 4", 10), ("Quận 7", 10),
        ("Phú Nhuận", 10), ("Gò Vấp", 10),
    ]
    for district, limit in top_districts:
        topics.append({
            "title": f"Ăn gì ở {district}: Top quán ngon nhất 2026",
            "category": "guide",
            "tags": [district.lower(), "ăn gì", "quán ngon"],
            "meta_description": f"Khám phá {limit}+ quán ăn ngon nhất {district} — từ vỉa hè bình dân đến nhà hàng sang trọng. Cập nhật 2026.",
            "location_sql": f"""
                SELECT name, slug, address, district, google_rating, google_review_count, 
                       price_range, google_review_summary, opening_hours
                FROM locations WHERE status = 'published' AND district = '{district}'
                ORDER BY COALESCE(google_rating, 0) DESC LIMIT {limit}
            """,
            "prompt_template": "district_guide",
        })

    # ── 15 Food Category Guides ──
    food_categories = [
        ("Phở", "phở|pho", "phở"),
        ("Bún", "bún|bun ", "bún"),
        ("Cơm", "cơm|com tấm|cơm tấm", "cơm"),
        ("Bánh mì", "bánh mì|banh mi", "bánh mì"),
        ("Cà phê", "cà phê|cafe|coffee|ca phe", "cà phê"),
        ("Ốc & Hải sản", "ốc|hải sản|seafood|ghẹ|cua|tôm", "ốc hải sản"),
        ("Lẩu & Nướng", "lẩu|hotpot|nướng|bbq|korean bbq", "lẩu nướng"),
        ("Chè & Tráng miệng", "chè|kem|bánh|dessert|trà sữa", "chè tráng miệng"),
        ("Hủ tiếu & Mì", "hủ tiếu|hủ tíu|mì |ramen", "hủ tiếu mì"),
        ("Chay", "chay|vegan|vegetarian", "ăn chay"),
        ("Nhậu & Bia", "nhậu|bia|beer|quán nhậu", "nhậu bia"),
        ("Kem & Gelato", "kem|gelato|ice cream", "kem gelato"),
        ("Bánh canh", "bánh canh", "bánh canh"),
        ("Cháo", "cháo|chao", "cháo"),
        ("Xôi", "xôi|xoi", "xôi"),
    ]
    for display_name, regex_pattern, tag in food_categories:
        topics.append({
            "title": f"{display_name} Sài Gòn: Những quán ngon nhất bạn không thể bỏ lỡ",
            "category": "guide",
            "tags": [tag, "sài gòn", "quán ngon", "ẩm thực"],
            "meta_description": f"Tổng hợp quán {display_name.lower()} ngon nhất Sài Gòn — từ vỉa hè đến nhà hàng. Review chi tiết kèm địa chỉ, giá, rating.",
            "location_sql": f"""
                SELECT name, slug, address, district, google_rating, google_review_count,
                       price_range, google_review_summary
                FROM locations WHERE status = 'published' AND LOWER(name) ~* '({regex_pattern})'
                ORDER BY COALESCE(google_rating, 0) DESC LIMIT 15
            """,
            "prompt_template": "food_category_guide",
        })

    # ── 10 Listicles ──
    listicles = [
        {
            "title": "Top 10 quán cà phê view đẹp Sài Gòn cho ngày cuối tuần",
            "tags": ["cà phê", "view đẹp", "cuối tuần"],
            "meta_description": "10 quán cà phê có view đẹp nhất Sài Gòn — rooftop, sân vườn, bên sông. Chill hết nấc cho cuối tuần.",
            "location_sql": """
                SELECT name, slug, address, district, google_rating, google_review_count, price_range, google_review_summary
                FROM locations WHERE status = 'published' 
                AND LOWER(name) ~* '(cà phê|cafe|coffee)' AND COALESCE(google_rating, 0) >= 4.0
                ORDER BY google_review_count DESC NULLS LAST LIMIT 12
            """,
        },
        {
            "title": "7 quán ăn trong hẻm bí mật Sài Gòn mà chỉ dân địa phương biết",
            "tags": ["hẻm", "bí mật", "bình dân"],
            "meta_description": "Khám phá 7 quán ăn hẻm bí mật ở Sài Gòn — ngon, rẻ, và chỉ dân local mới biết đường vào.",
            "location_sql": """
                SELECT name, slug, address, district, google_rating, google_review_count, price_range, google_review_summary
                FROM locations WHERE status = 'published' AND price_range = '$' AND COALESCE(google_rating, 0) >= 4.3
                ORDER BY google_rating DESC LIMIT 10
            """,
        },
        {
            "title": "10 quán ăn khuya Sài Gòn cho dân cú đêm",
            "tags": ["ăn khuya", "đêm", "sài gòn"],
            "meta_description": "Đói lúc nửa đêm? 10 quán ăn khuya ngon nhất Sài Gòn mở đến 2-3 giờ sáng.",
            "location_sql": """
                SELECT name, slug, address, district, google_rating, google_review_count, price_range, google_review_summary
                FROM locations WHERE status = 'published'
                AND LOWER(COALESCE(google_review_summary, '') || ' ' || COALESCE(opening_hours, '')) ~* '(khuya|đêm|late|midnight|2h|3h|24h)'
                ORDER BY COALESCE(google_rating, 0) DESC LIMIT 12
            """,
        },
        {
            "title": "Top 5 quán buffet ngon giá hời ở Sài Gòn",
            "tags": ["buffet", "ăn thả ga"],
            "meta_description": "5 quán buffet ngon nhất Sài Gòn — lẩu nướng, hải sản, BBQ. Ăn thả ga giá phải chăng.",
            "location_sql": """
                SELECT name, slug, address, district, google_rating, google_review_count, price_range, google_review_summary
                FROM locations WHERE status = 'published'
                AND LOWER(name) ~* '(buffet|bbq|nướng.*lẩu|lẩu.*nướng|shabu|yakiniku)'
                ORDER BY COALESCE(google_rating, 0) DESC LIMIT 8
            """,
        },
        {
            "title": "10 quán hẹn hò lãng mạn nhất Sài Gòn cho Date Night",
            "tags": ["date night", "lãng mạn", "hẹn hò"],
            "meta_description": "10 quán ăn lãng mạn nhất Sài Gòn cho buổi hẹn hò hoàn hảo — từ rooftop đến nhà hàng fine dining.",
            "location_sql": """
                SELECT name, slug, address, district, google_rating, google_review_count, price_range, google_review_summary
                FROM locations WHERE status = 'published'
                AND (price_range IN ('$$$', '$$$$') OR LOWER(name) ~* '(rooftop|lounge|wine|steak|garden|terrace|bistro)')
                ORDER BY COALESCE(google_rating, 0) DESC LIMIT 12
            """,
        },
        {
            "title": "Top 8 quán ăn healthy & eat clean ở Sài Gòn",
            "tags": ["healthy", "eat clean", "sài gòn"],
            "meta_description": "8 quán ăn healthy ngon nhất Sài Gòn — salad, smoothie bowl, đồ chay, organic food cho dân eat clean.",
            "location_sql": """
                SELECT name, slug, address, district, google_rating, google_review_count, price_range, google_review_summary
                FROM locations WHERE status = 'published'
                AND LOWER(name) ~* '(healthy|salad|chay|vegan|organic|clean|smoothie|detox|zen)'
                ORDER BY COALESCE(google_rating, 0) DESC LIMIT 10
            """,
        },
        {
            "title": "10 quán ăn ngon dưới 50k ở Sài Gòn cho sinh viên",
            "tags": ["giá rẻ", "sinh viên", "bình dân"],
            "meta_description": "10 quán ăn ngon dưới 50k tại Sài Gòn — bình dân, no bụng, hợp túi tiền sinh viên.",
            "location_sql": """
                SELECT name, slug, address, district, google_rating, google_review_count, price_range, google_review_summary
                FROM locations WHERE status = 'published' AND price_range = '$' AND COALESCE(google_rating, 0) >= 4.0
                ORDER BY google_review_count DESC NULLS LAST LIMIT 12
            """,
        },
        {
            "title": "Top 5 rooftop bar view đẹp nhất Sài Gòn",
            "tags": ["rooftop", "bar", "view đẹp"],
            "meta_description": "5 rooftop bar đẹp nhất Sài Gòn — cocktail ngon, view thành phố lung linh.",
            "location_sql": """
                SELECT name, slug, address, district, google_rating, google_review_count, price_range, google_review_summary
                FROM locations WHERE status = 'published'
                AND LOWER(name) ~* '(rooftop|sky bar|terrace|lounge)'
                ORDER BY COALESCE(google_rating, 0) DESC LIMIT 8
            """,
        },
        {
            "title": "10 quán bún bò Huế ngon nhức nách tại Sài Gòn",
            "tags": ["bún bò huế", "huế", "sài gòn"],
            "meta_description": "10 quán bún bò Huế ngon nhất Sài Gòn — cay nồng, đậm đà, chuẩn vị miền Trung.",
            "location_sql": """
                SELECT name, slug, address, district, google_rating, google_review_count, price_range, google_review_summary
                FROM locations WHERE status = 'published'
                AND LOWER(name) ~* '(bún bò|bun bo|huế|hue)'
                ORDER BY COALESCE(google_rating, 0) DESC LIMIT 12
            """,
        },
        {
            "title": "10 quán ăn mới đang viral trên TikTok Sài Gòn 2026",
            "tags": ["viral", "tiktok", "quán mới"],
            "meta_description": "10 quán ăn mới nhất Sài Gòn đang hot rần rần trên TikTok và Instagram. Cập nhật 2026.",
            "location_sql": """
                SELECT name, slug, address, district, google_rating, google_review_count, price_range, google_review_summary
                FROM locations WHERE status = 'published'
                AND COALESCE(google_review_count, 0) >= 100 AND COALESCE(google_rating, 0) >= 4.0
                ORDER BY created_at DESC LIMIT 12
            """,
        },
    ]
    for item in listicles:
        topics.append({
            "title": item["title"],
            "category": "listicle",
            "tags": item["tags"],
            "meta_description": item["meta_description"],
            "location_sql": item["location_sql"],
            "prompt_template": "listicle",
        })

    # ── 5 Culture/Story ──
    culture_topics = [
        {
            "title": "Lịch sử phở Sài Gòn: Từ gánh hàng rong đến nhà hàng triệu đô",
            "tags": ["phở", "lịch sử", "văn hóa"],
            "meta_description": "Hành trình phở Sài Gòn qua hơn 100 năm — từ gánh hàng rong đầu tiên đến chuỗi nhà hàng hiện đại.",
            "location_sql": """
                SELECT name, slug, address, district, google_rating, google_review_count, price_range, google_review_summary
                FROM locations WHERE status = 'published' AND LOWER(name) ~* '(phở|pho)'
                ORDER BY COALESCE(google_rating, 0) DESC LIMIT 8
            """,
        },
        {
            "title": "Văn hóa cà phê vợt Sài Gòn: Khi ly cà phê kể chuyện thời gian",
            "tags": ["cà phê vợt", "văn hóa", "hoài niệm"],
            "meta_description": "Khám phá văn hóa cà phê vợt độc đáo của Sài Gòn — nơi mỗi ly cà phê mang theo ký ức của cả một thế hệ.",
            "location_sql": """
                SELECT name, slug, address, district, google_rating, google_review_count, price_range, google_review_summary
                FROM locations WHERE status = 'published' AND LOWER(name) ~* '(cà phê|cafe|coffee)'
                ORDER BY COALESCE(google_rating, 0) DESC LIMIT 8
            """,
        },
        {
            "title": "Ẩm thực Chợ Lớn: Hành trình khám phá khu phố Tàu Sài Gòn",
            "tags": ["chợ lớn", "quận 5", "ẩm thực hoa"],
            "meta_description": "Khám phá ẩm thực Chợ Lớn Quận 5 — dim sum, hủ tiếu, bánh bao và những món Hoa truyền thống.",
            "location_sql": """
                SELECT name, slug, address, district, google_rating, google_review_count, price_range, google_review_summary
                FROM locations WHERE status = 'published' AND district = 'Quận 5'
                ORDER BY COALESCE(google_rating, 0) DESC LIMIT 12
            """,
        },
        {
            "title": "Vỉa hè Sài Gòn: Nghệ thuật ăn uống trên ghế nhựa",
            "tags": ["vỉa hè", "bình dân", "văn hóa"],
            "meta_description": "Vỉa hè Sài Gòn không chỉ là nơi ăn uống — đó là nghệ thuật, văn hóa và linh hồn thành phố.",
            "location_sql": """
                SELECT name, slug, address, district, google_rating, google_review_count, price_range, google_review_summary
                FROM locations WHERE status = 'published' AND price_range = '$'
                ORDER BY COALESCE(google_rating, 0) DESC LIMIT 10
            """,
        },
        {
            "title": "Sài Gòn ăn khuya: Văn hóa đêm của thành phố không ngủ",
            "tags": ["ăn khuya", "đêm", "văn hóa"],
            "meta_description": "Sài Gòn không bao giờ ngủ — khám phá văn hóa ăn khuya độc đáo và những quán ăn đêm huyền thoại.",
            "location_sql": """
                SELECT name, slug, address, district, google_rating, google_review_count, price_range, google_review_summary
                FROM locations WHERE status = 'published'
                ORDER BY COALESCE(google_review_count, 0) DESC LIMIT 10
            """,
        },
    ]
    for item in culture_topics:
        topics.append({
            "title": item["title"],
            "category": "culture",
            "tags": item["tags"],
            "meta_description": item["meta_description"],
            "location_sql": item["location_sql"],
            "prompt_template": "culture_story",
        })

    # ── 5 Practical Guides ──
    practical_topics = [
        {
            "title": "Du lịch Sài Gòn 3 ngày ăn gì? Lịch trình ẩm thực hoàn hảo",
            "tags": ["du lịch", "lịch trình", "3 ngày"],
            "meta_description": "Lịch trình ẩm thực 3 ngày ở Sài Gòn — sáng, trưa, tối, ăn vặt. Trải nghiệm đủ đặc sản Sài Gòn.",
            "location_sql": """
                SELECT name, slug, address, district, google_rating, google_review_count, price_range, google_review_summary
                FROM locations WHERE status = 'published' AND COALESCE(google_rating, 0) >= 4.0
                ORDER BY google_review_count DESC NULLS LAST LIMIT 20
            """,
        },
        {
            "title": "Ăn gì khi trời mưa Sài Gòn? Comfort food cho ngày ướt nhẹp",
            "tags": ["mưa", "comfort food", "ấm cúng"],
            "meta_description": "Trời mưa Sài Gòn ăn gì? Tổng hợp món ngon ấm lòng — phở, bún, cháo, chè nóng cho ngày mưa.",
            "location_sql": """
                SELECT name, slug, address, district, google_rating, google_review_count, price_range, google_review_summary
                FROM locations WHERE status = 'published'
                AND LOWER(name) ~* '(phở|bún|cháo|lẩu|hotpot|súp|mì |hủ tiếu|bánh canh|bò kho|ramen)'
                ORDER BY COALESCE(google_rating, 0) DESC LIMIT 15
            """,
        },
        {
            "title": "Food Tour Quận 1 nửa ngày: Lộ trình ăn sập Sài Gòn",
            "tags": ["food tour", "quận 1", "lộ trình"],
            "meta_description": "Lộ trình food tour Quận 1 nửa ngày — 8 điểm dừng, đi bộ được, ăn đủ đặc sản Sài Gòn.",
            "location_sql": """
                SELECT name, slug, address, district, google_rating, google_review_count, price_range, google_review_summary
                FROM locations WHERE status = 'published' AND district = 'Quận 1'
                ORDER BY COALESCE(google_rating, 0) DESC LIMIT 12
            """,
        },
        {
            "title": "Ăn chay Sài Gòn cho người mới: Hướng dẫn từ A đến Z",
            "tags": ["ăn chay", "vegan", "hướng dẫn"],
            "meta_description": "Hướng dẫn ăn chay Sài Gòn cho người mới — quán ngon, thực đơn, mẹo hay và lưu ý quan trọng.",
            "location_sql": """
                SELECT name, slug, address, district, google_rating, google_review_count, price_range, google_review_summary
                FROM locations WHERE status = 'published'
                AND LOWER(name) ~* '(chay|vegan|vegetarian|zen)'
                ORDER BY COALESCE(google_rating, 0) DESC LIMIT 10
            """,
        },
        {
            "title": "Hướng dẫn ăn uống Quận 5 Chợ Lớn: Thiên đường ẩm thực Hoa",
            "tags": ["quận 5", "chợ lớn", "ẩm thực hoa"],
            "meta_description": "Hướng dẫn ăn uống chi tiết ở Quận 5 Chợ Lớn — dim sum, hủ tiếu, chè, bánh và đặc sản Hoa.",
            "location_sql": """
                SELECT name, slug, address, district, google_rating, google_review_count, price_range, google_review_summary
                FROM locations WHERE status = 'published' AND district = 'Quận 5'
                ORDER BY COALESCE(google_rating, 0) DESC LIMIT 12
            """,
        },
    ]
    for item in practical_topics:
        topics.append({
            "title": item["title"],
            "category": "guide",
            "tags": item["tags"],
            "meta_description": item["meta_description"],
            "location_sql": item["location_sql"],
            "prompt_template": "practical_guide",
        })

    # ── 5 Budget/Occasion ──
    budget_topics = [
        {
            "title": "Ăn sáng Sài Gòn dưới 30k: Ngon, no, rẻ bất ngờ",
            "tags": ["ăn sáng", "giá rẻ", "bình dân"],
            "meta_description": "Ăn sáng Sài Gòn dưới 30k — bánh mì, xôi, bún, phở, hủ tiếu ngon bổ rẻ cho buổi sáng.",
            "location_sql": """
                SELECT name, slug, address, district, google_rating, google_review_count, price_range, google_review_summary
                FROM locations WHERE status = 'published' AND price_range = '$'
                AND LOWER(name) ~* '(bánh mì|xôi|bún|phở|hủ tiếu|cháo|bánh cuốn|cơm tấm)'
                ORDER BY COALESCE(google_rating, 0) DESC LIMIT 12
            """,
        },
        {
            "title": "Date đẹp không cần ví dày: Quán ăn lãng mạn giá bình dân",
            "tags": ["date", "lãng mạn", "giá rẻ"],
            "meta_description": "Hẹn hò lãng mạn nhưng không tốn kém — những quán ăn đẹp giá bình dân ở Sài Gòn.",
            "location_sql": """
                SELECT name, slug, address, district, google_rating, google_review_count, price_range, google_review_summary
                FROM locations WHERE status = 'published' AND price_range IN ('$', '$$')
                AND COALESCE(google_rating, 0) >= 4.0
                ORDER BY google_review_count DESC NULLS LAST LIMIT 12
            """,
        },
        {
            "title": "Quán ăn nhóm 10+ người ở Sài Gòn: Liên hoan, sinh nhật, họp mặt",
            "tags": ["nhóm đông", "liên hoan", "sinh nhật"],
            "meta_description": "Quán ăn phù hợp nhóm đông 10+ người ở Sài Gòn — lẩu nướng, hải sản, quán nhậu có phòng riêng.",
            "location_sql": """
                SELECT name, slug, address, district, google_rating, google_review_count, price_range, google_review_summary
                FROM locations WHERE status = 'published'
                AND (LOWER(name) ~* '(lẩu|nướng|hải sản|bbq|buffet|nhậu|bia)' OR price_range IN ('$$', '$$$'))
                ORDER BY COALESCE(google_review_count, 0) DESC LIMIT 12
            """,
        },
        {
            "title": "Ăn gì cuối tuần cho cả gia đình ở Sài Gòn?",
            "tags": ["cuối tuần", "gia đình", "sài gòn"],
            "meta_description": "Gợi ý quán ăn cuối tuần cho cả gia đình ở Sài Gòn — không gian rộng, có chỗ cho trẻ em, đồ ăn đa dạng.",
            "location_sql": """
                SELECT name, slug, address, district, google_rating, google_review_count, price_range, google_review_summary
                FROM locations WHERE status = 'published' AND price_range IN ('$$', '$$$')
                AND COALESCE(google_rating, 0) >= 4.0
                ORDER BY google_review_count DESC NULLS LAST LIMIT 12
            """,
        },
        {
            "title": "Quán ăn ship tận nơi ngon nhất Sài Gòn: Đặt GrabFood, ShopeeFood",
            "tags": ["giao hàng", "delivery", "ship tận nơi"],
            "meta_description": "Quán ăn ngon nhất để order online ở Sài Gòn — đặt GrabFood, ShopeeFood, giao nhanh đồ vẫn ngon.",
            "location_sql": """
                SELECT name, slug, address, district, google_rating, google_review_count, price_range, google_review_summary
                FROM locations WHERE status = 'published'
                AND COALESCE(google_rating, 0) >= 4.0
                ORDER BY google_review_count DESC NULLS LAST LIMIT 12
            """,
        },
    ]
    for item in budget_topics:
        topics.append({
            "title": item["title"],
            "category": "tip",
            "tags": item["tags"],
            "meta_description": item["meta_description"],
            "location_sql": item["location_sql"],
            "prompt_template": "budget_guide",
        })

    return topics


# ─── Prompt Templates ────────────────────────────────────────────────────────

def build_prompt(topic: dict, locations_text: str) -> str:
    """Build the Gemini prompt for article generation."""
    title = topic["title"]
    template = topic.get("prompt_template", "guide")

    base_instructions = f"""Bạn là một food blogger chuyên nghiệp tại Sài Gòn, viết cho website toilanguoisaigon.com.
Hãy viết một bài blog chi tiết, hấp dẫn, SEO-friendly bằng tiếng Việt có dấu đầy đủ.

TIÊU ĐỀ: {title}

YÊU CẦU CHUNG:
- Viết bằng HTML (dùng h2, h3, p, ul, li, strong, em). KHÔNG dùng h1 (đã có ở layout).
- Bài dài 1500-2500 từ, chia thành nhiều section rõ ràng với headings.
- Giọng văn tự nhiên, trẻ trung, như đang kể cho bạn bè nghe. Tránh giọng văn quảng cáo.
- Mỗi quán ăn được giới thiệu phải có: tên quán (in đậm), địa chỉ, giá cả, và mô tả ngắn.
- Cuối bài có phần "Lời kết" tóm tắt.
- KHÔNG viết lời chào, lời mở đầu dạng "Xin chào các bạn". Bắt đầu thẳng vào nội dung.
- KHÔNG thêm tiêu đề h1 ở đầu bài (tiêu đề đã có sẵn).
- Tuyệt đối KHÔNG bịa ra quán ăn — chỉ sử dụng data có sẵn bên dưới.

DỮ LIỆU THỰC TẾ VỀ CÁC QUÁN ĂN:
{locations_text}
"""

    if template == "district_guide":
        base_instructions += """
HƯỚNG DẪN CỤ THỂ:
- Mở đầu bằng 1-2 paragraph giới thiệu nét đặc trưng ẩm thực của khu vực này.
- Nhóm quán theo loại món (phở/bún, cơm, cafe, nhậu, tráng miệng...) dùng h2 cho mỗi nhóm.
- Mỗi quán có 1 paragraph mô tả, bao gồm: món nên thử, giá, không gian.
- Thêm tips di chuyển / thời gian nên đến.
- Cuối bài: "Bản đồ ăn uống [Quận]" — tóm tắt nhanh 5 quán must-try.
"""
    elif template == "food_category_guide":
        base_instructions += """
HƯỚNG DẪN CỤ THỂ:
- Mở đầu bằng lịch sử/văn hóa ngắn về loại món này ở Sài Gòn (2-3 câu).
- Chia theo phong cách: vỉa hè bình dân, quán có không gian, nhà hàng cao cấp (nếu có).
- Mỗi quán có 1 paragraph: món signature, giá, không gian, review nhanh.
- So sánh các quán với nhau (cái nào ngon nhất, rẻ nhất, đặc biệt nhất).
- Tips: nên ăn giờ nào, gọi món gì, mẹo hay.
"""
    elif template == "listicle":
        base_instructions += """
HƯỚNG DẪN CỤ THỂ:
- Đánh số mỗi quán (1, 2, 3...) dùng h2 hoặc h3.
- Mỗi quán có 2-3 paragraph: mô tả chi tiết, món nên thử, tips.
- Thêm "Tại sao nên đến?" cho mỗi quán — điểm nổi bật.
- Cuối bài: bảng tóm tắt (dùng danh sách) với tên, địa chỉ, giá, rating.
"""
    elif template == "culture_story":
        base_instructions += """
HƯỚNG DẪN CỤ THỂ:
- Viết theo lối kể chuyện (storytelling), giàu cảm xúc và hình ảnh.
- Đan xen giữa lịch sử/văn hóa và giới thiệu quán ăn cụ thể.
- Có thể kể trải nghiệm cá nhân (viết ở ngôi thứ nhất).
- Phần quán ăn: lồng ghép tự nhiên vào câu chuyện, không liệt kê khô khan.
- Cuối bài: suy nghĩ/cảm nhận về tương lai của nét văn hóa ẩm thực này.
"""
    elif template == "practical_guide":
        base_instructions += """
HƯỚNG DẪN CỤ THỂ:
- Cấu trúc thực tế, dễ follow (theo giờ, theo ngày, theo bước).
- Mỗi gợi ý kèm lý do cụ thể tại sao nên chọn.
- Tips thực tế: giá, giờ mở cửa, cách đi, nên đặt trước không.
- Có section "Lưu ý" hoặc "Mẹo hay" cho người đọc.
"""
    elif template == "budget_guide":
        base_instructions += """
HƯỚNG DẪN CỤ THỂ:
- Nhấn mạnh giá cả cụ thể (VNĐ), so sánh value for money.
- Mỗi quán: nêu rõ món gì giá bao nhiêu.
- Tips tiết kiệm: combo, giờ vàng, thẻ giảm giá.
- Tone thoải mái, vui vẻ — "ăn ngon mà ví không khóc".
"""

    base_instructions += """

CHỈ TRẢ VỀ NỘI DUNG HTML CỦA BÀI VIẾT. KHÔNG thêm ```html``` hay markdown wrapper.
"""
    return base_instructions


# ─── Main ────────────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--dry-run", action="store_true", help="Only print topics, don't generate")
    parser.add_argument("--limit", type=int, default=0, help="Limit number of articles to generate")
    parser.add_argument("--offset", type=int, default=0, help="Skip first N topics")
    args = parser.parse_args()

    if not SUPABASE_URL or not SERVICE_ROLE_KEY:
        print("ERROR: Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY")
        sys.exit(1)
    if not GEMINI_API_KEY and not args.dry_run:
        print("ERROR: Missing GEMINI_API_KEY")
        sys.exit(1)

    topics = build_topics()
    existing_slugs = get_existing_slugs()

    # Filter out already-published topics
    pending = []
    for t in topics:
        slug = slugify(t["title"])
        if slug in existing_slugs:
            continue
        pending.append(t)

    if args.offset > 0:
        pending = pending[args.offset:]
    if args.limit > 0:
        pending = pending[:args.limit]

    print(f"{'=' * 60}")
    print(f"Blog Article Generator — {GEMINI_MODEL}")
    print(f"Total topics: {len(topics)} | Already published: {len(topics) - len(pending)} | To generate: {len(pending)}")
    print(f"{'=' * 60}")

    if args.dry_run:
        for i, t in enumerate(pending, 1):
            print(f"  {i:2d}. [{t['category']}] {t['title']}")
            print(f"      Tags: {', '.join(t['tags'])}")
            print(f"      Slug: {slugify(t['title'])}")
        print(f"\nDry run complete. Use without --dry-run to generate.")
        return

    success_count = 0
    fail_count = 0

    for i, topic in enumerate(pending, 1):
        slug = slugify(topic["title"])
        print(f"\n{'─' * 50}")
        print(f"[{i}/{len(pending)}] {topic['title']}")
        print(f"  Slug: {slug}")

        # 1. Fetch location data
        print("  Fetching locations...")
        locations = run_sql(topic["location_sql"])
        if not locations:
            print("  WARNING: No locations found, using fallback query")
            locations = run_sql("""
                SELECT name, slug, address, district, google_rating, google_review_count, price_range, google_review_summary
                FROM locations WHERE status = 'published'
                ORDER BY COALESCE(google_rating, 0) DESC LIMIT 10
            """)

        if not locations:
            print("  ERROR: Cannot fetch locations, skipping")
            fail_count += 1
            continue

        print(f"  Found {len(locations)} locations")
        locations_text = format_location_data(locations)
        location_slugs = [loc["slug"] for loc in locations if loc.get("slug")]

        # 2. Generate article
        print("  Generating article via Gemini...")
        prompt = build_prompt(topic, locations_text)
        content = call_gemini(prompt, max_tokens=8192, temperature=0.8)

        if not content:
            print("  ERROR: Gemini returned empty, skipping")
            fail_count += 1
            continue

        # Clean up any markdown wrappers
        content = re.sub(r"^```html\s*", "", content)
        content = re.sub(r"\s*```$", "", content)

        reading_time = estimate_reading_time(content)
        word_count = len(re.sub(r"<[^>]+>", " ", content).split())
        print(f"  Generated: {word_count} words, ~{reading_time} min read")

        # 3. Generate excerpt
        excerpt_prompt = f"""Viết đoạn tóm tắt (excerpt) hấp dẫn, tối đa 50 từ, bằng tiếng Việt có dấu, cho bài blog có tiêu đề: "{topic['title']}". 
Mục tiêu: khiến người đọc tò mò và muốn click. Chỉ trả về nội dung tóm tắt, không thêm gì khác."""
        excerpt = call_gemini(excerpt_prompt, max_tokens=256, temperature=0.7)
        if not excerpt:
            excerpt = topic["meta_description"][:200]
        # Strip quotes if Gemini wrapped it
        excerpt = excerpt.strip('"').strip("'").strip()

        # 4. Build meta_title
        meta_title = f"{topic['title']} | Tôi Là Người Sài Gòn"
        if len(meta_title) > 60:
            meta_title = topic["title"][:57] + "..."

        # 5. Insert into DB
        post_data = {
            "title": topic["title"],
            "slug": slug,
            "content": content,
            "excerpt": excerpt[:300],
            "status": "published",
            "category": topic["category"],
            "tags": topic["tags"],
            "meta_title": meta_title,
            "meta_description": topic["meta_description"][:160],
            "reading_time": reading_time,
            "published_at": "now()",
            "related_location_slugs": location_slugs[:15],
        }
        result = rest_post("posts", post_data)

        if result:
            print(f"  ✅ Published: /blog/{slug}")
            success_count += 1
        else:
            print(f"  ❌ Failed to insert")
            fail_count += 1

        # Rate limit: 2s between articles
        time.sleep(2)

    print(f"\n{'=' * 60}")
    print(f"Done! Generated: {success_count} | Failed: {fail_count}")
    print(f"{'=' * 60}")


if __name__ == "__main__":
    main()
