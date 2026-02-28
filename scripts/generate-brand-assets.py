#!/usr/bin/env python3
"""
Generate brand assets via Gemini 2.5 Flash image generation,
then upload to Supabase Storage (location-images bucket).

Assets generated:
  1. Logo icon (512x512) — used for favicon, apple-touch-icon, PWA
  2. OG image (1200x630) — social sharing image
  3. Mystery card back (400x600) — tarot-style Saigon watercolor for flip cards

Usage:
  python3 scripts/generate-brand-assets.py [--dry-run] [--asset SLUG] [--save-local]

Requires: pip install requests Pillow

Environment variables:
  GEMINI_API_KEY
  SUPABASE_URL
  SUPABASE_SERVICE_ROLE_KEY
"""

from __future__ import annotations

import argparse
import base64
import io
import os
import requests
import sys
import time

try:
    from PIL import Image
except ImportError:
    print("Pillow is required: pip install Pillow")
    sys.exit(1)

GEMINI_API_KEY = os.environ["GEMINI_API_KEY"]
SUPABASE_URL = os.environ["SUPABASE_URL"]
SUPABASE_SERVICE_ROLE_KEY = os.environ["SUPABASE_SERVICE_ROLE_KEY"]

BUCKET = "location-images"
FOLDER = "brand"

# ─── Style prefixes ────────────────────────────────────────────

LOGO_STYLE = (
    "A square icon design, clean flat illustration style with warm watercolor textures. "
    "Vietnamese-inspired, muted earth tones with red (#D32F2F) and gold (#F9A825) accents. "
    "Simple, recognizable at small sizes (16x16 px). No text, no watermarks. "
    "Transparent or white background. "
)

OG_STYLE = (
    "A beautiful warm watercolor illustration in the style of Vietnamese tranh ve (traditional art), "
    "wide landscape composition exactly 1200x630 pixels, suitable for social media sharing. "
    "Soft warm lighting, vintage feel, muted earth tones with pops of red and gold. "
    "No text, no watermarks, no writing. "
    "The scene should feel authentic, inviting, and nostalgic. "
)

MYSTERY_CARD_STYLE = (
    "A beautiful warm watercolor illustration in the style of Vietnamese tranh ve (traditional art), "
    "portrait orientation (2:3 ratio), designed as the back of a tarot/mystery card. "
    "Intricate decorative border with Vietnamese-inspired motifs (lotus flowers, dragon, phoenix). "
    "Soft warm lighting, vintage feel, muted earth tones with pops of red (#D32F2F) and gold (#F9A825). "
    "No text, no watermarks. Symmetrical, mystical, inviting. "
)

# ─── Asset definitions ─────────────────────────────────────────

ASSETS = {
    "logo": {
        "prompt": (
            LOGO_STYLE
            + "A stylized bowl of steaming pho noodle soup with chopsticks, "
            "seen from above at a slight angle. The bowl has a red rim. "
            "Steam rises artistically. The design captures the essence of "
            "Saigon street food culture in a single iconic symbol. "
            "Warm, welcoming, appetizing. Suitable as an app icon / favicon."
        ),
        "filename": "logo-512.png",
        "description": "Brand logo / favicon source (512x512)",
    },
    "og": {
        "prompt": (
            OG_STYLE
            + "A panoramic Saigon food scene: a bustling sidewalk with multiple food stalls, "
            "a steaming bowl of pho in the foreground, ba chi nuong on a grill, "
            "ca phe sua da on a tiny metal table, motorbikes in the background, "
            "old French colonial buildings. The energy and warmth of Saigon food culture. "
            "Dawn light, golden hour, inviting atmosphere."
        ),
        "filename": "og-image.png",
        "description": "Open Graph social sharing image (1200x630)",
    },
    "mystery-card": {
        "prompt": (
            MYSTERY_CARD_STYLE
            + "The center features a stylized Saigon cityscape silhouette "
            "(Notre-Dame Cathedral, Bitexco Tower, old shophouses) surrounded by "
            "floating food icons (pho bowl, banh mi, coffee phin filter, che glass). "
            "Decorative lotus flowers at the four corners. "
            "A large ornate question mark subtly integrated into the design. "
            "The overall feel is mystical, exciting, like unveiling a delicious secret. "
            "Color palette: deep navy blue background with red and gold details."
        ),
        "filename": "mystery-card-back.png",
        "description": "Mystery card back design (Saigon-themed tarot style)",
    },
}


def generate_image(prompt: str) -> bytes | None:
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
        print("  ERROR: No candidates in response")
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


def upload_to_supabase(image_bytes: bytes, path: str) -> str | None:
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


def create_favicon_sizes(logo_bytes: bytes, output_dir: str) -> dict[str, str]:
    """
    From the 512x512 logo, create resized favicon PNGs and ICO.
    Returns dict of filename -> local path.
    """
    img = Image.open(io.BytesIO(logo_bytes))
    # Ensure RGBA
    if img.mode != "RGBA":
        img = img.convert("RGBA")

    sizes = {
        "favicon-16x16.png": 16,
        "favicon-32x32.png": 32,
        "apple-touch-icon.png": 180,
        "android-chrome-192x192.png": 192,
        "android-chrome-512x512.png": 512,
    }

    # Use LANCZOS resampling (compatible with older Pillow versions)
    resample = getattr(Image, "LANCZOS", getattr(Image, "ANTIALIAS", None))

    results = {}
    for filename, size in sizes.items():
        resized = img.resize((size, size), resample)
        path = os.path.join(output_dir, filename)
        resized.save(path, "PNG")
        results[filename] = path
        print(f"    Created {filename} ({size}x{size})")

    # Create .ico with multiple sizes
    ico_path = os.path.join(output_dir, "favicon.ico")
    ico_sizes = [(16, 16), (32, 32), (48, 48)]
    ico_images = [img.resize(s, resample) for s in ico_sizes]
    ico_images[0].save(ico_path, format="ICO", sizes=ico_sizes)
    results["favicon.ico"] = ico_path
    print(f"    Created favicon.ico (16+32+48)")

    return results


def main():
    parser = argparse.ArgumentParser(description="Generate brand assets via Gemini")
    parser.add_argument("--dry-run", action="store_true", help="Only print prompts, don't generate")
    parser.add_argument("--asset", type=str, help="Generate only this asset slug (logo, og, mystery-card)")
    parser.add_argument("--save-local", action="store_true", help="Also save images locally")
    args = parser.parse_args()

    assets_to_gen = ASSETS
    if args.asset:
        if args.asset not in ASSETS:
            print(f"Unknown asset: {args.asset}")
            print(f"Available: {', '.join(ASSETS.keys())}")
            sys.exit(1)
        assets_to_gen = {args.asset: ASSETS[args.asset]}

    local_dir = "scripts/brand-assets-output"
    os.makedirs(local_dir, exist_ok=True)

    results = {}
    errors = []

    for slug, info in assets_to_gen.items():
        print(f"\n{'='*60}")
        print(f"Asset: {slug} — {info['description']}")
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

        # Save locally (always for logo since we need to create favicon sizes)
        local_path = os.path.join(local_dir, info["filename"])
        with open(local_path, "wb") as f:
            f.write(image_bytes)
        print(f"  Saved locally: {local_path}")

        # Upload main asset to Supabase
        storage_path = f"{FOLDER}/{info['filename']}"
        print(f"  Uploading to Supabase: {storage_path}")
        public_url = upload_to_supabase(image_bytes, storage_path)
        if public_url:
            print(f"  SUCCESS: {public_url}")
            results[slug] = public_url
        else:
            print(f"  FAILED to upload {slug}")
            errors.append(slug)

        # For logo: create favicon sizes and upload each
        if slug == "logo":
            print("\n  Creating favicon sizes from logo...")
            favicon_files = create_favicon_sizes(image_bytes, local_dir)

            for fname, fpath in favicon_files.items():
                with open(fpath, "rb") as f:
                    fbytes = f.read()
                sup_path = f"{FOLDER}/{fname}"
                print(f"  Uploading {fname} to Supabase...")
                furl = upload_to_supabase(fbytes, sup_path)
                if furl:
                    print(f"    OK: {furl}")
                    results[f"logo:{fname}"] = furl
                else:
                    print(f"    FAILED: {fname}")

            # Also copy favicon.ico and apple-touch-icon to public/ for local dev
            import shutil
            public_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "public")
            for fname in ["favicon.ico", "apple-touch-icon.png", "favicon-16x16.png", "favicon-32x32.png"]:
                src = os.path.join(local_dir, fname)
                dst = os.path.join(public_dir, fname)
                if os.path.exists(src):
                    shutil.copy2(src, dst)
                    print(f"  Copied to public/{fname}")

        # Rate limit
        time.sleep(5)

    # Summary
    print(f"\n{'='*60}")
    print("SUMMARY")
    print(f"  Success: {len([k for k in results if ':' not in k])}/{len(assets_to_gen)}")
    print(f"  Errors: {len(errors)}")
    if errors:
        print(f"  Failed: {', '.join(errors)}")

    if results:
        print("\n  Generated assets:")
        for key, url in results.items():
            print(f"    {key}: {url}")

        print("\n  --- Next Steps ---")
        print("  1. Update app/layout.tsx icons metadata")
        print("  2. Update src/utils/constants.ts FALLBACK_IMAGES.og")
        print("  3. Update src/components/collections/MysteryCard.tsx card back")
        print("  4. Create public/site.webmanifest")
        print("  5. Update src/components/layout/Header.tsx logo")


if __name__ == "__main__":
    main()
