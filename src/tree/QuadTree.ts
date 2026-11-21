import { Vector2D } from '../core/Vector2D';
import { Body } from '../core/Body';
import { BoundingBox } from './BoundingBox';

export class QuadTree {
  public bounds: BoundingBox;
  public body: Body | null = null;
  public mass: number = 0;
  public centerOfMass: Vector2D = new Vector2D();
  public children: [QuadTree, QuadTree, QuadTree, QuadTree] | null = null;
  public depth: number;

  private static readonly MAX_DEPTH = 32;

  constructor(bounds: BoundingBox, depth: number = 0) {
    this.bounds = bounds;
    this.depth = depth;
  }

  get isLeaf(): boolean {
    return this.children === null;
  }

  insert(body: Body): boolean {
    if (!this.bounds.contains(body.pos)) {
      return false;
    }

    // 1. If currently empty leaf node, store body here
    if (this.mass === 0 && this.isLeaf) {
      this.body = body;
      this.mass = body.mass;
      this.centerOfMass.copy(body.pos);
      return true;
    }

    // 2. If already an internal node, update center of mass and push downward
    if (!this.isLeaf) {
      this.updateMassDistribution(body);
      return this.insertIntoChild(body);
    }

    // 3. Leaf node that already contains an existing body -> subdivide
    const existingBody = this.body;
    if (existingBody) {
      // Handle coincident or ultra-close bodies to avoid infinite recursion
      if (this.depth >= QuadTree.MAX_DEPTH || existingBody.pos.distSq(body.pos) < 1e-10) {
        // Coalesce mass into this node
        this.updateMassDistribution(body);
        return true;
      }

      this.subdivide();
      this.body = null;

      // Re-insert existing body into appropriate child
      this.insertIntoChild(existingBody);

      // Now insert the new body
      this.updateMassDistribution(body);
      return this.insertIntoChild(body);
    }

    return false;
  }

  private subdivide(): void {
    const subBoxes = this.bounds.subdivide();
    this.children = [
      new QuadTree(subBoxes[0], this.depth + 1), // NW
      new QuadTree(subBoxes[1], this.depth + 1), // NE
      new QuadTree(subBoxes[2], this.depth + 1), // SW
      new QuadTree(subBoxes[3], this.depth + 1)  // SE
    ];
  }

  private updateMassDistribution(body: Body): void {
    const newMass = this.mass + body.mass;
    if (newMass > 0) {
      this.centerOfMass.x = (this.centerOfMass.x * this.mass + body.pos.x * body.mass) / newMass;
      this.centerOfMass.y = (this.centerOfMass.y * this.mass + body.pos.y * body.mass) / newMass;
    }
    this.mass = newMass;
  }

  private insertIntoChild(body: Body): boolean {
    if (!this.children) return false;

    for (let i = 0; i < 4; i++) {
      if (this.children[i].bounds.contains(body.pos)) {
        return this.children[i].insert(body);
      }
    }

    // If rounding edge case placed it right on border, push into nearest child
    let nearestIdx = 0;
    let minDist = Infinity;
    for (let i = 0; i < 4; i++) {
      const child = this.children[i];
      const dx = body.pos.x - child.bounds.x;
      const dy = body.pos.y - child.bounds.y;
      const d = dx * dx + dy * dy;
      if (d < minDist) {
        minDist = d;
        nearestIdx = i;
      }
    }
    return this.children[nearestIdx].insert(body);
  }

  /**
   * Barnes-Hut multipole acceptance force computation:
   * s / d < theta -> approximate as single point mass
   */
  computeForce(target: Body, G: number, theta: number, epsilonSq: number, forceAcc: Vector2D): void {
    if (this.mass === 0) return;

    const dx = this.centerOfMass.x - target.pos.x;
    const dy = this.centerOfMass.y - target.pos.y;
    const distSq = dx * dx + dy * dy;

    // Case 1: Leaf node containing a single body
    if (this.isLeaf) {
      if (this.body && this.body.id !== target.id) {
        const effDistSq = distSq + epsilonSq;
        const dist = Math.sqrt(effDistSq);
        const f = (G * target.mass * this.mass) / (effDistSq * dist);
        forceAcc.x += dx * f;
        forceAcc.y += dy * f;
      }
      return;
    }

    // Case 2: Internal node -> evaluate Barnes-Hut criterion s / d < theta
    const s = this.bounds.size;
    const d = Math.sqrt(distSq);

    if (d > 0 && s / d < theta) {
      // Multipole approximation accepted!
      const effDistSq = distSq + epsilonSq;
      const effDist = Math.sqrt(effDistSq);
      const f = (G * target.mass * this.mass) / (effDistSq * effDist);
      forceAcc.x += dx * f;
      forceAcc.y += dy * f;
    } else {
      // Multipole approximation rejected -> recurse into 4 children
      if (this.children) {
        for (let i = 0; i < 4; i++) {
          this.children[i].computeForce(target, G, theta, epsilonSq, forceAcc);
        }
      }
    }
  }

  /**
   * Collect all bounding boxes for visualization overlay
   */
  collectBoxes(boxes: { x: number; y: number; size: number; depth: number }[]): void {
    if (this.mass > 0) {
      boxes.push({
        x: this.bounds.minX,
        y: this.bounds.minY,
        size: this.bounds.size,
        depth: this.depth
      });
      if (this.children) {
        for (let i = 0; i < 4; i++) {
          this.children[i].collectBoxes(boxes);
        }
      }
    }
  }
}
