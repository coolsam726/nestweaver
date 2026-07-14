import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { resolveGridItemStyle } from '../src/core/layout.js';

describe('resolveGridItemStyle', () => {
  it('uses full-row span for columnSpan full', () => {
    assert.equal(resolveGridItemStyle({ columnSpan: 'full' }, 2), 'grid-column: 1 / -1');
    assert.equal(resolveGridItemStyle({ columnSpan: 'full' }, 4), 'grid-column: 1 / -1');
  });

  it('defaults non-numeric section columns to 2', () => {
    assert.equal(
      resolveGridItemStyle({ columnSpan: 1 }, true as unknown as number),
      'grid-column: span 1',
    );
    assert.equal(resolveGridItemStyle({ columnSpan: 1 }, undefined), 'grid-column: span 1');
  });

  it('respects numeric spans within the section', () => {
    assert.equal(resolveGridItemStyle({ columnSpan: 2 }, 2), 'grid-column: span 2');
    assert.equal(resolveGridItemStyle({}, 2), 'grid-column: span 1');
  });
});
