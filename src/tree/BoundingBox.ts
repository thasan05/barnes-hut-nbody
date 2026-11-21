import { Vector2D } from '../core/Vector2D';
import { Body } from '../core/Body';

export class BoundingBox {
  constructor(
    public readonly x: number,
    public readonly y: number,
    public readonly halfSize: number
  ) {}

  get size(): number {
    return this.halfSize * 2;
  }

  get minX(): number {
    return this.x - this.halfSize;
  }

  get maxX(): number {
    return this.x + this.halfSize;
  }

  get minY(): number {
    return this.y - this.halfSize;
  }

  get maxY(): number {
    return this.y + this.halfSize;
  }

  contains(pos: Vector2D): boolean {
    return (
      pos.x >= this.minX &&
      pos.x <= this.maxX &&
      pos.y >= this.minY &&
      pos.y <= this.maxY
    );
  }

  subdivide(): [BoundingBox, BoundingBox, BoundingBox, BoundingBox] {
    const q = this.halfSize * 0.5;
    return [
      new BoundingBox(this.x - q, this.y - q, q), // NW
      new BoundingBox(this.x + q, this.y - q, q), // NE
      new BoundingBox(this.x - q, this.y + q, q), // SW
      new BoundingBox(this.x + q, this.y + q, q)  // SE
    ];
  }

  static enclosing(bodies: Body[]): BoundingBox {
    if (bodies.length === 0) {
      return new BoundingBox(0, 0, 100);
    }

    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;

    for (let i = 0; i < bodies.length; i++) {
      const p = bodies[i].pos;
      if (p.x < minX) minX = p.x;
      if (p.x > maxX) maxX = p.x;
      if (p.y < minY) minY = p.y;
      if (p.y > maxY) maxY = p.y;
    }

    const centerX = (minX + maxX) * 0.5;
    const centerY = (minY + maxY) * 0.5;
    const halfWidth = (maxX - minX) * 0.5;
    const halfHeight = (maxY - minY) * 0.5;
    // Add small margin to prevent edge particles from falling outside rounding
    const maxHalf = Math.max(halfWidth, halfHeight, 10) * 1.05;

    return new BoundingBox(centerX, centerY, maxHalf);
  }
}
