/**
 * Basic HTML sanitizer to prevent XSS attacks.
 * Strips dangerous tags and attributes while preserving safe HTML content.
 */

/** Allowed tags for reference (enforcement is pattern-based below) */
const _ALLOWED_TAGS = new Set([
  'p', 'br', 'b', 'i', 'em', 'strong', 'u', 's', 'strike',
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'ul', 'ol', 'li',
  'a', 'img',
  'blockquote', 'pre', 'code',
  'table', 'thead', 'tbody', 'tr', 'th', 'td',
  'hr', 'span', 'div', 'figure', 'figcaption',
  'sub', 'sup', 'mark',
]);

/** Allowed attributes per tag for reference (enforcement is pattern-based below) */
const _ALLOWED_ATTRS: Record<string, Set<string>> = {
  a: new Set(['href', 'title', 'target', 'rel']),
  img: new Set(['src', 'alt', 'title', 'width', 'height', 'loading']),
  td: new Set(['colspan', 'rowspan']),
  th: new Set(['colspan', 'rowspan', 'scope']),
  '*': new Set(['class', 'id']),
};

const DANGEROUS_PATTERNS = [
  /javascript\s*:/gi,
  /vbscript\s*:/gi,
  /data\s*:[^image]/gi,
  /on\w+\s*=/gi,
  /<script[\s>]/gi,
  /<\/script>/gi,
  /<iframe[\s>]/gi,
  /<\/iframe>/gi,
  /<object[\s>]/gi,
  /<\/object>/gi,
  /<embed[\s>]/gi,
  /<\/embed>/gi,
  /<form[\s>]/gi,
  /<\/form>/gi,
  /<input[\s>]/gi,
  /<button[\s>]/gi,
  /<style[\s>]/gi,
  /<\/style>/gi,
  /<link[\s>]/gi,
  /<meta[\s>]/gi,
  /<base[\s>]/gi,
];

export function sanitizeHtml(html: string): string {
  if (!html) return '';

  let sanitized = html;

  // Remove dangerous patterns
  for (const pattern of DANGEROUS_PATTERNS) {
    sanitized = sanitized.replace(pattern, '');
  }

  // Remove event handlers (onclick, onload, onerror, etc.)
  sanitized = sanitized.replace(/\s+on\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]*)/gi, '');

  // Ensure all links with target="_blank" have rel="noopener noreferrer"
  sanitized = sanitized.replace(
    /(<a\s[^>]*target\s*=\s*["']_blank["'][^>]*)>/gi,
    (match) => {
      if (!/rel\s*=/i.test(match)) {
        return match.replace(/>$/, ' rel="noopener noreferrer">');
      }
      return match;
    }
  );

  return sanitized;
}
