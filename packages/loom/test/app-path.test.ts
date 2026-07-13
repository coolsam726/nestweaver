import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  defaultAdminBasePath,
  defaultCookiePath,
  joinAppPath,
  nestControllerPath,
  normalizeAppBasePath,
} from '../src/core/app-path.js';

describe('app-path helpers', () => {
  it('normalizes app base path', () => {
    assert.equal(normalizeAppBasePath(undefined), '');
    assert.equal(normalizeAppBasePath('/'), '');
    assert.equal(normalizeAppBasePath('my-app'), '/my-app');
    assert.equal(normalizeAppBasePath('/my-app/'), '/my-app');
    assert.equal(normalizeAppBasePath('//my-app//'), '/my-app');
  });

  it('joins paths under app base', () => {
    assert.equal(joinAppPath('', 'login'), '/login');
    assert.equal(joinAppPath('/my-app', 'login'), '/my-app/login');
    assert.equal(joinAppPath('/my-app', 'admin'), '/my-app/admin');
    assert.equal(joinAppPath('/my-app', 'api/loom', 'v1'), '/my-app/api/loom/v1');
    assert.equal(joinAppPath('/my-app'), '/my-app');
    assert.equal(joinAppPath(''), '/');
  });

  it('defaults admin and cookie paths', () => {
    assert.equal(defaultAdminBasePath(''), '/admin');
    assert.equal(defaultAdminBasePath('/my-app'), '/my-app/admin');
    assert.equal(defaultCookiePath(''), '/');
    assert.equal(defaultCookiePath('/my-app'), '/my-app');
  });

  it('maps to Nest controller paths', () => {
    assert.equal(nestControllerPath('/'), '');
    assert.equal(nestControllerPath('/admin'), 'admin');
    assert.equal(nestControllerPath('/my-app/admin'), 'my-app/admin');
  });
});
