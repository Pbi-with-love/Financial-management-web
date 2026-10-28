import { describe, expect, it } from 'vitest';
import { formatCents } from '../format';

describe('formatCents', () => {
  it('converts 3000 cents to €30.00', () => {
    expect(formatCents(3000)).toBe('€30.00');
  });

  it('converts 0 cents to €0.00', () => {
    expect(formatCents(0)).toBe('€0.00');
  });

  it('converts -1500 cents to -€15.00', () => {
    expect(formatCents(-1500)).toBe('-€15.00');
  });

  it('converts 1 cent to €0.01', () => {
    expect(formatCents(1)).toBe('€0.01');
  });

  it('converts 100 cents to €1.00', () => {
    expect(formatCents(100)).toBe('€1.00');
  });

  it('handles large values', () => {
    expect(formatCents(100000)).toBe('€1000.00');
  });

  it('handles -1 cent', () => {
    expect(formatCents(-1)).toBe('-€0.01');
  });

  it('pads single-digit cents correctly', () => {
    expect(formatCents(109)).toBe('€1.09');
  });
});
