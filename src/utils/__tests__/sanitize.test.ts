/**
 * @vitest-environment happy-dom
 */
import { describe, it, expect } from 'vitest';
import { sanitizeHtml } from '../sanitize';

describe('sanitizeHtml', () => {
  it('returns empty string for falsy input', () => {
    expect(sanitizeHtml('')).toBe('');
    expect(sanitizeHtml(null as unknown as string)).toBe('');
    expect(sanitizeHtml(undefined as unknown as string)).toBe('');
  });

  it('preserves safe HTML tags', () => {
    const html = '<p>Hello <strong>world</strong></p>';
    const result = sanitizeHtml(html);
    expect(result).toContain('<p>');
    expect(result).toContain('<strong>world</strong>');
  });

  it('preserves links with href', () => {
    const html = '<a href="https://example.com">Link</a>';
    const result = sanitizeHtml(html);
    expect(result).toContain('href="https://example.com"');
    expect(result).toContain('Link</a>');
  });

  it('preserves images', () => {
    const html = '<img src="photo.jpg" alt="Photo">';
    const result = sanitizeHtml(html);
    expect(result).toContain('src="photo.jpg"');
    expect(result).toContain('alt="Photo"');
  });

  it('preserves headings, lists, and tables', () => {
    const html = '<h1>Title</h1><ul><li>Item</li></ul><table><tr><td>Cell</td></tr></table>';
    const result = sanitizeHtml(html);
    expect(result).toContain('<h1>Title</h1>');
    expect(result).toContain('<li>Item</li>');
    expect(result).toContain('<td>Cell</td>');
  });

  // XSS prevention tests
  it('removes script tags', () => {
    const html = '<p>Safe</p><script>alert("xss")</script>';
    const result = sanitizeHtml(html);
    expect(result).not.toContain('<script');
    expect(result).not.toContain('</script>');
    expect(result).toContain('<p>Safe</p>');
  });

  it('removes javascript: protocol from hrefs', () => {
    const html = '<a href="javascript:alert(1)">Click</a>';
    const result = sanitizeHtml(html);
    expect(result).not.toContain('javascript:');
  });

  it('removes onclick and other event handlers', () => {
    const html = '<div onclick="alert(1)">Click</div>';
    const result = sanitizeHtml(html);
    expect(result).not.toContain('onclick');
  });

  it('removes onload event handler', () => {
    const html = '<img src="x" onerror="alert(1)">';
    const result = sanitizeHtml(html);
    expect(result).not.toContain('onerror');
  });

  it('removes onmouseover event handler', () => {
    const html = '<span onmouseover="alert(1)">Hover</span>';
    const result = sanitizeHtml(html);
    expect(result).not.toContain('onmouseover');
  });

  it('removes iframe tags', () => {
    const html = '<p>Safe</p><iframe src="evil.com"></iframe>';
    const result = sanitizeHtml(html);
    expect(result).not.toContain('<iframe');
    expect(result).not.toContain('</iframe>');
  });

  it('removes object tags', () => {
    const html = '<object data="evil.swf"></object>';
    const result = sanitizeHtml(html);
    expect(result).not.toContain('<object');
    expect(result).not.toContain('evil.swf');
  });

  it('removes form tags', () => {
    const html = '<form action="evil">Submit</form>';
    const result = sanitizeHtml(html);
    expect(result).not.toContain('<form');
    expect(result).not.toContain('action=');
  });

  it('removes style tags', () => {
    const html = '<style>body { display: none; }</style><p>Content</p>';
    const result = sanitizeHtml(html);
    expect(result).not.toContain('<style');
    expect(result).not.toContain('</style>');
  });

  it('removes vbscript: protocol', () => {
    const html = '<a href="vbscript:alert(1)">Click</a>';
    const result = sanitizeHtml(html);
    expect(result).not.toContain('vbscript:');
  });

  it('removes meta tags', () => {
    const html = '<meta http-equiv="refresh" content="0"><p>Safe</p>';
    const result = sanitizeHtml(html);
    expect(result).not.toContain('<meta');
    expect(result).not.toContain('http-equiv');
    expect(result).toContain('<p>Safe</p>');
  });

  // rel="noopener noreferrer" enforcement
  it('adds rel="noopener noreferrer" to target="_blank" links', () => {
    const html = '<a href="https://example.com" target="_blank">Link</a>';
    const result = sanitizeHtml(html);
    expect(result).toContain('rel="noopener noreferrer"');
  });

  it('does not duplicate rel if already present', () => {
    const html = '<a href="https://example.com" target="_blank" rel="noopener">Link</a>';
    const result = sanitizeHtml(html);
    // Should not add another rel attribute
    const relCount = (result.match(/rel=/g) || []).length;
    expect(relCount).toBe(1);
  });

  // Edge cases
  it('handles complex nested content', () => {
    const html = '<div><p>Hello <em>world</em></p><blockquote>Quote</blockquote></div>';
    const result = sanitizeHtml(html);
    expect(result).toContain('<em>world</em>');
    expect(result).toContain('<blockquote>Quote</blockquote>');
  });

  it('handles case-insensitive dangerous tags', () => {
    const html = '<SCRIPT>alert(1)</SCRIPT>';
    const result = sanitizeHtml(html);
    expect(result).not.toContain('alert(1)');
  });

  it('removes data: URIs except for images', () => {
    const html = '<a href="data:text/html,<script>alert(1)</script>">Click</a>';
    const result = sanitizeHtml(html);
    expect(result).not.toContain('data:text');
  });
});
