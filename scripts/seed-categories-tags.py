"""
Seed categories & tags, then auto-assign categories to 890 locations
using Vietnamese keyword matching (same logic as getCategoryArtwork in constants.ts).

Run: python scripts/seed-categories-tags.py

Uses Supabase Management API for DB access (no direct connection needed).
"""

import json
import os
import requests
import time
from typing import Optional

# ─── Config ──────────────────────────────────────────────────────────────────

SUPABASE_URL = os.environ["SUPABASE_URL"]
SERVICE_ROLE_KEY = os.environ["SUPABASE_SERVICE_ROLE_KEY"]
MGMT_API_URL = f"https://api.supabase.com/v1/projects/{os.environ.get('SUPABASE_PROJECT_REF', 'wsysphytctpgbzoatuzw')}/database/query"
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
    "User-Agent": "supabase-cli/2.76.15",
}


def run_sql(sql: str):
    """Execute SQL via Supabase Management API."""
    resp = requests.post(MGMT_API_URL, headers=HEADERS_MGMT, json={"query": sql})
    if resp.status_code != 201:
        print(f"SQL ERROR ({resp.status_code}): {resp.text[:500]}")
        return None
    return resp.json()


def rest_get(table: str, params: dict = None):
    """GET from Supabase REST API."""
    url = f"{SUPABASE_URL}/rest/v1/{table}"
    resp = requests.get(url, headers=HEADERS_REST, params=params or {})
    if resp.status_code != 200:
        print(f"REST GET ERROR: {resp.status_code} {resp.text[:300]}")
        return []
    return resp.json()


def rest_post(table: str, data: list):
    """POST (insert) to Supabase REST API. Returns inserted rows."""
    url = f"{SUPABASE_URL}/rest/v1/{table}"
    headers = {**HEADERS_REST, "Prefer": "return=representation,resolution=merge-duplicates"}
    resp = requests.post(url, headers=headers, json=data)
    if resp.status_code not in (200, 201):
        print(f"REST POST ERROR ({table}): {resp.status_code} {resp.text[:500]}")
        return []
    return resp.json()


# ─── Categories ──────────────────────────────────────────────────────────────

# 20 Vietnamese food/drink categories covering all 890 locations
CATEGORIES = [
    {"name": "Phở", "slug": "pho"},
    {"name": "Bún", "slug": "bun"},
    {"name": "Cơm", "slug": "com"},
    {"name": "Bánh mì", "slug": "banh-mi"},
    {"name": "Cà phê", "slug": "cafe"},
    {"name": "Ốc & Hải sản", "slug": "oc-hai-san"},
    {"name": "Lẩu & Nướng", "slug": "lau-nuong"},
    {"name": "Chè & Tráng miệng", "slug": "che-trang-mieng"},
    {"name": "Hủ tiếu & Mì", "slug": "hu-tieu-mi"},
    {"name": "Chay", "slug": "chay"},
    {"name": "Nhậu & Bia", "slug": "nhau-bia"},
    {"name": "Bánh canh", "slug": "banh-canh"},
    {"name": "Cháo", "slug": "chao"},
    {"name": "Bánh cuốn", "slug": "banh-cuon"},
    {"name": "Xôi", "slug": "xoi"},
    {"name": "Gỏi cuốn & Nem", "slug": "goi-cuon-nem"},
    {"name": "Nhà hàng", "slug": "nha-hang"},
    {"name": "Kem & Gelato", "slug": "kem-gelato"},
    {"name": "Nước uống & Sinh tố", "slug": "nuoc-uong"},
    {"name": "Món quốc tế", "slug": "mon-quoc-te"},
]

# Keywords for matching location names → categories (order matters: first match wins)
# Each tuple: (category_slug, [keywords])
CATEGORY_KEYWORDS = [
    ("pho", ["phở", "pho "]),
    ("bun", ["bún ", "bún,", "bún.", "bún-"]),
    ("banh-canh", ["bánh canh"]),
    ("banh-cuon", ["bánh cuốn", "bánh ướt"]),
    ("banh-mi", ["bánh mì", "banh mi", "bánh mỳ", "sandwich", "hamburger", "burger"]),
    ("chao", ["cháo"]),
    ("xoi", ["xôi"]),
    ("goi-cuon-nem", ["gỏi cuốn", "nem nướng", "nem cuốn", "bì cuốn", "cuốn diếp"]),
    ("hu-tieu-mi", [
        "hủ tiếu", "hủ tíu", "hu tieu", "mì ", "mì,", "mỳ ", "mì quảng",
        "mì vịt", "mì gia", "mì xào", "sủi cảo", "hoành thánh",
        "ramen", "sushi", "udon", "soba", "mì ý", "spaghetti"
    ]),
    ("com", [
        "cơm tấm", "cơm ", "com tam", "com binh dan", "cơm hủ",
        "cơm gà", "cơm niêu", "cơm sườn"
    ]),
    ("chay", ["chay", "vegetarian", "vegan", "zen house"]),
    ("oc-hai-san", [
        "ốc ", "ốc,", "ghẹ", "hải sản", "seafood", "cua ", "hàu ",
        "tôm ", "càng ghẹ", "sò ", "nghêu"
    ]),
    ("lau-nuong", [
        "lẩu", "nướng", "hotpot", "bbq", "buffet nướng",
        "thịt nướng", "steak", "bò nướng", "gà nướng"
    ]),
    ("nhau-bia", [
        "nhậu", "bia ", "beer", "quán nhậu", "rooftop", "lounge",
        "bar ", "cocktail", "bistro", "wine", "pub"
    ]),
    ("cafe", [
        "cà phê", "cafe", "coffee", "ca phe", "caffe", "kafe",
        "cappuccino", "matcha", "trà ", "tea ", "acoustic"
    ]),
    ("kem-gelato", [
        "kem ", "kem,", "gelato", "ice cream", "yogurt", "sữa chua"
    ]),
    ("che-trang-mieng", [
        "chè ", "chè,", "bánh ", "dessert", "bánh tráng", "bánh flan",
        "chuối nướng", "chuối nếp", "tàu hũ", "đậu hũ", "bánh bao",
        "bánh bột", "bánh khọt", "bánh xèo", "takoyaki", "bánh bạch tuộc",
        "bánh gạo", "tokbokki", "bánh tráng trộn", "bánh cống",
        "bánh đúc", "bánh plan"
    ]),
    ("nuoc-uong", [
        "sinh tố", "nước ép", "nước mía", "juice", "smoothie",
        "trà sữa", "nước uống", "fruit", "boba", "trà trái cây"
    ]),
    ("nha-hang", [
        "nhà hàng", "restaurant", "dining", "quán ăn", "ẩm thực"
    ]),
    ("mon-quoc-te", [
        "pizza", "pasta", "taco", "indian", "korean", "hàn quốc",
        "japanese", "nhật", "thái ", "thai food", "mexican", "french",
        "italian", "dimsum", "dim sum"
    ]),
]

# ─── Tags ────────────────────────────────────────────────────────────────────

TAGS = [
    # Food style
    {"name": "Ăn sáng", "slug": "an-sang"},
    {"name": "Ăn trưa", "slug": "an-trua"},
    {"name": "Ăn tối", "slug": "an-toi"},
    {"name": "Ăn khuya", "slug": "an-khuya"},
    {"name": "Ăn vặt", "slug": "an-vat"},
    {"name": "Bình dân", "slug": "binh-dan"},
    {"name": "Sang trọng", "slug": "sang-trong"},
    {"name": "Quán vỉa hè", "slug": "quan-via-he"},
    # Features
    {"name": "Có wifi", "slug": "co-wifi"},
    {"name": "Có máy lạnh", "slug": "co-may-lanh"},
    {"name": "Có phòng riêng", "slug": "co-phong-rieng"},
    {"name": "Phù hợp gia đình", "slug": "phu-hop-gia-dinh"},
    {"name": "Phù hợp hẹn hò", "slug": "phu-hop-hen-ho"},
    {"name": "Phù hợp nhóm bạn", "slug": "phu-hop-nhom-ban"},
    {"name": "Có giao hàng", "slug": "co-giao-hang"},
    {"name": "Có chỗ đậu xe", "slug": "co-cho-dau-xe"},
    # Dietary
    {"name": "Thuần chay", "slug": "thuan-chay"},
    {"name": "Có món chay", "slug": "co-mon-chay"},
    {"name": "Không gluten", "slug": "khong-gluten"},
    # Cuisine
    {"name": "Món Huế", "slug": "mon-hue"},
    {"name": "Món Hà Nội", "slug": "mon-ha-noi"},
    {"name": "Món miền Tây", "slug": "mon-mien-tay"},
    {"name": "Món Hoa", "slug": "mon-hoa"},
    {"name": "Món Nhật", "slug": "mon-nhat"},
    {"name": "Món Hàn", "slug": "mon-han"},
    {"name": "Món Thái", "slug": "mon-thai"},
    {"name": "Món Ấn Độ", "slug": "mon-an-do"},
    {"name": "Món Ý", "slug": "mon-y"},
    # Special
    {"name": "Michelin", "slug": "michelin"},
    {"name": "Quán cũ lâu năm", "slug": "quan-cu-lau-nam"},
    {"name": "View đẹp", "slug": "view-dep"},
    {"name": "Sống ảo", "slug": "song-ao"},
    {"name": "Pet-friendly", "slug": "pet-friendly"},
]


def match_category(name: str) -> Optional[str]:
    """Match a location name to a category slug using keyword matching."""
    name_lower = name.lower()
    for cat_slug, keywords in CATEGORY_KEYWORDS:
        for kw in keywords:
            if kw in name_lower:
                return cat_slug
    return None


def main():
    print("=" * 60)
    print("SEEDING CATEGORIES & TAGS")
    print("=" * 60)

    # ─── Step 1: Insert categories ───────────────────────────────────────
    print("\n[1/5] Inserting categories...")
    cat_result = rest_post("categories", CATEGORIES)
    if not cat_result:
        print("ERROR: Failed to insert categories. Trying one by one...")
        cat_result = []
        for cat in CATEGORIES:
            r = rest_post("categories", [cat])
            if r:
                cat_result.extend(r)
    
    # Build slug→id map
    cats = rest_get("categories", {"select": "id,slug", "order": "id"})
    cat_map = {c["slug"]: c["id"] for c in cats}
    print(f"  -> {len(cat_map)} categories in DB: {list(cat_map.keys())}")

    # ─── Step 2: Insert tags ─────────────────────────────────────────────
    print("\n[2/5] Inserting tags...")
    tag_result = rest_post("tags", TAGS)
    if not tag_result:
        print("ERROR: Failed to insert tags. Trying one by one...")
        tag_result = []
        for tag in TAGS:
            r = rest_post("tags", [tag])
            if r:
                tag_result.extend(r)
    
    tags = rest_get("tags", {"select": "id,slug", "order": "id"})
    print(f"  -> {len(tags)} tags in DB")

    # ─── Step 3: Fetch all published locations ───────────────────────────
    print("\n[3/5] Fetching all published locations...")
    all_locations = []
    offset = 0
    PAGE_SIZE = 1000
    while True:
        locs = rest_get("locations", {
            "select": "id,name",
            "status": "eq.published",
            "order": "name",
            "offset": str(offset),
            "limit": str(PAGE_SIZE),
        })
        all_locations.extend(locs)
        if len(locs) < PAGE_SIZE:
            break
        offset += PAGE_SIZE
    print(f"  -> {len(all_locations)} published locations fetched")

    # ─── Step 4: Match categories to locations ───────────────────────────
    print("\n[4/5] Matching categories to locations...")
    assignments = []  # [{location_id, category_id}]
    unmatched = []
    stats = {}

    for loc in all_locations:
        cat_slug = match_category(loc["name"])
        if cat_slug and cat_slug in cat_map:
            cat_id = cat_map[cat_slug]
            assignments.append({
                "location_id": loc["id"],
                "category_id": cat_id,
            })
            stats[cat_slug] = stats.get(cat_slug, 0) + 1
        else:
            unmatched.append(loc["name"])

    print(f"  -> {len(assignments)} locations matched, {len(unmatched)} unmatched")
    print("\n  Category distribution:")
    for slug, count in sorted(stats.items(), key=lambda x: -x[1]):
        cat_name = next((c["name"] for c in CATEGORIES if c["slug"] == slug), slug)
        print(f"    {cat_name:25s} {count:4d}")
    
    if unmatched:
        print(f"\n  Unmatched locations ({len(unmatched)}):")
        for name in unmatched[:30]:
            print(f"    - {name}")
        if len(unmatched) > 30:
            print(f"    ... and {len(unmatched) - 30} more")

    # ─── Step 5: Insert location_categories ──────────────────────────────
    print("\n[5/5] Inserting location_categories assignments...")
    BATCH_SIZE = 200
    inserted = 0
    for i in range(0, len(assignments), BATCH_SIZE):
        batch = assignments[i:i + BATCH_SIZE]
        # Use upsert to avoid conflicts
        url = f"{SUPABASE_URL}/rest/v1/location_categories"
        headers = {
            **HEADERS_REST,
            "Prefer": "return=minimal,resolution=merge-duplicates",
        }
        resp = requests.post(url, headers=headers, json=batch)
        if resp.status_code in (200, 201):
            inserted += len(batch)
            print(f"  -> Batch {i//BATCH_SIZE + 1}: inserted {len(batch)} rows (total: {inserted})")
        else:
            print(f"  -> Batch {i//BATCH_SIZE + 1} ERROR: {resp.status_code} {resp.text[:300]}")
        time.sleep(0.2)  # Rate limit

    print("\n" + "=" * 60)
    print("DONE!")
    print(f"  Categories: {len(cat_map)}")
    print(f"  Tags: {len(tags)}")
    print(f"  Location-category assignments: {inserted}")
    print(f"  Unmatched locations: {len(unmatched)}")
    print("=" * 60)


if __name__ == "__main__":
    main()
