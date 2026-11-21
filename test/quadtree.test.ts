import { describe, it, expect } from 'vitest';
import { Body } from '../src/core/Body';
import { Vector2D } from '../src/core/Vector2D';
import { BoundingBox } from '../src/tree/BoundingBox';
import { QuadTree } from '../src/tree/QuadTree';

describe('Barnes-Hut QuadTree Decomposition', () => {
  it('correctly creates enclosing bounding box for particles', () => {
    const bodies = [
      new Body({ pos: new Vector2D(-50, -20), mass: 1 }),
      new Body({ pos: new Vector2D(30, 40), mass: 2 }),
      new Body({ pos: new Vector2D(10, -80), mass: 3 })
    ];

    const box = BoundingBox.enclosing(bodies);
    expect(box.contains(bodies[0].pos)).toBe(true);
    expect(box.contains(bodies[1].pos)).toBe(true);
    expect(box.contains(bodies[2].pos)).toBe(true);
  });

  it('stores single body in root leaf node', () => {
    const box = new BoundingBox(0, 0, 100);
    const tree = new QuadTree(box);
    const body = new Body({ pos: new Vector2D(10, 20), mass: 5 });

    const inserted = tree.insert(body);
    expect(inserted).toBe(true);
    expect(tree.isLeaf).toBe(true);
    expect(tree.mass).toBe(5);
    expect(tree.centerOfMass.x).toBe(10);
    expect(tree.centerOfMass.y).toBe(20);
  });

  it('subdivides and preserves center of mass invariant across multiple bodies', () => {
    const box = new BoundingBox(0, 0, 200);
    const tree = new QuadTree(box);

    const b1 = new Body({ pos: new Vector2D(-50, -50), mass: 10 });
    const b2 = new Body({ pos: new Vector2D(50, 50), mass: 30 });

    tree.insert(b1);
    tree.insert(b2);

    expect(tree.isLeaf).toBe(false);
    expect(tree.children).not.toBeNull();
    expect(tree.mass).toBe(40);

    // Center of mass formula: (10*(-50) + 30*50)/40 = 1000/40 = 25
    expect(tree.centerOfMass.x).toBeCloseTo(25, 6);
    expect(tree.centerOfMass.y).toBeCloseTo(25, 6);
  });

  it('handles arbitrary distribution of N particles with exact mass conservation', () => {
    const bodies: Body[] = [];
    let expectedTotalMass = 0;
    let expectedComX = 0;
    let expectedComY = 0;

    for (let i = 0; i < 50; i++) {
      const mass = 1 + i * 0.5;
      const x = (Math.sin(i) * 80);
      const y = (Math.cos(i) * 80);
      bodies.push(new Body({ pos: new Vector2D(x, y), mass }));
      expectedTotalMass += mass;
      expectedComX += x * mass;
      expectedComY += y * mass;
    }

    const bounds = BoundingBox.enclosing(bodies);
    const tree = new QuadTree(bounds);

    for (const b of bodies) {
      tree.insert(b);
    }

    expect(tree.mass).toBeCloseTo(expectedTotalMass, 6);
    expect(tree.centerOfMass.x).toBeCloseTo(expectedComX / expectedTotalMass, 6);
    expect(tree.centerOfMass.y).toBeCloseTo(expectedComY / expectedTotalMass, 6);
  });
});
