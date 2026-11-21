import { Body } from './Body';
import { Vector2D } from './Vector2D';
import { QuadTree } from '../tree/QuadTree';
import { BoundingBox } from '../tree/BoundingBox';

export type ForceEvaluator = (
  bodies: Body[],
  G: number,
  theta: number,
  epsilonSq: number,
  accels: Vector2D[]
) => void;

/**
 * Direct all-pairs summation force calculation: O(N^2)
 */
export function evaluateForcesDirect(
  bodies: Body[],
  G: number,
  _theta: number,
  epsilonSq: number,
  accels: Vector2D[]
): void {
  const n = bodies.length;
  for (let i = 0; i < n; i++) {
    accels[i].zero();
  }

  for (let i = 0; i < n; i++) {
    const bi = bodies[i];
    for (let j = i + 1; j < n; j++) {
      const bj = bodies[j];
      const dx = bj.pos.x - bi.pos.x;
      const dy = bj.pos.y - bi.pos.y;
      const distSq = dx * dx + dy * dy + epsilonSq;
      const dist = Math.sqrt(distSq);
      const invDistCube = 1 / (distSq * dist);

      // Force magnitude / (m_i * m_j) = G / (r^2 + eps^2)^(3/2)
      const fNorm = G * invDistCube;

      if (!bi.isFixed) {
        accels[i].x += dx * fNorm * bj.mass;
        accels[i].y += dy * fNorm * bj.mass;
      }
      if (!bj.isFixed) {
        accels[j].x -= dx * fNorm * bi.mass;
        accels[j].y -= dy * fNorm * bi.mass;
      }
    }
  }
}

/**
 * Barnes-Hut quadtree force calculation: O(N log N)
 */
export function evaluateForcesBarnesHut(
  bodies: Body[],
  G: number,
  theta: number,
  epsilonSq: number,
  accels: Vector2D[],
  onTreeBuilt?: (tree: QuadTree) => void
): void {
  const n = bodies.length;
  for (let i = 0; i < n; i++) {
    accels[i].zero();
  }

  if (n === 0) return;

  const bounds = BoundingBox.enclosing(bodies);
  const tree = new QuadTree(bounds);

  for (let i = 0; i < n; i++) {
    tree.insert(bodies[i]);
  }

  if (onTreeBuilt) {
    onTreeBuilt(tree);
  }

  const forceVec = new Vector2D();
  for (let i = 0; i < n; i++) {
    const b = bodies[i];
    if (b.isFixed) continue;

    forceVec.zero();
    tree.computeForce(b, G, theta, epsilonSq, forceVec);

    // a = F / m
    accels[i].x = forceVec.x / b.mass;
    accels[i].y = forceVec.y / b.mass;
  }
}

/**
 * Symplectic Leapfrog (Kick-Drift-Kick) integrator.
 * Preserves phase-space volume and exhibits bounded energy error with zero secular drift.
 */
export class LeapfrogIntegrator {
  private prevAccels: Vector2D[] = [];
  private isInitialized = false;

  reset(): void {
    this.prevAccels = [];
    this.isInitialized = false;
  }

  step(
    bodies: Body[],
    dt: number,
    G: number,
    theta: number,
    epsilon: number,
    useBarnesHut: boolean = true,
    onTreeBuilt?: (tree: QuadTree) => void
  ): void {
    const n = bodies.length;
    if (n === 0) return;

    if (this.prevAccels.length !== n) {
      this.prevAccels = Array.from({ length: n }, () => new Vector2D());
      this.isInitialized = false;
    }

    const epsSq = epsilon * epsilon;

    // 1. Initial acceleration if starting fresh
    if (!this.isInitialized) {
      if (useBarnesHut) {
        evaluateForcesBarnesHut(bodies, G, theta, epsSq, this.prevAccels, onTreeBuilt);
      } else {
        evaluateForcesDirect(bodies, G, theta, epsSq, this.prevAccels);
      }
      for (let i = 0; i < n; i++) {
        bodies[i].acc.copy(this.prevAccels[i]);
      }
      this.isInitialized = true;
    }

    const halfDt = 0.5 * dt;

    // 2. Kick step: v^(n+1/2) = v^n + 0.5 * dt * a^n
    for (let i = 0; i < n; i++) {
      const b = bodies[i];
      if (b.isFixed) continue;
      b.vel.x += this.prevAccels[i].x * halfDt;
      b.vel.y += this.prevAccels[i].y * halfDt;
    }

    // 3. Drift step: r^(n+1) = r^n + dt * v^(n+1/2)
    for (let i = 0; i < n; i++) {
      const b = bodies[i];
      if (b.isFixed) continue;
      b.pos.x += b.vel.x * dt;
      b.pos.y += b.vel.y * dt;
    }

    // 4. Force evaluation at new positions: a^(n+1)
    const newAccels = Array.from({ length: n }, () => new Vector2D());
    if (useBarnesHut) {
      evaluateForcesBarnesHut(bodies, G, theta, epsSq, newAccels, onTreeBuilt);
    } else {
      evaluateForcesDirect(bodies, G, theta, epsSq, newAccels);
    }

    // 5. Kick step finish: v^(n+1) = v^(n+1/2) + 0.5 * dt * a^(n+1)
    for (let i = 0; i < n; i++) {
      const b = bodies[i];
      if (b.isFixed) continue;
      b.vel.x += newAccels[i].x * halfDt;
      b.vel.y += newAccels[i].y * halfDt;
      b.acc.copy(newAccels[i]);
      this.prevAccels[i].copy(newAccels[i]);
    }
  }
}
