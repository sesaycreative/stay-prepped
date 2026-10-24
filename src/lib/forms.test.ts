import { describe, expect, it } from 'vitest';
import { createRateLimiter, escapeHtml, isValidEmail, validateContact } from './forms';

describe('isValidEmail', () => {
  it('accepts normal addresses and rejects bad ones', () => {
    expect(isValidEmail('name@example.co.uk')).toBe(true);
    expect(isValidEmail('name@example')).toBe(false);
    expect(isValidEmail('no at sign')).toBe(false);
    expect(isValidEmail('')).toBe(false);
    expect(isValidEmail(42)).toBe(false);
    expect(isValidEmail('a'.repeat(250) + '@x.com')).toBe(false);
  });
});

describe('validateContact', () => {
  it('returns trimmed values when valid', () => {
    const r = validateContact({ name: ' Sam ', email: 'sam@example.com', message: 'Hello there, a question.' });
    expect(r.ok).toBe(true);
    expect(r.value?.name).toBe('Sam');
  });
  it('returns specific errors', () => {
    const r = validateContact({ name: '', email: 'bad', message: 'short' });
    expect(r.ok).toBe(false);
    expect(Object.keys(r.errors).sort()).toEqual(['email', 'message', 'name']);
  });
});

describe('createRateLimiter', () => {
  it('allows up to the limit within a window, then resets', () => {
    const allow = createRateLimiter(2, 1000);
    expect(allow('ip', 0)).toBe(true);
    expect(allow('ip', 10)).toBe(true);
    expect(allow('ip', 20)).toBe(false);
    expect(allow('other', 20)).toBe(true);
    expect(allow('ip', 1001)).toBe(true);
  });
});

describe('escapeHtml', () => {
  it('escapes markup', () => {
    expect(escapeHtml('<b>"x"&\'</b>')).toBe('&lt;b&gt;&quot;x&quot;&amp;&#39;&lt;/b&gt;');
  });
});
