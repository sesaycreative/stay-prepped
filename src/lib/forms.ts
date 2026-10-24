// Shared validation and rate limiting for the serverless form endpoints.
// Kept pure where possible so it can be unit-tested.

export const EMAIL_RE = /^[^\s@<>()[\]\\,;:"]+@[^\s@<>()[\]\\,;:"]+\.[^\s@<>()[\]\\,;:"]{2,}$/;

export function isValidEmail(v: unknown): v is string {
  return typeof v === 'string' && v.length <= 254 && EMAIL_RE.test(v.trim());
}

export interface ContactInput {
  name: string;
  email: string;
  message: string;
}

export function validateContact(form: { name?: unknown; email?: unknown; message?: unknown }): {
  ok: boolean;
  errors: Partial<Record<keyof ContactInput, string>>;
  value?: ContactInput;
} {
  const errors: Partial<Record<keyof ContactInput, string>> = {};
  const name = typeof form.name === 'string' ? form.name.trim() : '';
  const email = typeof form.email === 'string' ? form.email.trim() : '';
  const message = typeof form.message === 'string' ? form.message.trim() : '';
  if (!name) errors.name = 'Enter your name.';
  else if (name.length > 100) errors.name = 'Your name must be 100 characters or fewer.';
  if (!isValidEmail(email)) errors.email = 'Enter a valid email address, like name@example.com.';
  if (message.length < 10) errors.message = 'Your message must be at least 10 characters.';
  else if (message.length > 5000) errors.message = 'Your message must be 5,000 characters or fewer.';
  const ok = Object.keys(errors).length === 0;
  return { ok, errors, value: ok ? { name, email, message } : undefined };
}

/**
 * Very small in-memory fixed-window rate limiter. On serverless platforms each
 * warm instance has its own memory, so this is a best-effort brake on abuse,
 * not a guarantee. For stronger limits use the platform firewall (documented
 * in README).
 */
export function createRateLimiter(limit: number, windowMs: number) {
  const hits = new Map<string, { count: number; reset: number }>();
  return (key: string, now = Date.now()): boolean => {
    const h = hits.get(key);
    if (!h || now > h.reset) {
      hits.set(key, { count: 1, reset: now + windowMs });
      if (hits.size > 5000) for (const [k, v] of hits) if (now > v.reset) hits.delete(k);
      return true;
    }
    h.count += 1;
    return h.count <= limit;
  };
}

export function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' },
  });
}

export function wantsJson(request: Request): boolean {
  return (request.headers.get('accept') ?? '').includes('application/json');
}

export function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
}
