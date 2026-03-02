#!/usr/bin/env python3
"""
Generate watercolor cover images for blog posts that lack them.
Uses Gemini image generation, uploads to Supabase Storage, and updates the posts table.

Usage:
  export GEMINI_API_KEY="..." SUPABASE_URL="..." SUPABASE_SERVICE_ROLE_KEY="..." SUPABASE_ACCESS_TOKEN="..."
  python3 scripts/generate-blog-covers.py
  python3 scripts/generate-blog-covers.py --dry-run
  python3 scripts/generate-blog-covers.py --limit 5
"""

import argparse
import base64
import json
import os
import re
import requests
import sys
import time

GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "")
SUPABASE_URL = os.environ.get("SUPABASE_URL", "")
SUPABASE_SERVICE_ROLE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "")
MGMT_API_URL = f"https://api.supabase.com/v1/projects/{os.environ.get('SUPABASE_PROJECT_REF', 'wsysphytctpgbzoatuzw')}/database/query"
MGMT_TOKEN = os.environ.get("SUPABASE_ACCESS_TOKEN", "")

BUCKET = "location-images"
FOLDER = "blog-covers"

STYLE_PREFIX = (
    "A beautiful warm watercolor illustration in the style of Vietnamese tranh ve (traditional art), "
    "wide landscape composition (16:9 aspect ratio) suitable for a blog hero/banner image, "
    "soft warm lighting, vintage feel, muted earth tones with pops of red and gold. "
    "No text, no watermarks, no writing, no letters, no numbers. "
    "The scene should feel authentic, inviting, and nostalgic. "
)

# Map categories/keywords to scene descriptions
SCENE_TEMPLATES = {
    # District guides
    "quận 10": "A busy Saigon District 10 intersection with street food vendors, students on motorbikes, and old shophouses.",
    "quận 1": "Iconic Saigon District 1 street scene with Notre-Dame Cathedral silhouette, French colonial buildings, bustling food stalls along the sidewalk, motorbikes, warm golden light.",
    "quận 3": "A charming Saigon District 3 neighborhood with tree-lined streets, cozy cafes, and hidden food alleys. Warm afternoon light filtering through old tamarind trees.",
    "bình thạnh": "A vibrant Binh Thanh district scene with local food stalls near a canal, colorful market, and modern apartments in the background.",
    "quận 5": "Saigon's Chinatown (Cholon) with Chinese lanterns, dim sum steamers, ornate temple roof, and traditional Chinese-Vietnamese food stalls.",
    "thủ đức": "Thu Duc city area with modern buildings mixed with traditional food stalls, green parks, and university vibes.",
    "quận 4": "Saigon District 4 riverside scene with seafood stalls, fishing boats, and the iconic Saigon skyline across the river.",
    "quận 7": "Modern Phu My Hung area with international restaurants, clean wide streets, and contemporary Vietnamese dining.",
    "phú nhuận": "Phu Nhuan's cozy alley food scene with tiny noodle shops, local coffee stalls, and old apartment buildings.",
    "gò vấp": "Go Vap district street food scene with affordable local eateries, packed sidewalks, and bustling evening market.",
    # Food categories
    "phở": "A steaming bowl of Vietnamese pho with rice noodles, beef slices, fresh herbs, and golden broth. Side plate of bean sprouts and lime.",
    "bún": "Various Vietnamese bun noodle dishes - bun bo Hue, bun cha, bun rieu - arranged beautifully on a wooden table with fresh herbs.",
    "cơm": "A plate of broken rice (com tam) with grilled pork chop, sunny side egg, pickled vegetables, and fish sauce. Classic Saigon lunch.",
    "bánh mì": "A crispy banh mi sandwich being assembled with pate, cold cuts, pickled carrots, cilantro, and chili. Street vendor cart visible.",
    "cà phê": "A glass of Vietnamese ca phe sua da (iced coffee with condensed milk) dripping through a phin filter on a cafe table. Morning sunlight.",
    "ốc": "A colorful spread of Vietnamese snail and seafood dishes - oc len xao dua, oc huong nuong, ngheu hap xa - on a street food table.",
    "lẩu": "A bubbling hot pot in the center of a table surrounded by plates of fresh vegetables, meat, and seafood. Steam rising, chopsticks reaching.",
    "chè": "Colorful Vietnamese che desserts in glass bowls - che ba mau, che dau xanh, che chuoi - arranged beautifully with shaved ice.",
    "hủ tiếu": "A bowl of clear hu tieu noodle soup with pork, shrimp, and crispy wontons. Saigon morning breakfast scene.",
    "chay": "A beautiful vegetarian Vietnamese meal with tofu, mushrooms, vegetables, rice, and Buddhist temple in the background.",
    "nhậu": "A lively Vietnamese drinking scene with bia hoi, grilled squid, boiled peanuts, and friends gathered around small plastic tables on the sidewalk.",
    "kem": "Colorful gelato and ice cream scoops in waffle cones, Vietnamese coconut ice cream in a coconut shell, tropical fruit backdrop.",
    "bánh canh": "A thick and hearty bowl of banh canh with crab or pork hock, thick tapioca noodles in rich broth.",
    "cháo": "A comforting bowl of Vietnamese rice porridge (chao) with shredded chicken, ginger, fried shallots, and you tiao (quay).",
    "xôi": "Colorful sticky rice dishes - xoi xeo, xoi gac, xoi lac - wrapped in banana leaves at a morning street vendor.",
    # Special themes
    "view đẹp": "A stunning rooftop cafe in Saigon with panoramic city view, stylish decor, potted plants, and a cup of coffee.",
    "hẻm": "A mysterious narrow Saigon alley (hem) with hidden food stalls, hanging laundry, old walls covered in vines, warm lamplight.",
    "khuya": "Late night Saigon food scene under fluorescent lights - a noodle stall with steam, motorbikes parked, city lights in background.",
    "buffet": "An extravagant buffet spread with grilled meats, seafood tower, sushi, and Vietnamese dishes. Elegant restaurant setting.",
    "hẹn hò": "A romantic dinner setting for two in Saigon - candlelit table, wine glasses, garden restaurant with fairy lights and flowers.",
    "healthy": "A fresh and colorful healthy meal - smoothie bowl, salad, grilled fish, quinoa - on a clean white table with plants.",
    "dưới 50k": "A humble but delicious street food spread costing under 50k VND - banh mi, bun, xoi - on a plastic table with tiny stools.",
    "rooftop": "A glamorous Saigon rooftop bar at sunset with craft cocktails, city skyline, string lights, and modern lounge furniture.",
    "bún bò huế": "A fiery red bowl of bun bo Hue with thick noodles, beef shank, pork hock, chili oil, and fresh herbs. Central Vietnamese style.",
    "viral": "A trendy modern Vietnamese restaurant with Instagram-worthy plating, neon signs, and young people taking photos of food.",
    # Culture & Story
    "lịch sử": "An old Saigon scene from decades past - a pho vendor with shoulder pole (ganh), colonial architecture, vintage atmosphere.",
    "cà phê vợt": "An ancient Vietnamese coffee brewing method (ca phe vot) with cloth filter, old ceramic cups, elderly men sitting in a timeless cafe.",
    "chợ lớn": "Saigon's Cholon Chinatown with ornate Chinese temple, red lanterns, vendors selling dim sum, Chinese medicine shops.",
    "vỉa hè": "The quintessential Saigon sidewalk dining experience - tiny plastic chairs, metal tables, steaming food, happy people eating.",
    "văn hóa đêm": "Saigon nightlife food culture - bustling street with food carts, neon lights, motorbikes, and people enjoying late night meals.",
    # Practical & Budget
    "du lịch": "A tourist exploring Saigon food scene - market visit, trying street food, holding a map, Ben Thanh Market in background.",
    "mưa": "Rainy Saigon scene with people eating hot soup under awnings, steam rising, rain falling on the street, cozy warm atmosphere.",
    "food tour": "A guided food tour group walking through Saigon streets, tasting various dishes at different stalls, map and cameras in hand.",
    "ăn chay": "A peaceful vegetarian restaurant near a Buddhist temple, colorful plant-based dishes, incense smoke, serene atmosphere.",
    "ăn sáng": "Early morning Saigon breakfast scene - street vendors serving pho, banh mi, xoi to early risers. Golden sunrise light.",
    "date": "A cute budget-friendly date at a cozy Saigon cafe with fairy lights, affordable but pretty food, young couple ambiance.",
    "nhóm đông": "A large group gathering at a Vietnamese restaurant - big round table, hot pot, grilled meats, many happy faces, celebration.",
    "gia đình": "A wholesome Vietnamese family weekend meal - three generations at a restaurant, sharing dishes, children eating happily.",
    "giao hàng": "A food delivery scene in Saigon - rider on motorbike with food bags, smartphone showing food app, various restaurant logos.",
}


def get_scene_for_post(title: str, category: str, tags: list) -> str:
    """Pick the best scene description based on title/category/tags.
    Prefers longer keyword matches to avoid 'quận 1' matching 'quận 10'."""
    title_lower = title.lower()
    
    # Sort keywords by length descending so longer/more specific matches win
    sorted_keys = sorted(SCENE_TEMPLATES.keys(), key=len, reverse=True)
    
    # Check title against scene templates (most specific first)
    for keyword in sorted_keys:
        if keyword in title_lower:
            return SCENE_TEMPLATES[keyword]
    
    # Check tags
    if tags:
        for tag in tags:
            tag_lower = tag.lower()
            for keyword in sorted_keys:
                if keyword in tag_lower or tag_lower in keyword:
                    return SCENE_TEMPLATES[keyword]
    
    # Fallback: generic Saigon food scene
    return "A vibrant Saigon street food scene with diverse dishes, bustling sidewalk, warm evening light, motorbikes, and happy diners."


def generate_image(prompt: str):
    """Call Gemini to generate an image. Returns PNG bytes or None."""
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent?key={GEMINI_API_KEY}"
    
    payload = {
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {"responseModalities": ["TEXT", "IMAGE"]},
    }
    
    for attempt in range(3):
        try:
            resp = requests.post(url, json=payload, timeout=120)
            if resp.status_code == 429:
                wait = 30 * (attempt + 1)
                print(f"  Rate limited, waiting {wait}s...")
                time.sleep(wait)
                continue
            if resp.status_code != 200:
                print(f"  Gemini error ({resp.status_code}): {resp.text[:300]}")
                if attempt < 2:
                    time.sleep(10)
                    continue
                return None
            
            data = resp.json()
            candidates = data.get("candidates", [])
            if not candidates:
                print("  No candidates in response")
                return None
            
            parts = candidates[0].get("content", {}).get("parts", [])
            for part in parts:
                if "inlineData" in part:
                    mime = part["inlineData"].get("mimeType", "")
                    if mime.startswith("image/"):
                        return base64.b64decode(part["inlineData"]["data"])
            
            print("  No image found in response")
            return None
        except (requests.exceptions.Timeout, requests.exceptions.ConnectionError) as e:
            wait = 15 * (attempt + 1)
            print(f"  Connection error (attempt {attempt+1}/3), retrying in {wait}s...")
            time.sleep(wait)
        except Exception as e:
            print(f"  Exception: {e}")
            time.sleep(10)
    return None


def upload_to_supabase(image_bytes: bytes, path: str):
    """Upload image to Supabase Storage. Returns public URL or None."""
    upload_url = f"{SUPABASE_URL}/storage/v1/object/{BUCKET}/{path}"
    headers = {
        "Authorization": f"Bearer {SUPABASE_SERVICE_ROLE_KEY}",
        "Content-Type": "image/png",
        "x-upsert": "true",
    }
    for attempt in range(3):
        try:
            resp = requests.post(upload_url, headers=headers, data=image_bytes, timeout=60)
            if resp.status_code in (200, 201):
                return f"{SUPABASE_URL}/storage/v1/object/public/{BUCKET}/{path}"
            print(f"  Upload error ({resp.status_code}): {resp.text[:300]}")
            if attempt < 2:
                time.sleep(5)
        except Exception as e:
            print(f"  Upload exception: {e}")
            time.sleep(5)
    return None


def update_post_cover(post_id: str, cover_url: str) -> bool:
    """Update the post's cover_image_url in the database."""
    headers = {
        "apikey": SUPABASE_SERVICE_ROLE_KEY,
        "Authorization": f"Bearer {SUPABASE_SERVICE_ROLE_KEY}",
        "Content-Type": "application/json",
        "Prefer": "return=minimal",
    }
    url = f"{SUPABASE_URL}/rest/v1/posts?id=eq.{post_id}"
    resp = requests.patch(url, headers=headers, json={"cover_image_url": cover_url}, timeout=15)
    if resp.status_code not in (200, 204):
        print(f"  DB update error ({resp.status_code}): {resp.text[:300]}")
        return False
    return True


def get_posts_without_covers() -> list:
    """Fetch published posts that have no cover_image_url."""
    headers = {
        "apikey": SUPABASE_SERVICE_ROLE_KEY,
        "Authorization": f"Bearer {SUPABASE_SERVICE_ROLE_KEY}",
        "Content-Type": "application/json",
    }
    url = f"{SUPABASE_URL}/rest/v1/posts"
    params = {
        "select": "id,title,slug,category,tags",
        "status": "eq.published",
        "cover_image_url": "is.null",
        "order": "created_at.asc",
    }
    resp = requests.get(url, headers=headers, params=params, timeout=15)
    if resp.status_code != 200:
        print(f"Error fetching posts: {resp.status_code} {resp.text[:300]}")
        return []
    return resp.json()


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--dry-run", action="store_true")
    parser.add_argument("--limit", type=int, default=0)
    args = parser.parse_args()

    if not GEMINI_API_KEY or not SUPABASE_URL or not SUPABASE_SERVICE_ROLE_KEY:
        print("ERROR: Missing required env vars")
        sys.exit(1)

    posts = get_posts_without_covers()
    if args.limit > 0:
        posts = posts[:args.limit]

    print(f"{'=' * 60}")
    print(f"Blog Cover Generator — gemini-2.5-flash-image")
    print(f"Posts without covers: {len(posts)}")
    print(f"{'=' * 60}")

    if not posts:
        print("All posts already have covers!")
        return

    if args.dry_run:
        for i, p in enumerate(posts, 1):
            scene = get_scene_for_post(p["title"], p.get("category", ""), p.get("tags", []))
            print(f"  {i:2d}. {p['title']}")
            print(f"      Scene: {scene[:100]}...")
        print(f"\nDry run complete.")
        return

    success = 0
    fail = 0

    for i, post in enumerate(posts, 1):
        print(f"\n{'─' * 50}")
        print(f"[{i}/{len(posts)}] {post['title']}")
        print(f"  Slug: {post['slug']}")

        scene = get_scene_for_post(post["title"], post.get("category", ""), post.get("tags", []))
        prompt = STYLE_PREFIX + scene
        print(f"  Scene: {scene[:80]}...")

        # Generate
        print("  Generating cover image...")
        image_bytes = generate_image(prompt)
        if not image_bytes:
            print("  FAILED to generate image")
            fail += 1
            time.sleep(3)
            continue

        print(f"  Generated {len(image_bytes):,} bytes")

        # Upload
        storage_path = f"{FOLDER}/{post['slug']}.png"
        print(f"  Uploading to {storage_path}...")
        public_url = upload_to_supabase(image_bytes, storage_path)
        if not public_url:
            print("  FAILED to upload")
            fail += 1
            time.sleep(3)
            continue

        # Update DB
        if update_post_cover(post["id"], public_url):
            print(f"  ✅ Done: {public_url}")
            success += 1
        else:
            print("  FAILED to update DB")
            fail += 1

        # Rate limit
        time.sleep(3)

    print(f"\n{'=' * 60}")
    print(f"Done! Success: {success} | Failed: {fail}")
    print(f"{'=' * 60}")


if __name__ == "__main__":
    main()
