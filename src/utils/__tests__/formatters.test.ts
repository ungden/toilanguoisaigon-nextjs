import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { formatPriceRange, formatOpeningHours, cleanReviewSummary } from '../formatters';

describe('formatPriceRange', () => {
  it('returns "Chưa cập nhật" for null/undefined', () => {
    expect(formatPriceRange(null)).toBe('Chưa cập nhật');
    expect(formatPriceRange(undefined)).toBe('Chưa cập nhật');
    expect(formatPriceRange('')).toBe('Chưa cập nhật');
  });

  it('maps $ to Vietnamese price range', () => {
    expect(formatPriceRange('$')).toBe('Dưới 200.000đ');
  });

  it('maps $$ to Vietnamese price range', () => {
    expect(formatPriceRange('$$')).toBe('200.000đ - 500.000đ');
  });

  it('maps $$$ to Vietnamese price range', () => {
    expect(formatPriceRange('$$$')).toBe('500.000đ - 1.000.000đ');
  });

  it('maps $$$$ to Vietnamese price range', () => {
    expect(formatPriceRange('$$$$')).toBe('Trên 1.000.000đ');
  });

  it('returns raw value for unknown price range', () => {
    expect(formatPriceRange('expensive')).toBe('expensive');
  });
});

describe('formatOpeningHours', () => {
  let dateSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    // Mock Date to be Monday (day=1)
    dateSpy = vi.spyOn(Date.prototype, 'getDay').mockReturnValue(1);
  });

  afterEach(() => {
    dateSpy.mockRestore();
  });

  it('returns "Chưa cập nhật" for null/undefined', () => {
    expect(formatOpeningHours(null)).toBe('Chưa cập nhật');
    expect(formatOpeningHours(undefined)).toBe('Chưa cập nhật');
  });

  it('returns "Chưa cập nhật" for non-object values', () => {
    expect(formatOpeningHours('string')).toBe('Chưa cập nhật');
    expect(formatOpeningHours(123)).toBe('Chưa cập nhật');
    expect(formatOpeningHours(true)).toBe('Chưa cập nhật');
  });

  it('returns "Chưa cập nhật" for arrays', () => {
    expect(formatOpeningHours([])).toBe('Chưa cập nhật');
  });

  it('returns today hours based on day of week', () => {
    // Monday = day 1
    const hours = { monday: '8:00 - 22:00', tuesday: '9:00 - 21:00' };
    expect(formatOpeningHours(hours)).toBe('8:00 - 22:00');
  });

  it('returns "Mở cửa 24h" for 24h venues', () => {
    const hours = { monday: '24h' };
    expect(formatOpeningHours(hours)).toBe('Mở cửa 24h');
  });

  it('returns "Chưa cập nhật" if today is not found (no longer falls back to Monday)', () => {
    // Mock Sunday (day=0) 
    dateSpy.mockReturnValue(0);
    const hours = { monday: '10:00 - 20:00' };
    expect(formatOpeningHours(hours)).toBe('Chưa cập nhật');
  });

  it('returns "Chưa cập nhật" when no hours data matches', () => {
    dateSpy.mockReturnValue(0);
    const hours = { tuesday: '9:00 - 21:00' };
    // Sunday not found, monday fallback also not found
    expect(formatOpeningHours(hours)).toBe('Chưa cập nhật');
  });
});

describe('cleanReviewSummary', () => {
  it('returns null for null/undefined/empty', () => {
    expect(cleanReviewSummary(null)).toBeNull();
    expect(cleanReviewSummary(undefined)).toBeNull();
    expect(cleanReviewSummary('')).toBeNull();
  });

  it('returns null for strings shorter than 10 chars', () => {
    expect(cleanReviewSummary('ngon')).toBeNull();
    expect(cleanReviewSummary('OK')).toBeNull();
  });

  it('returns null for junk "không được cung cấp" pattern', () => {
    expect(cleanReviewSummary('Thông tin tóm tắt review cụ thể không được cung cấp trong dữ liệu Google Maps.')).toBeNull();
    expect(cleanReviewSummary('Thông tin review không được cung cấp.')).toBeNull();
  });

  it('returns null for junk "không có thông tin" pattern', () => {
    expect(cleanReviewSummary('Không có thông tin review cho địa điểm này.')).toBeNull();
  });

  it('returns null for junk "chưa có review" pattern', () => {
    expect(cleanReviewSummary('Chưa có review nào trên Google Maps.')).toBeNull();
    expect(cleanReviewSummary('Chưa có đánh giá nào.')).toBeNull();
  });

  it('returns null for English junk patterns', () => {
    expect(cleanReviewSummary('No review data available')).toBeNull();
    expect(cleanReviewSummary('Not available for this location')).toBeNull();
    expect(cleanReviewSummary('Not provided in the data')).toBeNull();
  });

  it('returns the original string for valid review summaries', () => {
    const valid = 'Phở đậm đà, nước dùng trong veo, thịt bò mềm. Phục vụ nhanh.';
    expect(cleanReviewSummary(valid)).toBe(valid);
  });

  it('trims whitespace from valid summaries', () => {
    const valid = '  Quán ăn ngon, giá rẻ, phục vụ tốt.  ';
    expect(cleanReviewSummary(valid)).toBe(valid.trim());
  });
});
