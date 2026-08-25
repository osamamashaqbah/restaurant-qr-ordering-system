import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const migration = readFileSync(
  path.resolve('supabase/migrations/20260825170000_make_public_rating_atomic.sql'),
  'utf8',
);

describe('atomic public rating migration', () => {
  it('uses the unique order constraint instead of a check-then-insert race', () => {
    expect(migration).toContain('on conflict (order_id) do nothing;');
    expect(migration).toMatch(/on conflict \(order_id\) do nothing;\s+\n?\s*if not found then\s+\n?\s*return 'already_rated';/);
  });
});
