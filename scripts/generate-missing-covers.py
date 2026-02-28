#!/usr/bin/env python3
import os
import requests
import json
import base64
import subprocess
import sys

# Validate environment variables
required_vars = ["GEMINI_API_KEY", "SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY", "SUPABASE_PROJECT_REF"]
missing_vars = [var for var in required_vars if not os.environ.get(var)]
if missing_vars:
    print(f"Error: Missing required environment variables: {', '.join(missing_vars)}")
    sys.exit(1)

GEMINI_API_KEY = os.environ["GEMINI_API_KEY"]
SUPABASE_URL = os.environ["SUPABASE_URL"]
SUPABASE_SERVICE_ROLE_KEY = os.environ["SUPABASE_SERVICE_ROLE_KEY"]
PROJECT_REF = os.environ["SUPABASE_PROJECT_REF"]

def generate_image(prompt):
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent?key={GEMINI_API_KEY}"
    payload = {
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {"responseModalities": ["TEXT", "IMAGE"]},
    }
    resp = requests.post(url, json=payload, timeout=120)
    if resp.status_code != 200:
        print(f"Gemini API Error: {resp.status_code} - {resp.text}")
        return None
    data = resp.json()
    candidates = data.get("candidates", [])
    if not candidates:
        return None
    parts = candidates[0].get("content", {}).get("parts", [])
    for part in parts:
        if "inlineData" in part:
            mime = part["inlineData"].get("mimeType", "")
            if mime.startswith("image/"):
                b64 = part["inlineData"]["data"]
                return base64.b64decode(b64)
    return None

def upload_to_supabase(image_bytes, path):
    upload_url = f"{SUPABASE_URL}/storage/v1/object/location-images/collection-covers/{path}"
    headers = {
        "Authorization": f"Bearer {SUPABASE_SERVICE_ROLE_KEY}",
        "Content-Type": "image/png",
        "x-upsert": "true",
    }
    resp = requests.post(upload_url, headers=headers, data=image_bytes, timeout=60)
    if resp.status_code not in (200, 201):
        print(f"Supabase Storage Error: {resp.status_code} - {resp.text}")
        return None
    return f"{SUPABASE_URL}/storage/v1/object/public/location-images/collection-covers/{path}"

# Get missing collections using REST API via PostgREST (no need for Management API if using Service Role)
headers = {
    "apikey": SUPABASE_SERVICE_ROLE_KEY,
    "Authorization": f"Bearer {SUPABASE_SERVICE_ROLE_KEY}",
    "Content-Type": "application/json"
}
# Filter for AI collections without cover images
rest_url = f"{SUPABASE_URL}/rest/v1/collections?source=eq.ai&cover_image_url=is.null&select=id,title,slug"

print("Fetching collections without cover images...")
resp = requests.get(rest_url, headers=headers)

if resp.status_code == 200:
    collections = resp.json()
    print(f"Found {len(collections)} collections without cover images.")
    
    if len(collections) == 0:
        sys.exit(0)
        
    STYLE_PREFIX = (
        "A beautiful warm watercolor illustration in the style of Vietnamese tranh ve (traditional art), "
        "wide landscape composition suitable for a website hero/banner image, "
        "soft warm lighting, vintage feel, muted earth tones with pops of red and gold. "
        "No text, no watermarks, no writing. "
        "The scene should feel authentic, inviting, and nostalgic. "
        "IMPORTANT: The illustration must fill the ENTIRE canvas edge-to-edge with NO white borders, NO margins, NO padding. "
    )

    # Make sure tmp directory exists
    os.makedirs("/tmp/covers", exist_ok=True)

    for c in collections:
        title = c["title"]
        slug = c["slug"]
        c_id = c["id"]
        print(f"--- Generating for: {title} (ID: {c_id}) ---")
        prompt = f"{STYLE_PREFIX} A lively and atmospheric Saigon scene illustrating the theme: '{title}'. Highlight Vietnamese food, local culture, and a cozy dining vibe."
        
        img_bytes = generate_image(prompt)
        if img_bytes:
            tmp_orig = f"/tmp/covers/{slug}.png"
            tmp_fixed = f"/tmp/covers/{slug}-fixed.png"
            
            with open(tmp_orig, "wb") as f:
                f.write(img_bytes)
            
            # trim and resize using ImageMagick
            print("Processing image with ImageMagick...")
            subprocess.run([
                "magick", tmp_orig, "-fuzz", "10%", "-trim", "+repage", 
                "-resize", "1024x768^", "-gravity", "center", "-extent", "1024x768", 
                "-gravity", "southeast", "-pointsize", "24", "-fill", "rgba(255,255,255,0.6)", "-annotate", "+20+20", "toilanguoisaigon.com",
                tmp_fixed
            ], check=True)
            
            with open(tmp_fixed, "rb") as f:
                fixed_bytes = f.read()
                
            cover_url = upload_to_supabase(fixed_bytes, f"{slug}.png")
            if cover_url:
                print(f"Uploaded to {cover_url}")
                # Update record using REST API
                update_url = f"{SUPABASE_URL}/rest/v1/collections?id=eq.{c_id}"
                update_resp = requests.patch(update_url, headers=headers, json={"cover_image_url": cover_url})
                if update_resp.status_code in (200, 204):
                    print("Database record updated successfully.")
                else:
                    print(f"Failed to update database: {update_resp.status_code} - {update_resp.text}")
            else:
                print("Failed to upload image.")
        else:
            print("Failed to generate image via Gemini.")
else:
    print(f"Failed to fetch from DB: {resp.status_code} - {resp.text}")
    sys.exit(1)
