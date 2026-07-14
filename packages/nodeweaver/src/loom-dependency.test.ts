import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  resolveLoomDependency,
  vendorLoomPackage,
} from './generators/loom-dependency.js';

describe('resolveLoomDependency', () => {
  it('honors NODEWEAVER_LOOM_DEP without vendoring', () => {
    const prev = process.env.NODEWEAVER_LOOM_DEP;
    process.env.NODEWEAVER_LOOM_DEP = '^9.9.9';
    try {
      const resolved = resolveLoomDependency('/tmp/nodeweaver-dep-test');
      assert.equal(resolved.specifier, '^9.9.9');
      assert.equal(resolved.vendored, false);
    } finally {
      if (prev === undefined) delete process.env.NODEWEAVER_LOOM_DEP;
      else process.env.NODEWEAVER_LOOM_DEP = prev;
    }
  });

  it('vendors from the monorepo when packages/loom is available', () => {
    const prev = process.env.NODEWEAVER_LOOM_DEP;
    delete process.env.NODEWEAVER_LOOM_DEP;
    try {
      const resolved = resolveLoomDependency('/tmp/nodeweaver-vendor-probe');
      assert.equal(resolved.specifier, 'workspace:*');
      assert.equal(resolved.vendored, true);
      assert.equal(vendorLoomPackage('/tmp/nodeweaver-vendor-probe'), true);
    } finally {
      if (prev === undefined) delete process.env.NODEWEAVER_LOOM_DEP;
      else process.env.NODEWEAVER_LOOM_DEP = prev;
    }
  });
});
