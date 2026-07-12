import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { can, canAny, isAdmin, userHasPermission } from '../src/core/abilities.js';
import type { LoomAuthUser } from '../src/core/auth.js';

function user(permissions: string[], roles: string[] = []): LoomAuthUser {
  return {
    id: '1',
    name: 'Test',
    email: 't@example.com',
    permissions,
    roles,
  };
}

describe('can / wildcards', () => {
  it('grants exact permission', () => {
    assert.equal(can(user(['companies:viewAny']), 'companies:viewAny'), true);
  });

  it('grants via resource wildcard', () => {
    assert.equal(can(user(['companies:*']), 'companies:edit'), true);
  });

  it('grants via global *', () => {
    assert.equal(can(user(['*']), 'orders:delete'), true);
  });

  it('grants via ability wildcard', () => {
    assert.equal(can(user(['*:view']), 'tags:view'), true);
  });

  it('denies missing permission', () => {
    assert.equal(can(user(['companies:view']), 'companies:edit'), false);
  });

  it('denies null user', () => {
    assert.equal(can(null, 'companies:view'), false);
  });
});

describe('userHasPermission / isAdmin / canAny', () => {
  it('userHasPermission checks slug ability', () => {
    assert.equal(userHasPermission(user(['deals:create']), 'deals', 'create'), true);
    assert.equal(userHasPermission(user(['deals:view']), 'deals', 'create'), false);
  });

  it('isAdmin via * or admin role', () => {
    assert.equal(isAdmin(user(['*'])), true);
    assert.equal(isAdmin(user([], ['admin'])), true);
    assert.equal(isAdmin(user(['companies:view'])), false);
  });

  it('canAny matches any', () => {
    assert.equal(canAny(user(['orders:edit']), ['orders:view', 'orders:edit']), true);
    assert.equal(canAny(user(['orders:view']), ['orders:edit']), false);
  });
});
