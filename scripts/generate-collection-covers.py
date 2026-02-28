#!/usr/bin/env python3
"""
Generate watercolor cover images for all 18 collections via Gemini 2.5 Flash,
upload to Supabase Storage, and update the collections table.

Usage:
  python3 scripts/generate-collection-covers.py [--dry-run] [--collection SLUG]

Requires: pip install requests
"""

import argparse
import base64
import json
import os
import requests
import sys
import time

GEMINI_API_KEY = os.environ["GEMINI_API_KEY"]
SUPABASE_URL = os.environ["SUPABASE_URL"]
SUPABASE_SERVICE_ROLE_KEY = os.environ["SUPABASE_SERVICE_ROLE_KEY"]
MGMT_API_URL = f"https://api.supabase.com/v1/projects/{os.environ.get('SUPABASE_PROJECT_REF', 'wsysphytctpgbzoatuzw')}/database/query"
MGMT_TOKEN = os.environ["SUPABASE_ACCESS_TOKEN"]

BUCKET = "location-images"
FOLDER = "collection-covers"

# Style prompt prefix
STYLE_PREFIX = (
    "A beautiful warm watercolor illustration in the style of Vietnamese tranh ve (traditional art), "
    "wide landscape composition suitable for a website hero/banner image, "
    "soft warm lighting, vintage feel, muted earth tones with pops of red and gold. "
    "No text, no watermarks, no writing. "
    "The scene should feel authentic, inviting, and nostalgic. "
)

COLLECTIONS = {
    "saigon-khong-ngu": {
        "id": 1,
        "title": "Sai Gon Khong Ngu",
        "prompt": STYLE_PREFIX + "A vibrant Saigon alley at midnight with neon-lit food stalls, steam rising from hot pots, warm yellow lights, people eating on tiny stools under string lights. The city never sleeps.",
    },
    "bua-sang-nap-nang-luong": {
        "id": 2,
        "title": "Bua Sang Nap Nang Luong",
        "prompt": STYLE_PREFIX + "A cheerful Saigon morning breakfast scene: a sidewalk table with a bowl of pho, banh mi, and ca phe sua da. Golden sunrise light filtering through trees. Motorbikes passing by.",
    },
    "com-trua-van-phong-chat-lu": {
        "id": 3,
        "title": "Com Trua Van Phong",
        "prompt": STYLE_PREFIX + "A bustling Saigon lunch scene near an office area. Workers gathered at a com tam stall, plates of broken rice with grilled pork, sunny side eggs. Midday warm light.",
    },
    "bua-toi-chill-chill": {
        "id": 4,
        "title": "Bua Toi Chill Chill",
        "prompt": STYLE_PREFIX + "A relaxing Saigon evening dinner at an open-air restaurant. Warm candlelight, plates of Vietnamese dishes, friends chatting. Purple-orange sunset sky visible.",
    },
    "via-he-tinh-hoa": {
        "id": 5,
        "title": "Via He Tinh Hoa",
        "prompt": STYLE_PREFIX + "A charming Saigon sidewalk food scene: a street vendor selling banh mi from a cart, another with a pho pot, tiny plastic stools. Raw, authentic street food culture.",
    },
    "rooftop-long-gio-view-bac-ty": {
        "id": 6,
        "title": "Rooftop View",
        "prompt": STYLE_PREFIX + "A stunning rooftop bar/cafe in Saigon at sunset. Panoramic city view with skyscrapers including Landmark 81 in the background. Cocktails and plates on the table. Wind blowing.",
    },
    "xanh-muot-mat-cafe-san-vuon": {
        "id": 7,
        "title": "Cafe San Vuon",
        "prompt": STYLE_PREFIX + "A lush green garden cafe in Saigon. Tropical plants, hanging vines, wooden furniture. A cup of coffee on the table. Dappled sunlight through leaves. Peaceful oasis.",
    },
    "check-in-song-ao-trieu-like": {
        "id": 8,
        "title": "Check-in Song Ao",
        "prompt": STYLE_PREFIX + "A trendy, Instagram-worthy cafe in Saigon with unique retro decor, colorful walls, vintage furniture, neon signs. A photogenic drink on the table. Youthful and creative.",
    },
    "goc-rieng-cho-hai-nguoi": {
        "id": 9,
        "title": "Goc Rieng Cho Hai Nguoi",
        "prompt": STYLE_PREFIX + "A romantic Saigon restaurant scene. Intimate table for two with candles, roses, wine glasses. Soft warm lighting. A couple's hands visible. Elegant but cozy.",
    },
    "hop-nhom-cang-dong-cang-vui": {
        "id": 10,
        "title": "Hop Nhom",
        "prompt": STYLE_PREFIX + "A large group gathering at a Saigon seafood restaurant. Multiple plates of grilled seafood, hot pot, beers. Friends laughing and clinking glasses. Festive atmosphere.",
    },
    "workstation-ly-tuong": {
        "id": 11,
        "title": "Workstation Ly Tuong",
        "prompt": STYLE_PREFIX + "A cozy Saigon cafe perfect for working: laptop on a wooden table, a cup of specialty coffee, natural light from large windows. Bookshelves, plants. Calm and focused atmosphere.",
    },
    "mot-minh-van-chill": {
        "id": 12,
        "title": "Mot Minh Van Chill",
        "prompt": STYLE_PREFIX + "A serene solo cafe scene in Saigon. One person sitting by a window reading a book, a cup of coffee nearby. Quiet afternoon light. Introspective and peaceful mood.",
    },
    "finedining": {
        "id": 13,
        "title": "Finedining",
        "prompt": STYLE_PREFIX + "An elegant fine dining restaurant in Saigon. White tablecloth, silver cutlery, a beautifully plated Vietnamese dish. Crystal glasses, ambient lighting. Sophistication meets Vietnamese cuisine.",
    },
    "thuong-thuc-am-nhac-live": {
        "id": 14,
        "title": "Am Nhac Live",
        "prompt": STYLE_PREFIX + "A cozy Saigon acoustic cafe with a guitarist performing on a small stage. Warm spotlights, audience sitting with coffee. Musical notes floating in the air. Intimate vibe.",
    },
    "cuoi-tuan-cung-gia-dinh": {
        "id": 15,
        "title": "Gia Dinh",
        "prompt": STYLE_PREFIX + "A warm Saigon family restaurant scene. Parents and children sharing a big meal, a hot pot in the center. Laughter and joy. Bright, welcoming space with Vietnamese decor.",
    },
    "boss-di-cung-sen-vui-ve-pet-friendly": {
        "id": 16,
        "title": "Pet Friendly",
        "prompt": STYLE_PREFIX + "A charming pet-friendly cafe in Saigon. A cute dog and cat near a table with coffee and cake. Garden setting with plants. Pet owner relaxing. Warm and playful atmosphere.",
    },
    # Michelin collections removed — data was not authentic
}


def generate_image(prompt):
    """Call Gemini 2.5 Flash to generate an image. Returns PNG bytes or None."""
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent?key={GEMINI_API_KEY}"

    payload = {
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {"responseModalities": ["TEXT", "IMAGE"]},
    }

    resp = requests.post(url, json=payload, timeout=120)
    if resp.status_code != 200:
        print(f"  ERROR: Gemini API returned {resp.status_code}: {resp.text[:500]}")
        return None

    data = resp.json()
    candidates = data.get("candidates", [])
    if not candidates:
        print(f"  ERROR: No candidates in response")
        return None

    parts = candidates[0].get("content", {}).get("parts", [])
    for part in parts:
        if "inlineData" in part:
            mime = part["inlineData"].get("mimeType", "")
            if mime.startswith("image/"):
                b64 = part["inlineData"]["data"]
                return base64.b64decode(b64)

    print(f"  ERROR: No image found in response parts")
    return None


def upload_to_supabase(image_bytes, path):
    """Upload image to Supabase Storage. Returns public URL or None."""
    upload_url = f"{SUPABASE_URL}/storage/v1/object/{BUCKET}/{path}"
    headers = {
        "Authorization": f"Bearer {SUPABASE_SERVICE_ROLE_KEY}",
        "Content-Type": "image/png",
        "x-upsert": "true",
    }
    resp = requests.post(upload_url, headers=headers, data=image_bytes, timeout=60)
    if resp.status_code not in (200, 201):
        print(f"  ERROR: Upload failed {resp.status_code}: {resp.text[:300]}")
        return None
    return f"{SUPABASE_URL}/storage/v1/object/public/{BUCKET}/{path}"


def update_collection_cover(collection_id, cover_url):
    """Update the collection's cover_image_url in the database."""
    headers = {
        "Authorization": f"Bearer {MGMT_TOKEN}",
        "Content-Type": "application/json",
        "User-Agent": "supabase-cli/2.76.15",
    }
    sql = f"UPDATE collections SET cover_image_url = '{cover_url}' WHERE id = {collection_id};"
    resp = requests.post(MGMT_API_URL, headers=headers, json={"query": sql})
    if resp.status_code != 201:
        print(f"  ERROR updating DB: {resp.status_code} {resp.text[:300]}")
        return False
    return True


def main():
    parser = argparse.ArgumentParser(description="Generate collection cover artwork via Gemini")
    parser.add_argument("--dry-run", action="store_true", help="Only print prompts, don't generate")
    parser.add_argument("--collection", type=str, help="Generate only this collection slug")
    parser.add_argument("--save-local", action="store_true", help="Also save images locally")
    args = parser.parse_args()

    collections = COLLECTIONS
    if args.collection:
        if args.collection not in COLLECTIONS:
            print(f"Unknown collection: {args.collection}")
            print(f"Available: {', '.join(COLLECTIONS.keys())}")
            sys.exit(1)
        collections = {args.collection: COLLECTIONS[args.collection]}

    results = {}
    errors = []

    for slug, info in collections.items():
        print(f"\n{'='*60}")
        print(f"Collection: {slug} (id={info['id']})")
        print(f"Prompt: {info['prompt'][:120]}...")

        if args.dry_run:
            print("  [DRY RUN] Skipping generation")
            continue

        # Generate
        print("  Generating image with Gemini...")
        image_bytes = generate_image(info["prompt"])
        if not image_bytes:
            print(f"  FAILED to generate {slug}")
            errors.append(slug)
            time.sleep(3)
            continue

        print(f"  Generated {len(image_bytes):,} bytes")

        # Save locally
        if args.save_local:
            local_dir = "scripts/collection-covers-output"
            os.makedirs(local_dir, exist_ok=True)
            local_path = os.path.join(local_dir, f"{slug}.png")
            with open(local_path, "wb") as f:
                f.write(image_bytes)
            print(f"  Saved locally: {local_path}")

        # Upload to Supabase
        storage_path = f"{FOLDER}/{slug}.png"
        print(f"  Uploading to Supabase: {storage_path}")
        public_url = upload_to_supabase(image_bytes, storage_path)
        if not public_url:
            print(f"  FAILED to upload {slug}")
            errors.append(slug)
            time.sleep(3)
            continue

        print(f"  Uploaded: {public_url}")

        # Update DB
        print(f"  Updating collection {info['id']} in DB...")
        if update_collection_cover(info["id"], public_url):
            print(f"  SUCCESS: {slug}")
            results[slug] = public_url
        else:
            print(f"  FAILED to update DB for {slug}")
            errors.append(slug)

        # Rate limit
        time.sleep(5)

    # Summary
    print(f"\n{'='*60}")
    print(f"SUMMARY")
    print(f"  Success: {len(results)}/{len(collections)}")
    print(f"  Errors: {len(errors)}")
    if errors:
        print(f"  Failed: {', '.join(errors)}")
    if results:
        print("\n  Generated covers:")
        for slug, url in results.items():
            print(f"    {slug}: {url}")


if __name__ == "__main__":
    main()
