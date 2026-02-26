#!/usr/bin/env python3
"""
Generate category artwork images via Gemini 2.5 Flash image generation,
then upload to Supabase Storage (location-images bucket).

Usage:
  python3 scripts/generate-category-artwork.py [--dry-run] [--category SLUG]

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

BUCKET = "location-images"
FOLDER = "category-artwork"

# Style prompt prefix for consistent illustration style
STYLE_PREFIX = (
    "A beautiful warm watercolor illustration in the style of Vietnamese tranh ve (traditional art), "
    "depicting a cozy Saigon street food scene. Soft warm lighting, vintage feel, "
    "muted earth tones with pops of red and gold. No text or watermarks. "
    "The scene should feel authentic, inviting, and nostalgic. "
)

CATEGORIES = {
    "pho": {
        "prompt": STYLE_PREFIX + "A steaming bowl of pho bo (beef pho) with rice noodles, fresh herbs, bean sprouts, and lime on a small sidewalk table in Saigon. Steam rising beautifully.",
        "filename": "pho.png",
    },
    "bun": {
        "prompt": STYLE_PREFIX + "A colorful plate of bun thit nuong (grilled pork vermicelli) with fresh vegetables, pickled carrots, crushed peanuts, and nuoc cham dipping sauce on a Saigon street corner.",
        "filename": "bun.png",
    },
    "com": {
        "prompt": STYLE_PREFIX + "A plate of com tam (broken rice) with a golden grilled pork chop, sunny side up egg, sliced cucumber, and pickled vegetables at a traditional Saigon com tam stall.",
        "filename": "com.png",
    },
    "banh-mi": {
        "prompt": STYLE_PREFIX + "A crispy banh mi sandwich being assembled at a Saigon street cart — crusty baguette filled with pate, cold cuts, pickled daikon, cilantro, and chili sauce.",
        "filename": "banh-mi.png",
    },
    "cafe": {
        "prompt": STYLE_PREFIX + "A glass of ca phe sua da (Vietnamese iced coffee) with condensed milk swirling, on a tiny metal table and stool on a Saigon sidewalk. A phin coffee filter sits nearby.",
        "filename": "cafe.png",
    },
    "oc": {
        "prompt": STYLE_PREFIX + "A plate of oc (Vietnamese snails) cooked with lemongrass and chili, served on a newspaper-lined table at a vibrant Saigon oc stall at night with warm lights.",
        "filename": "oc.png",
    },
    "lau": {
        "prompt": STYLE_PREFIX + "A bubbling lau (Vietnamese hotpot) with seafood, mushrooms, morning glory, and fresh herbs. Friends gathering around the pot at a lively Saigon restaurant.",
        "filename": "lau.png",
    },
    "che": {
        "prompt": STYLE_PREFIX + "A colorful glass of che (Vietnamese sweet dessert soup) with layers of beans, jelly, coconut milk, and crushed ice. Multiple che varieties displayed at a Saigon che cart.",
        "filename": "che.png",
    },
    "hu-tieu": {
        "prompt": STYLE_PREFIX + "A bowl of hu tieu Nam Vang (Phnom Penh-style noodle soup) with clear broth, pork, shrimp, quail eggs, and fresh herbs at a classic Saigon Chinatown eatery.",
        "filename": "hu-tieu.png",
    },
    "chay": {
        "prompt": STYLE_PREFIX + "A beautiful vegetarian (chay) meal at a Saigon temple restaurant — tofu dishes, vegetable stir-fry, mushroom soup, and rice, arranged artfully on banana leaves.",
        "filename": "chay.png",
    },
    "nhau": {
        "prompt": STYLE_PREFIX + "A lively Saigon nhau (drinking food) scene with grilled squid, boiled peanuts, green mango salad, and beer on a low plastic table, tiny stools, string lights overhead.",
        "filename": "nhau.png",
    },
    "default": {
        "prompt": STYLE_PREFIX + "A panoramic Saigon street food alley at dusk — multiple food stalls with neon signs, steam rising, motorbikes, and locals eating at tiny tables. Capturing the energy of Saigon food culture.",
        "filename": "default.png",
    },
}


def generate_image(prompt: str):
    """Call Gemini 2.5 Flash to generate an image. Returns PNG bytes or None."""
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent?key={GEMINI_API_KEY}"

    payload = {
        "contents": [
            {
                "parts": [
                    {"text": prompt}
                ]
            }
        ],
        "generationConfig": {
            "responseModalities": ["TEXT", "IMAGE"],
        },
    }

    resp = requests.post(url, json=payload, timeout=120)
    if resp.status_code != 200:
        print(f"  ERROR: Gemini API returned {resp.status_code}: {resp.text[:500]}")
        return None

    data = resp.json()

    # Extract image from response parts
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

    print(f"  ERROR: No image found in response parts: {[p.get('text', '[image]') for p in parts]}")
    return None


def upload_to_supabase(image_bytes: bytes, path: str):
    """Upload image to Supabase Storage. Returns public URL or None."""
    upload_url = f"{SUPABASE_URL}/storage/v1/object/{BUCKET}/{path}"

    headers = {
        "Authorization": f"Bearer {SUPABASE_SERVICE_ROLE_KEY}",
        "Content-Type": "image/png",
        "x-upsert": "true",  # Overwrite if exists
    }

    resp = requests.post(upload_url, headers=headers, data=image_bytes, timeout=60)
    if resp.status_code not in (200, 201):
        print(f"  ERROR: Upload failed {resp.status_code}: {resp.text[:300]}")
        return None

    # Construct public URL
    public_url = f"{SUPABASE_URL}/storage/v1/object/public/{BUCKET}/{path}"
    return public_url


def main():
    parser = argparse.ArgumentParser(description="Generate category artwork via Gemini")
    parser.add_argument("--dry-run", action="store_true", help="Only print prompts, don't generate")
    parser.add_argument("--category", type=str, help="Generate only this category slug")
    parser.add_argument("--save-local", action="store_true", help="Also save images locally")
    args = parser.parse_args()

    categories = CATEGORIES
    if args.category:
        if args.category not in CATEGORIES:
            print(f"Unknown category: {args.category}")
            print(f"Available: {', '.join(CATEGORIES.keys())}")
            sys.exit(1)
        categories = {args.category: CATEGORIES[args.category]}

    results = {}

    for slug, info in categories.items():
        print(f"\n{'='*60}")
        print(f"Category: {slug}")
        print(f"Prompt: {info['prompt'][:100]}...")

        if args.dry_run:
            print("  [DRY RUN] Skipping generation")
            continue

        # Generate
        print("  Generating image with Gemini...")
        image_bytes = generate_image(info["prompt"])
        if not image_bytes:
            print(f"  FAILED to generate {slug}")
            continue

        print(f"  Generated {len(image_bytes):,} bytes")

        # Save locally if requested
        if args.save_local:
            local_dir = "scripts/artwork-output"
            os.makedirs(local_dir, exist_ok=True)
            local_path = os.path.join(local_dir, info["filename"])
            with open(local_path, "wb") as f:
                f.write(image_bytes)
            print(f"  Saved locally: {local_path}")

        # Upload to Supabase
        storage_path = f"{FOLDER}/{info['filename']}"
        print(f"  Uploading to Supabase: {storage_path}")
        public_url = upload_to_supabase(image_bytes, storage_path)
        if public_url:
            print(f"  SUCCESS: {public_url}")
            results[slug] = public_url
        else:
            print(f"  FAILED to upload {slug}")

        # Rate limit: wait between requests
        time.sleep(5)

    # Print summary
    if results:
        print(f"\n{'='*60}")
        print("SUMMARY — Add these to FALLBACK_IMAGES.categories in constants.ts:")
        print("```typescript")
        print("categories: {")
        for slug, url in results.items():
            print(f"  '{slug}': '{url}',")
        print("}")
        print("```")


if __name__ == "__main__":
    main()
