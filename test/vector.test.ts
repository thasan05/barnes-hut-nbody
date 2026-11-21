import { describe, it, expect } from 'vitest';
import { Vector2D } from '../src/core/Vector2D';

describe('Vector2D Math Library', () => {
  it('initializes with default and explicit coordinates', () => {
    const v0 = new Vector2D();
    expect(v0.x).toBe(0);
    expect(v0.y).toBe(0);

    const v1 = new Vector2D(3, -4);
    expect(v1.x).toBe(3);
    expect(v1.y).toBe(-4);
  });

  it('performs vector addition and subtraction correctly', () => {
    const a = new Vector2D(10, 5);
    const b = new Vector2D(-3, 8);

    const sum = a.add(b);
    expect(sum.x).toBe(7);
    expect(sum.y).toBe(13);

    const diff = a.sub(b);
    expect(diff.x).toBe(13);
    expect(diff.y).toBe(-3);
  });

  it('scales vectors and calculates magnitude', () => {
    const v = new Vector2D(3, 4);
    expect(v.magSq()).toBe(25);
    expect(v.mag()).toBe(5);

    const scaled = v.scale(2);
    expect(scaled.x).toBe(6);
    expect(scaled.y).toBe(8);
    expect(scaled.mag()).toBe(10);
  });

  it('normalizes non-zero vectors to unit length', () => {
    const v = new Vector2D(0, 5);
    v.normalize();
    expect(v.x).toBe(0);
    expect(v.y).toBe(1);
    expect(v.mag()).toBeCloseTo(1.0, 10);
  });

  it('computes dot and 2D cross product', () => {
    const u = new Vector2D(1, 0);
    const v = new Vector2D(0, 1);
    expect(u.dot(v)).toBe(0); // Orthogonal
    expect(u.cross(v)).toBe(1); // Right-hand rule positive z

    const parallel = new Vector2D(2, 0);
    expect(u.dot(parallel)).toBe(2);
    expect(u.cross(parallel)).toBe(0);
  });

  it('computes Euclidean distances accurately', () => {
    const p1 = new Vector2D(1, 1);
    const p2 = new Vector2D(4, 5);
    expect(p1.distSq(p2)).toBe(25);
    expect(p1.dist(p2)).toBe(5);
  });
});
