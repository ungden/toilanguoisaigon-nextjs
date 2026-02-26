"""
Patch unmatched locations with expanded keyword matching.
Runs after seed-categories-tags.py to catch the remaining ~179 unmatched locations.

Run: python scripts/patch-unmatched-categories.py
"""

import os
import requests
import time
from typing import Optional

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


def run_sql(sql):
    resp = requests.post(MGMT_API_URL, headers=HEADERS_MGMT, json={"query": sql})
    if resp.status_code != 201:
        print(f"SQL ERROR: {resp.status_code} {resp.text[:500]}")
        return None
    return resp.json()


def rest_get(table, params=None):
    url = f"{SUPABASE_URL}/rest/v1/{table}"
    resp = requests.get(url, headers=HEADERS_REST, params=params or {})
    return resp.json() if resp.status_code == 200 else []


# Extended keywords for unmatched locations
# These are additional patterns not in the original seed script
EXPANDED_KEYWORDS = [
    # Bò (beef dishes) → Lẩu & Nướng category
    ("lau-nuong", [
        "bò bít tết", "bò né", "bò tơ", "bò lá lốt", "bê thui",
        "bò tùng xẻo", "dê ", "dê tươi", "dê phố", "dê vàng",
        "heo quay", "vịt quay", "roast duck", "thui"
    ]),
    # Bột chiên & snacks → Chè & Tráng miệng (street snacks)
    ("che-trang-mieng", [
        "bột chiên", "há cảo", "donut", "cake", "sweet", "brunch",
        "cream", "chuối", "paoli", "dừng chân", "sầu riêng"
    ]),
    # Riêu, bún cá → Bún
    ("bun", [
        "riêu", "bún cá", "bun bo", "bun ca", "bún riêu", "bún bò"
    ]),
    # Mi ga (without diacritics) → Hủ tiếu & Mì
    ("hu-tieu-mi", [
        "mi ga", "mi quang", "mi gia",
        "izakaya", "sushi ", "sashimi"
    ]),
    # Chao (without diacritics) / porridge → Cháo
    ("chao", [
        "chao suon", "porridge", "congee", "frog porridge"
    ]),
    # Ốc with different patterns
    ("oc-hai-san", [
        "link ốc", "bé ốc", "ốc khánh", "cá lóc", "cá kèo",
        "vua chả cá"
    ]),
    # Chicken dishes → Món quốc tế (Korean fried chicken, etc.)
    ("mon-quoc-te", [
        "chicken", "gà rán", "jeju", "dookki", "topokki", "tokbokki",
        "gaucho", "burger", "taco ", "tandoor", "halal",
        "izakaya ", "kamura"
    ]),
    # Xôi (without diacritics)
    ("xoi", [
        "xoi ga", "sticky rice"
    ]),
    # Gỏi cuốn & nem
    ("goi-cuon-nem", [
        "nem chua", "cuốn sài gòn", "cuốn cao thắng", "hang cuon",
        "bếp cuốn"
    ]),
    # Café (variant spellings)
    ("cafe", [
        "café", "garden", "running bean", "sofé"
    ]),
    # Nhà hàng / general dining
    ("nha-hang", [
        "quán ăn", "food street", "street food", "market", "buffet",
        "cuisine", "recipe", "bếp ", "tiệm ăn", "quán mộc",
        "quán nhà", "hẻm quán", "deck saigon", "square one",
        "quince", "opera", "strand", "sole saigon", "oryz",
        "dim tu tac", "food connexion", "quán ba tròn",
        "hoa viên", "hàng dương", "quán hợp lực",
        "quán ông tiên", "quán cô béo", "quán a cường",
        "wagon wheel", "điểm tâm", "on the upper",
        "latest recipe", "dalat corner", "cloud nine",
        "ghiền quán", "mủn quán", "tam anh quán",
        "madame lam", "bếp hà nội", "bếp huế", "góc huế",
        "huế thương", "naked flavors", "cửu long quán",
        "tiệm vịt", "trần quang ký", "vịt quay",
        "sesan", "quán sở", "broken rice",
        "ben nghe", "ben thanh"
    ]),
    # Nuoc uong
    ("nuoc-uong", [
        "tiger sugar", "tigersugar", "gong cha", "trà",
        "mê trà", "me tra", "royaltea"
    ]),
    # Kem
    ("kem-gelato", [
        "kem ", "glacier", "roseice", "i love cream", "i love kem"
    ]),
    # Special: pet cafe
    ("cafe", [
        "pet me", "pet coffee", "mèo"
    ]),
    # Cơm (more)
    ("com", [
        "broken rice", "huyen broken"
    ]),
]


def match_expanded(name):
    """Try expanded keyword matching."""
    name_lower = name.lower()
    for cat_slug, keywords in EXPANDED_KEYWORDS:
        for kw in keywords:
            if kw in name_lower:
                return cat_slug
    return None


def main():
    print("=" * 60)
    print("PATCHING UNMATCHED LOCATIONS")
    print("=" * 60)

    # Get category slug→id map
    cats = rest_get("categories", {"select": "id,slug"})
    cat_map = {c["slug"]: c["id"] for c in cats}

    # Get all unmatched locations (not in location_categories)
    result = run_sql("""
        SELECT l.id, l.name
        FROM locations l
        WHERE l.status = 'published'
          AND NOT EXISTS (SELECT 1 FROM location_categories lc WHERE lc.location_id = l.id)
        ORDER BY l.name;
    """)
    
    if not result:
        print("No unmatched locations or query failed.")
        return

    print(f"Found {len(result)} unmatched locations\n")

    assignments = []
    still_unmatched = []
    stats = {}

    for loc in result:
        cat_slug = match_expanded(loc["name"])
        if cat_slug and cat_slug in cat_map:
            assignments.append({
                "location_id": loc["id"],
                "category_id": cat_map[cat_slug],
            })
            stats[cat_slug] = stats.get(cat_slug, 0) + 1
        else:
            still_unmatched.append(loc["name"])

    print(f"Newly matched: {len(assignments)}")
    print(f"Still unmatched: {len(still_unmatched)}")

    if stats:
        print("\nNew matches by category:")
        for slug, count in sorted(stats.items(), key=lambda x: -x[1]):
            print(f"  {slug:25s} {count:3d}")

    if still_unmatched:
        print(f"\nStill unmatched ({len(still_unmatched)}):")
        for name in still_unmatched:
            print(f"  - {name}")

    # Insert assignments
    if assignments:
        print(f"\nInserting {len(assignments)} new assignments...")
        url = f"{SUPABASE_URL}/rest/v1/location_categories"
        headers = {
            **HEADERS_REST,
            "Prefer": "return=minimal,resolution=merge-duplicates",
        }
        BATCH_SIZE = 200
        for i in range(0, len(assignments), BATCH_SIZE):
            batch = assignments[i:i + BATCH_SIZE]
            resp = requests.post(url, headers=headers, json=batch)
            if resp.status_code in (200, 201):
                print(f"  Batch {i//BATCH_SIZE + 1}: OK ({len(batch)} rows)")
            else:
                print(f"  Batch {i//BATCH_SIZE + 1} ERROR: {resp.status_code} {resp.text[:300]}")
            time.sleep(0.2)

    # Final count
    total = run_sql("SELECT COUNT(*) as cnt FROM location_categories;")
    print(f"\nTotal location_categories rows: {total[0]['cnt'] if total else '?'}")
    print("DONE!")


if __name__ == "__main__":
    main()
