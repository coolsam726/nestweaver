import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  currentRequestId,
  resolveOrCreateRequestId,
  runWithRequestContext,
} from '../src/core/request-context.js';

describe('request context', () => {
  it('uses inbound X-Request-Id when present', () => {
    assert.equal(
      resolveOrCreateRequestId({ 'x-request-id': 'abc-123' }),
      'abc-123',
    );
  });

  it('generates an id when missing', () => {
    const id = resolveOrCreateRequestId({});
    assert.ok(id.length > 8);
  });

  it('exposes the active request id via ALS', () => {
    runWithRequestContext({ requestId: 'req-1', userId: 'u1' }, () => {
      assert.equal(currentRequestId(), 'req-1');
    });
    assert.equal(currentRequestId(), undefined);
  });
});
