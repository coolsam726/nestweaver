import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { erpResourceBases } from '../src/index.js';

describe('@nodeweaver/erp', () => {
  it('exports company-scoped resource bases', () => {
    const bases = erpResourceBases();
    assert.ok(bases.length >= 5);
    for (const ResourceClass of bases) {
      assert.equal(
        (ResourceClass as { companyScoped?: boolean }).companyScoped,
        true,
      );
    }
  });
});
