import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { PATH_METADATA } from '@nestjs/common/constants';
import 'reflect-metadata';
import { LoomModule } from '../src/nest/loom.module.js';

describe('LoomModule.forRootAsync routing', () => {
  it('registers site auth at root and admin at sync basePath', () => {
    const mod = LoomModule.forRootAsync({
      basePath: '/app',
      api: { version: 'v1' },
      useFactory: () => ({
        resources: [],
        allowAnonymousAdmin: true,
        basePath: '/ignored-async-only',
      }),
    });

    const controllers = mod.controllers ?? [];
    assert.ok(controllers.length >= 3);

    const authPath = Reflect.getMetadata(PATH_METADATA, controllers[0]!);
    assert.ok(authPath === '/' || authPath === '' || authPath == null);

    const legacyPath = Reflect.getMetadata(PATH_METADATA, controllers[1]!);
    assert.equal(legacyPath, 'app');

    const adminPath = Reflect.getMetadata(PATH_METADATA, controllers[2]!);
    assert.equal(adminPath, 'app');

    const apiCtrl = controllers[3];
    assert.ok(apiCtrl);
    const apiPath = Reflect.getMetadata(PATH_METADATA, apiCtrl);
    assert.equal(apiPath, 'api/loom/v1');
  });

  it('defaults admin controller to admin when basePath omitted', () => {
    const mod = LoomModule.forRootAsync({
      useFactory: () => ({
        resources: [],
        allowAnonymousAdmin: true,
        basePath: '/app',
      }),
    });
    const controllers = mod.controllers ?? [];
    assert.ok(controllers.length >= 3);
    const authPath = Reflect.getMetadata(PATH_METADATA, controllers[0]!);
    assert.ok(authPath === '/' || authPath === '' || authPath == null);
    assert.equal(Reflect.getMetadata(PATH_METADATA, controllers[1]!), 'admin');
    assert.equal(Reflect.getMetadata(PATH_METADATA, controllers[2]!), 'admin');
  });

  it('prefixes auth, admin, and API under appBasePath', () => {
    const mod = LoomModule.forRootAsync({
      appBasePath: '/my-app',
      api: { version: 'v1' },
      useFactory: () => ({
        resources: [],
        allowAnonymousAdmin: true,
      }),
    });
    const controllers = mod.controllers ?? [];
    assert.equal(Reflect.getMetadata(PATH_METADATA, controllers[0]!), 'my-app');
    assert.equal(Reflect.getMetadata(PATH_METADATA, controllers[1]!), 'my-app/admin');
    assert.equal(Reflect.getMetadata(PATH_METADATA, controllers[2]!), 'my-app/admin');
    assert.equal(Reflect.getMetadata(PATH_METADATA, controllers[3]!), 'my-app/api/loom/v1');
  });
});
