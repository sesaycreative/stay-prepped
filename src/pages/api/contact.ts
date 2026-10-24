import type { APIRoute } from 'astro';
import { createRateLimiter, escapeHtml, json, validateContact } from '../../lib/forms';

export const prerender = false;

const allow = createRateLimiter(3, 10 * 60 * 1000);

export const POST: APIRoute = async ({ request, clientAddress }) => {
  let ip = 'unknown';
  try {
    ip = request.headers.get('x-forwarded-for')?.split(',')[0].trim() || clientAddress || 'unknown';
  } catch {
    /* ignore */
  }
  if (!allow(ip)) return json({ ok: false, message: 'Too many messages. Please wait a few minutes and try again.' }, 429);

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return json({ ok: false, message: 'We could not read your message. Please try again.' }, 400);
  }
  if (String(form.get('website') ?? '').trim()) return json({ ok: true, message: 'Thanks, your message has been sent.' });

  const v = validateContact({ name: form.get('name'), email: form.get('email'), message: form.get('message') });
  if (!v.ok || !v.value) return json({ ok: false, message: 'Please fix the highlighted fields.', errors: v.errors }, 400);

  const apiKey = import.meta.env.RESEND_API_KEY;
  const to = import.meta.env.CONTACT_TO_EMAIL;
  const from = import.meta.env.CONTACT_FROM_EMAIL;
  if (!apiKey || !to || !from) {
    return json({ ok: false, notConfigured: true, message: 'Our contact form is not live yet. Please email us instead.' }, 503);
  }

  const { name, email, message } = v.value;
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from,
        to: [to],
        reply_to: email,
        subject: `Stay Prepped contact form: ${name.slice(0, 60)}`,
        text: `From: ${name} <${email}>\n\n${message}`,
        html: `<p>From: ${escapeHtml(name)} &lt;${escapeHtml(email)}&gt;</p><p>${escapeHtml(message).replace(/\n/g, '<br>')}</p>`,
      }),
    });
    if (!res.ok) return json({ ok: false, message: 'Sending failed on our side. Please try again later.' }, 502);
    return json({ ok: true, message: 'Thanks, your message has been sent. We aim to reply within a few working days.' });
  } catch {
    return json({ ok: false, message: 'Sending failed on our side. Please try again later.' }, 502);
  }
};

export const GET: APIRoute = () => json({ ok: false, message: 'Use POST.' }, 405);
