/**
 * HTML sanitizer using DOMPurify to prevent XSS attacks.
 * Uses allowlist approach (only safe tags/attributes pass through).
 */
import DOMPurify from 'dompurify';

const ALLOWED_TAGS = [
  'p', 'br', 'b', 'i', 'em', 'strong', 'u', 's', 'strike',
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'ul', 'ol', 'li',
  'a', 'img',
  'blockquote', 'pre', 'code',
  'table', 'thead', 'tbody', 'tr', 'th', 'td',
  'hr', 'span', 'div', 'figure', 'figcaption',
  'sub', 'sup', 'mark',
];

const ALLOWED_ATTR = [
  'href', 'title', 'target', 'rel',
  'src', 'alt', 'width', 'height', 'loading',
  'colspan', 'rowspan', 'scope',
  'class', 'id',
];

export function sanitizeHtml(html: string): string {
  if (!html) return '';

  const clean = DOMPurify.sanitize(html, {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
    ALLOW_DATA_ATTR: false,
    ADD_ATTR: ['target'],
    FORBID_TAGS: [
      'script', 'style', 'iframe', 'object', 'embed', 'form', 'input',
      'button', 'select', 'textarea', 'meta', 'link', 'base', 'svg', 'math',
    ],
  });

  // Ensure all links with target="_blank" have rel="noopener noreferrer"
  return clean.replace(
    /(<a\s[^>]*target\s*=\s*["']_blank["'][^>]*)>/gi,
    (match) => {
      if (!/rel\s*=/i.test(match)) {
        return match.replace(/>$/, ' rel="noopener noreferrer">');
      }
      return match;
    }
  );
}
