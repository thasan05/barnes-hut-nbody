import { Vector2D } from './Vector2D';

export interface BodyOptions {
  id?: number;
  pos: Vector2D;
  vel?: Vector2D;
  mass: number;
  radius?: number;
  color?: string;
  isFixed?: boolean;
}

export class Body {
  public id: number;
  public pos: Vector2D;
  public vel: Vector2D;
  public acc: Vector2D;
  public mass: number;
  public radius: number;
  public color: string;
  public isFixed: boolean;
  public trail: Vector2D[] = [];
  public maxTrailLength: number = 24;

  private static idCounter = 0;

  constructor(opts: BodyOptions) {
    this.id = opts.id ?? ++Body.idCounter;
    this.pos = opts.pos.clone();
    this.vel = (opts.vel ?? new Vector2D()).clone();
    this.acc = new Vector2D();
    this.mass = opts.mass;
    this.radius = opts.radius ?? Math.max(1.8, Math.min(12, Math.cbrt(this.mass) * 1.1));
    this.color = opts.color ?? '#60a5fa';
    this.isFixed = opts.isFixed ?? false;
  }

  recordTrail(): void {
    if (this.trail.length >= this.maxTrailLength) {
      this.trail.shift();
    }
    this.trail.push(this.pos.clone());
  }

  clearTrail(): void {
    this.trail = [];
  }

  clone(): Body {
    const b = new Body({
      id: this.id,
      pos: this.pos,
      vel: this.vel,
      mass: this.mass,
      radius: this.radius,
      color: this.color,
      isFixed: this.isFixed
    });
    b.acc = this.acc.clone();
    return b;
  }
}
