"""
Seed 10 new curated collections and auto-assign locations via keyword/criteria matching.

Run:
  export SUPABASE_URL="https://wsysphytctpgbzoatuzw.supabase.co"
  export SUPABASE_SERVICE_ROLE_KEY="..."
  export SUPABASE_ACCESS_TOKEN="..."
  python scripts/seed-new-collections.py

Collections:
  1. Ăn No Không Lo Giá          — budget-friendly ($)
  2. Date Night Hoàn Hảo         — romantic dining ($$$ / $$$$)
  3. Quán Ăn Trong Hẻm Bí Mật   — alley/hẻm eateries
  4. Sài Gòn Healthy             — healthy/clean eating
  5. Ăn Gì Khi Trời Mưa?        — comfort food for rainy days
  6. Sài Gòn Xưa — Quán Cổ Trăm Năm — heritage/old-school spots
  7. Buffet Thoả Thích           — buffet/all-you-can-eat
  8. Quán Mới Trên MXH Đang Viral — trendy/new social media spots
  9. Cà Phê Sài Gòn             — coffee culture
  10. Bún & Phở Đỉnh Cao        — noodle soups
"""

import json
import os
import requests
import time

# ─── Config ──────────────────────────────────────────────────────────────────

SUPABASE_URL = os.environ["SUPABASE_URL"]
SERVICE_ROLE_KEY = os.environ["SUPABASE_SERVICE_ROLE_KEY"]
PROJECT_REF = os.environ.get("SUPABASE_PROJECT_REF", "wsysphytctpgbzoatuzw")
MGMT_API_URL = f"https://api.supabase.com/v1/projects/{PROJECT_REF}/database/query"
MGMT_TOKEN = os.environ["SUPABASE_ACCESS_TOKEN"]

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


def run_sql(sql: str):
    """Execute SQL via Supabase Management API."""
    resp = requests.post(MGMT_API_URL, headers=HEADERS_MGMT, json={"query": sql})
    if resp.status_code not in (200, 201):
        print(f"  SQL ERROR ({resp.status_code}): {resp.text[:500]}")
        return None
    return resp.json()


def rest_get(table: str, params: dict = None):
    """GET from Supabase REST API."""
    url = f"{SUPABASE_URL}/rest/v1/{table}"
    resp = requests.get(url, headers=HEADERS_REST, params=params or {})
    if resp.status_code != 200:
        print(f"  REST GET error ({resp.status_code}): {resp.text[:300]}")
        return []
    return resp.json()


def rest_post(table: str, data):
    """POST to Supabase REST API."""
    url = f"{SUPABASE_URL}/rest/v1/{table}"
    resp = requests.post(url, headers=HEADERS_REST, json=data)
    if resp.status_code not in (200, 201):
        print(f"  REST POST error ({resp.status_code}): {resp.text[:300]}")
        return None
    return resp.json()


# ─── Collection definitions ──────────────────────────────────────────────────

COLLECTIONS = [
    {
        "title": "Ăn No Không Lo Giá",
        "slug": "an-no-khong-lo-gia",
        "description": "Những quán ăn ngon bổ rẻ, ăn no căng bụng mà ví vẫn dày. Thiên đường ẩm thực bình dân Sài Gòn!",
        "mood": "Bình dân, no bụng",
        "emoji": "💰",
        # Match: price_range = '$'
        "match_type": "sql",
        "match_sql": "SELECT id FROM locations WHERE status = 'published' AND price_range = '$' ORDER BY COALESCE(google_rating, 0) DESC LIMIT 30",
    },
    {
        "title": "Date Night Hoàn Hảo",
        "slug": "date-night-hoan-hao",
        "description": "Không gian lãng mạn, ánh nến lung linh, và những bữa tối đáng nhớ cho hai người. Hẹn hò Sài Gòn chưa bao giờ dễ đến thế.",
        "mood": "Lãng mạn, sang trọng",
        "emoji": "🕯️",
        # Match: expensive + romantic keywords
        "match_type": "sql",
        "match_sql": """
            SELECT id FROM locations WHERE status = 'published' 
            AND (
                price_range IN ('$$$', '$$$$') 
                OR LOWER(name) ~* '(rooftop|lounge|wine|steak|fine.?din|italian|french|bistro|romantic|garden|terrace)'
                OR LOWER(COALESCE(google_review_summary, '')) ~* '(lãng mạn|romantic|date|hẹn hò|candle|view đẹp|sang trọng)'
            )
            ORDER BY COALESCE(google_rating, 0) DESC LIMIT 25
        """,
    },
    {
        "title": "Quán Ăn Trong Hẻm Bí Mật",
        "slug": "quan-an-trong-hem-bi-mat",
        "description": "Lạc vào những con hẻm nhỏ, khám phá quán ăn bí mật mà chỉ dân địa phương mới biết. Đồ ăn ngon, giá rẻ, vibe chill.",
        "mood": "Bình dân, phiêu lưu",
        "emoji": "🏘️",
        # Match: address contains hẻm/hẻm or low price + high rating
        "match_type": "sql",
        "match_sql": """
            SELECT id FROM locations WHERE status = 'published'
            AND (
                LOWER(address) ~* '(hẻm|hẽm|hem |/[0-9])'
                OR (price_range = '$' AND COALESCE(google_rating, 0) >= 4.2)
            )
            ORDER BY COALESCE(google_rating, 0) DESC LIMIT 30
        """,
    },
    {
        "title": "Sài Gòn Healthy",
        "slug": "sai-gon-healthy",
        "description": "Eat clean, sống xanh! Những địa điểm ăn uống lành mạnh, thuần chay, salad, smoothie bowl và healthy food ở Sài Gòn.",
        "mood": "Healthy, xanh",
        "emoji": "🥗",
        # Match: healthy/vegan/chay keywords
        "match_type": "sql",
        "match_sql": """
            SELECT id FROM locations WHERE status = 'published'
            AND (
                LOWER(name) ~* '(healthy|health|salad|chay|vegan|vegetarian|organic|clean|granola|acai|smoothie|detox|zen|yoga|quinoa|tofu)'
                OR LOWER(COALESCE(google_review_summary, '')) ~* '(healthy|lành mạnh|thuần chay|chay|vegan|organic|sạch)'
            )
            ORDER BY COALESCE(google_rating, 0) DESC LIMIT 25
        """,
    },
    {
        "title": "Ăn Gì Khi Trời Mưa?",
        "slug": "an-gi-khi-troi-mua",
        "description": "Mưa Sài Gòn rả rích, không gì bằng một tô phở nóng, bát bún bò huế hay ly trà nóng. Comfort food cho ngày mưa!",
        "mood": "Ấm cúng, comfort",
        "emoji": "🌧️",
        # Match: soup/warm food keywords
        "match_type": "sql",
        "match_sql": """
            SELECT id FROM locations WHERE status = 'published'
            AND (
                LOWER(name) ~* '(phở|pho|bún|bun|cháo|chao|lẩu|lau|hotpot|súp|soup|mì |hủ tiếu|hủ tíu|canh|bánh canh|bò kho|ramen|udon)'
                OR LOWER(COALESCE(google_review_summary, '')) ~* '(nóng hổi|ấm|comfort|mưa|warming)'
            )
            ORDER BY COALESCE(google_rating, 0) DESC LIMIT 30
        """,
    },
    {
        "title": "Sài Gòn Xưa — Quán Cổ Trăm Năm",
        "slug": "sai-gon-xua-quan-co-tram-nam",
        "description": "Những quán ăn mang đậm hồn Sài Gòn xưa, từ xe hủ tiếu đầu hẻm đến quán cà phê vợt. Hoài niệm một thời.",
        "mood": "Hoài niệm, cổ điển",
        "emoji": "🏛️",
        # Match: old/heritage keywords
        "match_type": "sql",
        "match_sql": """
            SELECT id FROM locations WHERE status = 'published'
            AND (
                LOWER(name) ~* '(xưa|cổ|old|truyền thống|heritage|bà |cô |dì |chú |anh |ông |chị |hoài niệm|lâu đời|năm |1[89][0-9][0-9]|cà phê vợt)'
                OR LOWER(COALESCE(google_review_summary, '')) ~* '(lâu đời|lâu năm|truyền thống|xưa|hoài niệm|cổ|decades|heritage|old school|từ năm)'
            )
            ORDER BY COALESCE(google_rating, 0) DESC LIMIT 25
        """,
    },
    {
        "title": "Buffet Thoả Thích",
        "slug": "buffet-thoa-thich",
        "description": "Ăn thả ga không lo giá! Tổng hợp buffet ngon nhất Sài Gòn — từ lẩu nướng bình dân đến buffet hải sản cao cấp.",
        "mood": "Ăn thả ga",
        "emoji": "🍖",
        # Match: buffet keywords
        "match_type": "sql",
        "match_sql": """
            SELECT id FROM locations WHERE status = 'published'
            AND (
                LOWER(name) ~* '(buffet|buf |all.?you.?can|thả ga|nướng.*lẩu|lẩu.*nướng|bbq|korean bbq|yakiniku|shabu)'
                OR LOWER(COALESCE(google_review_summary, '')) ~* '(buffet|all you can eat|thả ga|ăn không giới hạn)'
            )
            ORDER BY COALESCE(google_rating, 0) DESC LIMIT 20
        """,
    },
    {
        "title": "Quán Mới Trên MXH Đang Viral",
        "slug": "quan-moi-tren-mxh-dang-viral",
        "description": "Trending trên TikTok, Instagram và Facebook! Những quán ăn mới nhất đang được giới trẻ Sài Gòn check-in rần rần.",
        "mood": "Trendy, viral",
        "emoji": "📱",
        # Match: newest locations with high google reviews (proxy for viral)
        "match_type": "sql",
        "match_sql": """
            SELECT id FROM locations WHERE status = 'published'
            AND COALESCE(google_review_count, 0) >= 100
            AND COALESCE(google_rating, 0) >= 4.0
            ORDER BY created_at DESC LIMIT 20
        """,
    },
    {
        "title": "Cà Phê Sài Gòn",
        "slug": "ca-phe-sai-gon",
        "description": "Từ cà phê vợt đầu hẻm đến specialty coffee, Sài Gòn là thiên đường cà phê. Nơi mỗi ly cà phê kể một câu chuyện.",
        "mood": "Chill, thư giãn",
        "emoji": "☕",
        # Match: cafe/coffee keywords
        "match_type": "sql",
        "match_sql": """
            SELECT id FROM locations WHERE status = 'published'
            AND (
                LOWER(name) ~* '(cà phê|cafe|coffee|ca phe|cappuccino|espresso|latte|brew|roast|drip)'
            )
            ORDER BY COALESCE(google_rating, 0) DESC LIMIT 30
        """,
    },
    {
        "title": "Bún & Phở Đỉnh Cao",
        "slug": "bun-pho-dinh-cao",
        "description": "Tinh hoa ẩm thực Việt Nam — từ phở Bắc đậm đà đến bún bò Huế cay nồng. Những tô bún phở ngon nhất Sài Gòn.",
        "mood": "Đậm đà, truyền thống",
        "emoji": "🍜",
        # Match: pho/bun keywords
        "match_type": "sql",
        "match_sql": """
            SELECT id FROM locations WHERE status = 'published'
            AND (
                LOWER(name) ~* '(phở|pho|bún|bun )'
            )
            ORDER BY COALESCE(google_rating, 0) DESC LIMIT 30
        """,
    },
]


def main():
    print("=" * 60)
    print("Seeding 10 new curated collections")
    print("=" * 60)

    # Check existing collections to avoid duplicates
    existing = rest_get("collections", {"select": "slug", "source": "eq.manual"})
    existing_slugs = {c["slug"] for c in existing} if existing else set()

    for coll in COLLECTIONS:
        slug = coll["slug"]
        if slug in existing_slugs:
            print(f"\n⏭  '{coll['title']}' already exists — skipping")
            continue

        print(f"\n{'─' * 50}")
        print(f"Creating: {coll['title']} ({slug})")

        # 1. Insert collection
        insert_data = {
            "title": coll["title"],
            "slug": slug,
            "description": coll["description"],
            "mood": coll.get("mood"),
            "emoji": coll.get("emoji"),
            "source": "manual",
            "status": "published",
            "is_featured": False,
        }
        result = rest_post("collections", insert_data)
        if not result:
            print(f"  FAILED to insert collection")
            continue

        collection_id = result[0]["id"]
        print(f"  Created collection id={collection_id}")

        # 2. Find matching locations
        match_sql = coll["match_sql"]
        rows = run_sql(match_sql)
        if not rows:
            print(f"  WARNING: no locations matched")
            continue

        location_ids = [r["id"] for r in rows]
        print(f"  Matched {len(location_ids)} locations")

        # 3. Insert collection_locations
        links = []
        for pos, loc_id in enumerate(location_ids, start=1):
            links.append({
                "collection_id": collection_id,
                "location_id": loc_id,
                "position": pos,
            })

        # Batch insert in chunks of 50
        for i in range(0, len(links), 50):
            chunk = links[i:i+50]
            resp = rest_post("collection_locations", chunk)
            if resp:
                print(f"  Linked {len(chunk)} locations (batch {i//50 + 1})")
            else:
                print(f"  ERROR linking batch {i//50 + 1}")
            time.sleep(0.2)

        print(f"  ✅ Done: {coll['title']} → {len(location_ids)} locations")

    print(f"\n{'=' * 60}")
    print("All collections seeded!")
    print("=" * 60)


if __name__ == "__main__":
    main()
