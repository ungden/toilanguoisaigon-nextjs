"""
Populate collection_locations junction table by matching locations
to collections based on categories, tags, keywords, and attributes.

Usage:
  export SUPABASE_URL="https://your-project.supabase.co"
  export SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
  python3 scripts/populate-collection-locations.py
"""

import os
import json
import random
from supabase import create_client

SUPABASE_URL = os.environ["SUPABASE_URL"]
SUPABASE_KEY = os.environ["SUPABASE_SERVICE_ROLE_KEY"]
supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

# ─── Collection matching rules ───────────────────────────────────────────
# Each collection has a set of criteria to match locations.
# Fields: category_slugs, tag_slugs, name_keywords, price_ranges,
#          min_rating, districts, opening_hours_filter, limit

COLLECTION_RULES = {
    # 1: Sài Gòn Không Ngủ — late-night food
    "saigon-khong-ngu": {
        "tag_slugs": ["an-khuya"],
        "name_keywords": ["đêm", "khuya", "24h", "24 giờ", "midnight"],
        "limit": 20,
    },
    # 2: Bữa Sáng Nạp Năng Lượng — breakfast spots
    "bua-sang-nap-nang-luong": {
        "tag_slugs": ["an-sang"],
        "category_slugs": ["pho", "bun", "banh-mi", "xoi", "banh-cuon", "chao", "hu-tieu-mi"],
        "name_keywords": ["sáng", "breakfast", "phở", "bún", "bánh mì", "xôi", "bánh cuốn", "cháo", "hủ tiếu"],
        "limit": 20,
    },
    # 3: Cơm Trưa Văn Phòng "Chất Lừ" — office lunch
    "com-trua-van-phong-chat-lu": {
        "tag_slugs": ["an-trua"],
        "category_slugs": ["com"],
        "name_keywords": ["cơm", "trưa", "lunch", "cơm tấm", "cơm văn phòng", "cơm gà"],
        "limit": 20,
    },
    # 4: Bữa Tối Chill Chill — dinner chill
    "bua-toi-chill-chill": {
        "tag_slugs": ["an-toi"],
        "name_keywords": ["tối", "dinner", "nướng", "lẩu", "BBQ"],
        "price_ranges": ["$$", "$$$"],
        "limit": 20,
    },
    # 5: Vỉa Hè Tinh Hoa — premium street food
    "via-he-tinh-hoa": {
        "tag_slugs": ["quan-via-he", "binh-dan"],
        "name_keywords": ["vỉa hè", "hẻm", "lề đường"],
        "price_ranges": ["$", "$$"],
        "min_rating": 4.0,
        "limit": 20,
    },
    # 6: Rooftop Lộng Gió, View Bạc Tỷ — rooftop / views
    "rooftop-long-gio-view-bac-ty": {
        "tag_slugs": ["view-dep", "sang-trong"],
        "name_keywords": ["rooftop", "sky", "terrace", "tầng thượng", "view"],
        "price_ranges": ["$$$", "$$$$"],
        "limit": 15,
    },
    # 7: Xanh Mướt Mắt - Cafe Sân Vườn — garden cafes
    "xanh-muot-mat-cafe-san-vuon": {
        "category_slugs": ["cafe"],
        "name_keywords": ["sân vườn", "garden", "xanh", "cây", "vườn", "green", "terrace"],
        "limit": 15,
    },
    # 8: Check-in Sống Ảo Triệu Like — instagrammable
    "check-in-song-ao-trieu-like": {
        "tag_slugs": ["song-ao", "view-dep"],
        "name_keywords": ["sống ảo", "check-in", "Instagram", "decor", "art", "concept"],
        "limit": 20,
    },
    # 9: Góc Riêng Cho Hai Người — date night
    "goc-rieng-cho-hai-nguoi": {
        "tag_slugs": ["phu-hop-hen-ho", "co-phong-rieng"],
        "name_keywords": ["hẹn hò", "date", "romantic", "couple", "riêng tư"],
        "price_ranges": ["$$", "$$$", "$$$$"],
        "limit": 15,
    },
    # 10: Họp Nhóm Càng Đông Càng Vui — group gatherings
    "hop-nhom-cang-dong-cang-vui": {
        "tag_slugs": ["phu-hop-nhom-ban"],
        "category_slugs": ["lau-nuong", "nhau-bia"],
        "name_keywords": ["lẩu", "nướng", "BBQ", "buffet", "nhậu", "bia"],
        "limit": 20,
    },
    # 11: Workstation Lý Tưởng — work cafes
    "workstation-ly-tuong": {
        "tag_slugs": ["co-wifi", "co-may-lanh"],
        "category_slugs": ["cafe"],
        "name_keywords": ["workspace", "coworking", "work", "cafe", "cà phê", "coffee"],
        "limit": 15,
    },
    # 12: Một Mình Vẫn Chill — solo dining
    "mot-minh-van-chill": {
        "category_slugs": ["cafe", "pho", "bun", "com", "banh-mi", "hu-tieu-mi"],
        "price_ranges": ["$", "$$"],
        "name_keywords": ["quán nhỏ", "một mình"],
        "min_rating": 4.0,
        "limit": 15,
    },
    # 13: Finedining
    "finedining": {
        "tag_slugs": ["sang-trong"],
        "category_slugs": ["nha-hang", "mon-quoc-te"],
        "name_keywords": ["fine dining", "restaurant", "nhà hàng", "steak", "wine", "lounge"],
        "price_ranges": ["$$$", "$$$$"],
        "limit": 15,
    },
    # 14: Thưởng Thức Âm Nhạc Live — live music venues
    "thuong-thuc-am-nhac-live": {
        "name_keywords": ["live", "music", "acoustic", "jazz", "bar", "pub", "lounge", "nhạc sống"],
        "category_slugs": ["nhau-bia"],
        "limit": 15,
    },
    # 15: Cuối Tuần Cùng Gia Đình — family weekend
    "cuoi-tuan-cung-gia-dinh": {
        "tag_slugs": ["phu-hop-gia-dinh", "co-cho-dau-xe"],
        "name_keywords": ["gia đình", "family", "buffet", "nhà hàng"],
        "limit": 20,
    },
    # 16: "Boss" Đi Cùng, "Sen" Vui Vẻ (Pet-Friendly)
    "boss-di-cung-sen-vui-ve-pet-friendly": {
        "tag_slugs": ["pet-friendly"],
        "name_keywords": ["pet", "dog", "cat", "thú cưng"],
        "limit": 15,
    },
    # Michelin collections removed — data was not authentic (no verified Michelin locations in DB)
}


def fetch_all_locations():
    """Fetch all published locations with their categories and tags."""
    all_locs = []
    offset = 0
    batch = 500
    while True:
        resp = supabase.table("locations") \
            .select("id, name, slug, district, price_range, average_rating, google_rating, opening_hours, description") \
            .eq("status", "published") \
            .range(offset, offset + batch - 1) \
            .execute()
        all_locs.extend(resp.data)
        if len(resp.data) < batch:
            break
        offset += batch
    print(f"Fetched {len(all_locs)} published locations")
    return all_locs


def fetch_location_categories():
    """Fetch location_categories junction: location_id → category slugs."""
    mapping = {}
    resp = supabase.table("location_categories") \
        .select("location_id, categories(slug)") \
        .execute()
    for row in resp.data:
        lid = row["location_id"]
        cat = row.get("categories")
        if cat:
            slug = cat.get("slug") if isinstance(cat, dict) else None
            if slug:
                mapping.setdefault(lid, set()).add(slug)
    return mapping


def fetch_location_tags():
    """Fetch location_tags junction: location_id → tag slugs."""
    mapping = {}
    offset = 0
    batch = 1000
    while True:
        resp = supabase.table("location_tags") \
            .select("location_id, tags(slug)") \
            .range(offset, offset + batch - 1) \
            .execute()
        for row in resp.data:
            lid = row["location_id"]
            tag = row.get("tags")
            if tag:
                slug = tag.get("slug") if isinstance(tag, dict) else None
                if slug:
                    mapping.setdefault(lid, set()).add(slug)
        if len(resp.data) < batch:
            break
        offset += batch
    return mapping


def fetch_collections():
    """Fetch all collections."""
    resp = supabase.table("collections").select("id, slug, title").execute()
    return {c["slug"]: c for c in resp.data}


def match_locations(locations, rules, cat_map, tag_map):
    """Score and match locations to a collection based on rules."""
    scored = []

    rule_cats = set(rules.get("category_slugs", []))
    rule_tags = set(rules.get("tag_slugs", []))
    keywords = [kw.lower() for kw in rules.get("name_keywords", [])]
    price_ranges = set(rules.get("price_ranges", []))
    min_rating = rules.get("min_rating", 0)
    districts = set(rules.get("districts", []))
    limit = rules.get("limit", 15)

    for loc in locations:
        score = 0
        loc_cats = cat_map.get(loc["id"], set())
        loc_tags = tag_map.get(loc["id"], set())
        name_lower = (loc["name"] or "").lower()
        desc_lower = (loc.get("description") or "").lower()
        rating = loc.get("google_rating") or loc.get("average_rating") or 0

        # Category match (strong signal)
        cat_overlap = rule_cats & loc_cats
        score += len(cat_overlap) * 3

        # Tag match (strong signal)
        tag_overlap = rule_tags & loc_tags
        score += len(tag_overlap) * 5

        # Keyword match in name (medium signal)
        for kw in keywords:
            if kw in name_lower:
                score += 2
            if kw in desc_lower:
                score += 1

        # Price range match
        if price_ranges and loc.get("price_range") in price_ranges:
            score += 1

        # Rating filter
        if min_rating > 0 and rating < min_rating:
            continue  # Skip if below minimum

        # District filter
        if districts and loc.get("district") not in districts:
            continue

        if score > 0:
            scored.append((score, rating, loc))

    # Sort by score desc, then rating desc
    scored.sort(key=lambda x: (-x[0], -x[1]))

    # Take top N
    return [item[2] for item in scored[:limit]]


def main():
    print("=== Populating collection_locations ===\n")

    locations = fetch_all_locations()
    cat_map = fetch_location_categories()
    tag_map = fetch_location_tags()
    collections = fetch_collections()

    print(f"Categories mapped: {sum(len(v) for v in cat_map.values())} assignments")
    print(f"Tags mapped: {sum(len(v) for v in tag_map.values())} assignments")
    print(f"Collections: {len(collections)}")
    print()

    # Clear existing data
    print("Clearing existing collection_locations...")
    supabase.table("collection_locations").delete().neq("collection_id", 0).execute()

    total_inserted = 0

    for slug, rules in COLLECTION_RULES.items():
        coll = collections.get(slug)
        if not coll:
            print(f"⚠ Collection '{slug}' not found in DB, skipping")
            continue

        matched = match_locations(locations, rules, cat_map, tag_map)

        if not matched:
            print(f"⚠ Collection '{coll['title']}' — 0 matches!")
            continue

        # Insert rows
        rows = [
            {
                "collection_id": coll["id"],
                "location_id": loc["id"],
            }
            for loc in matched
        ]

        supabase.table("collection_locations").insert(rows).execute()
        total_inserted += len(rows)
        print(f"✓ {coll['title']}: {len(rows)} locations")

    print(f"\n=== Done! Total: {total_inserted} collection_locations inserted ===")


if __name__ == "__main__":
    main()
