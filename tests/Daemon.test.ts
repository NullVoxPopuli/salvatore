import { describe, expect, test } from 'vitest';
import { Daemon } from '../src/damon.js';

describe('Daemon', () => {
  test('it exists', () => {
    expect(Daemon).toBeTruthy();
    expect(typeof Daemon).toBe('function');
  });
});
