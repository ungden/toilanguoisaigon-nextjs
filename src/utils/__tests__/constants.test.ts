import { describe, it, expect } from 'vitest';
import { FALLBACK_IMAGES, FEATURED_COLLECTIONS, SITE_CONFIG, CATEGORY_ARTWORK, getCategoryArtwork, ARTWORK_MESSAGE } from '../constants';

describe('FALLBACK_IMAGES', () => {
  it('has all required keys', () => {
    expect(FALLBACK_IMAGES).toHaveProperty('location');
    expect(FALLBACK_IMAGES).toHaveProperty('collection');
    expect(FALLBACK_IMAGES).toHaveProperty('hero');
    expect(FALLBACK_IMAGES).toHaveProperty('collectionHero');
    expect(FALLBACK_IMAGES).toHaveProperty('og');
  });

  it('all values are valid URLs', () => {
    for (const [key, url] of Object.entries(FALLBACK_IMAGES)) {
      expect(url, `${key} should be a valid URL`).toMatch(/^https:\/\//);
    }
  });

  it('OG image has 1200w for social sharing', () => {
    expect(FALLBACK_IMAGES.og).toContain('w=1200');
  });
});

describe('FEATURED_COLLECTIONS', () => {
  it('is a non-empty array', () => {
    expect(Array.isArray(FEATURED_COLLECTIONS)).toBe(true);
    expect(FEATURED_COLLECTIONS.length).toBeGreaterThan(0);
  });

  it('each entry has a title', () => {
    for (const fc of FEATURED_COLLECTIONS) {
      expect(fc.title).toBeTruthy();
      expect(typeof fc.title).toBe('string');
    }
  });

  it('overrideImage is optional and valid URL when present', () => {
    for (const fc of FEATURED_COLLECTIONS) {
      if (fc.overrideImage) {
        expect(fc.overrideImage).toMatch(/^https:\/\//);
      }
    }
  });
});

describe('SITE_CONFIG', () => {
  it('has name, email, and url', () => {
    expect(SITE_CONFIG.name).toBe('Tôi là người Sài Gòn');
    expect(SITE_CONFIG.email).toContain('@');
    expect(SITE_CONFIG.url).toMatch(/^https:\/\//);
  });

  it('URL matches the production domain', () => {
    expect(SITE_CONFIG.url).toBe('https://www.toilanguoisaigon.com');
  });
});

describe('CATEGORY_ARTWORK', () => {
  it('has all 12 category keys', () => {
    const expected = ['pho', 'bun', 'com', 'banh-mi', 'cafe', 'oc', 'lau', 'che', 'hu-tieu', 'chay', 'nhau', 'default'];
    for (const key of expected) {
      expect(CATEGORY_ARTWORK).toHaveProperty(key);
    }
  });

  it('all values are valid Supabase storage URLs', () => {
    for (const [key, url] of Object.entries(CATEGORY_ARTWORK)) {
      expect(url, `${key} should be a Supabase URL`).toContain('supabase.co/storage/v1/object/public/location-images/category-artwork/');
    }
  });
});

describe('getCategoryArtwork', () => {
  it('returns pho artwork for pho-related names', () => {
    expect(getCategoryArtwork('Phở Hòa Pasteur')).toBe(CATEGORY_ARTWORK.pho);
    expect(getCategoryArtwork('Pho 24')).toBe(CATEGORY_ARTWORK.pho);
  });

  it('returns cafe artwork for cafe names', () => {
    expect(getCategoryArtwork('Cà Phê Sữa Đá Shop')).toBe(CATEGORY_ARTWORK.cafe);
    expect(getCategoryArtwork("Okkio Caffe")).toBe(CATEGORY_ARTWORK.cafe);
  });

  it('returns com artwork for com tam names', () => {
    expect(getCategoryArtwork('Cơm Tấm Dì Út')).toBe(CATEGORY_ARTWORK.com);
  });

  it('returns default artwork for unrecognized names', () => {
    expect(getCategoryArtwork('Nhà hàng ABC XYZ')).toBe(CATEGORY_ARTWORK.default);
  });

  it('is case-insensitive', () => {
    expect(getCategoryArtwork('PHỞ HÒA')).toBe(CATEGORY_ARTWORK.pho);
  });
});

describe('ARTWORK_MESSAGE', () => {
  it('is a non-empty Vietnamese string', () => {
    expect(ARTWORK_MESSAGE).toBeTruthy();
    expect(typeof ARTWORK_MESSAGE).toBe('string');
  });
});
