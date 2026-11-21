export class Vector2D {
  constructor(public x: number = 0, public y: number = 0) {}

  clone(): Vector2D {
    return new Vector2D(this.x, this.y);
  }

  set(x: number, y: number): this {
    this.x = x;
    this.y = y;
    return this;
  }

  copy(v: Vector2D): this {
    this.x = v.x;
    this.y = v.y;
    return this;
  }

  add(v: Vector2D): Vector2D {
    return new Vector2D(this.x + v.x, this.y + v.y);
  }

  addMut(v: Vector2D): this {
    this.x += v.x;
    this.y += v.y;
    return this;
  }

  addScaled(v: Vector2D, s: number): this {
    this.x += v.x * s;
    this.y += v.y * s;
    return this;
  }

  sub(v: Vector2D): Vector2D {
    return new Vector2D(this.x - v.x, this.y - v.y);
  }

  subMut(v: Vector2D): this {
    this.x -= v.x;
    this.y -= v.y;
    return this;
  }

  scale(s: number): Vector2D {
    return new Vector2D(this.x * s, this.y * s);
  }

  multiplyScalar(s: number): this {
    this.x *= s;
    this.y *= s;
    return this;
  }

  magSq(): number {
    return this.x * this.x + this.y * this.y;
  }

  mag(): number {
    return Math.hypot(this.x, this.y);
  }

  distSq(v: Vector2D): number {
    const dx = this.x - v.x;
    const dy = this.y - v.y;
    return dx * dx + dy * dy;
  }

  dist(v: Vector2D): number {
    return Math.hypot(this.x - v.x, this.y - v.y);
  }

  normalize(): this {
    const m = this.mag();
    if (m > 1e-12) {
      this.x /= m;
      this.y /= m;
    }
    return this;
  }

  dot(v: Vector2D): number {
    return this.x * v.x + this.y * v.y;
  }

  cross(v: Vector2D): number {
    return this.x * v.y - this.y * v.x;
  }

  zero(): this {
    this.x = 0;
    this.y = 0;
    return this;
  }
}
