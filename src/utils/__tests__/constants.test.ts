import { describe, it, expect } from 'vitest';
import { FALLBACK_IMAGES, FEATURED_COLLECTIONS, SITE_CONFIG } from '../constants';

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
