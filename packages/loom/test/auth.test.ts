import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  buildSessionCookie,
  hashPassword,
  signSession,
  verifyPassword,
  verifySession,
} from '../src/core/auth.js';

describe('password hashing', () => {
  it('hashes and verifies scrypt passwords', async () => {
    const hash = await hashPassword('secret');
    assert.match(hash, /^scrypt\$/);
    assert.equal(await verifyPassword('secret', hash), true);
    assert.equal(await verifyPassword('wrong', hash), false);
  });

  it('rejects plaintext in production by default', async () => {
    const prev = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';
    try {
      assert.equal(await verifyPassword('plain', 'plain'), false);
      assert.equal(
        await verifyPassword('plain', 'plain', { allowPlaintext: true }),
        true,
      );
    } finally {
      process.env.NODE_ENV = prev;
    }
  });
});

describe('sessions', () => {
  it('signs and verifies session tokens', () => {
    const token = signSession({ sub: 'user-1', exp: Date.now() + 60_000 }, 'secret');
    const payload = verifySession(token, 'secret');
    assert.equal(payload?.sub, 'user-1');
  });

  it('rejects tampered or expired tokens', () => {
    const token = signSession({ sub: 'user-1', exp: Date.now() + 60_000 }, 'secret');
    assert.equal(verifySession(token, 'other'), null);
    assert.equal(
      verifySession(
        signSession({ sub: 'user-1', exp: Date.now() - 1 }, 'secret'),
        'secret',
      ),
      null,
    );
  });

  it('clears cookie with a single Max-Age=0', () => {
    const cookie = buildSessionCookie({ secret: 'x' }, null);
    assert.match(cookie, /Path=\//);

    const underApp = buildSessionCookie(
      { secret: 'x', cookiePath: '/my-app' },
      null,
    );
    assert.match(underApp, /Path=\/my-app/);
    assert.equal(cookie.includes('Max-Age=0'), true);
    assert.equal(cookie.match(/Max-Age=/g)?.length, 1);
  });
});
