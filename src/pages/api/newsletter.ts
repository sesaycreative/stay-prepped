import type { APIRoute } from 'astro';
import { createRateLimiter, isValidEmail, json, wantsJson } from '../../lib/forms';

export const prerender = false;

const allow = createRateLimiter(5, 10 * 60 * 1000);

function respond(request: Request, ok: boolean, message: string, status: number) {
  if (wantsJson(request)) return json({ ok, message }, status);
  // Non-JS fallback: a minimal accessible page.
  return new Response(
    `<!doctype html><html lang="en-GB"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Newsletter | Stay Prepped</title><body style="font-family:system-ui,sans-serif;max-width:36rem;margin:3rem auto;padding:0 1rem;line-height:1.6"><h1>Newsletter</h1><p>${message}</p><p><a href="/">Back to Stay Prepped</a></p></body></html>`,
    { status, headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' } },
  );
}

export const POST: APIRoute = async ({ request, clientAddress }) => {
  let ip = 'unknown';
  try {
    ip = request.headers.get('x-forwarded-for')?.split(',')[0].trim() || clientAddress || 'unknown';
  } catch {
    /* clientAddress can throw on some adapters */
  }
  if (!allow(ip)) return respond(request, false, 'Too many attempts. Please wait a few minutes and try again.', 429);

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return respond(request, false, 'We could not read your sign-up. Please try again.', 400);
  }
  // Honeypot: pretend success to bots.
  if (String(form.get('website') ?? '').trim()) return respond(request, true, 'Thanks, you are signed up.', 200);

  const email = String(form.get('email') ?? '').trim();
  if (!isValidEmail(email)) return respond(request, false, 'Enter a valid email address, like name@example.com.', 400);

  // Read at request time. Since Astro 6, import.meta.env is inlined at build
  // time, which would bake the secret into the bundle (or leave it undefined).
  const apiKey = process.env.RESEND_API_KEY;
  const segmentId = process.env.RESEND_SEGMENT_ID;
  if (!apiKey || !segmentId) {
    return respond(request, false, 'Our newsletter is not live yet, so we have not stored your email address. Please check back soon.', 503);
  }

  try {
    // Resend contacts API (the older per-audience endpoint is deprecated;
    // audiences are now "segments"). See resend.com/docs/api-reference/contacts/create-contact
    const res = await fetch('https://api.resend.com/contacts', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, unsubscribed: false, segments: [{ id: segmentId }] }),
    });
    if (!res.ok) return respond(request, false, 'Sign-up failed on our side. Please try again later.', 502);
    return respond(request, true, 'Thanks, you are signed up. Look out for our next email.', 200);
  } catch {
    return respond(request, false, 'Sign-up failed on our side. Please try again later.', 502);
  }
};

export const GET: APIRoute = () => json({ ok: false, message: 'Use POST.' }, 405);
