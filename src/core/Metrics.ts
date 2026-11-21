import { Body } from './Body';
import { Vector2D } from './Vector2D';

export interface SystemMetrics {
  kineticEnergy: number;
  potentialEnergy: number;
  totalEnergy: number;
  angularMomentum: number;
  centerOfMass: Vector2D;
  centerOfMassVel: Vector2D;
  totalMass: number;
  relativeEnergyDrift: number;
}

export class MetricsTracker {
  private initialEnergy: number | null = null;

  reset(): void {
    this.initialEnergy = null;
  }

  compute(bodies: Body[], G: number, epsilon: number): SystemMetrics {
    const n = bodies.length;
    let kineticEnergy = 0;
    let potentialEnergy = 0;
    let angularMomentum = 0;
    let totalMass = 0;
    let comX = 0;
    let comY = 0;
    let comVx = 0;
    let comVy = 0;

    const epsSq = epsilon * epsilon;

    for (let i = 0; i < n; i++) {
      const b = bodies[i];
      const m = b.mass;
      totalMass += m;
      comX += b.pos.x * m;
      comY += b.pos.y * m;
      comVx += b.vel.x * m;
      comVy += b.vel.y * m;

      // T = 1/2 m v^2
      const vSq = b.vel.magSq();
      kineticEnergy += 0.5 * m * vSq;

      // L = m (x vy - y vx)
      angularMomentum += m * (b.pos.x * b.vel.y - b.pos.y * b.vel.x);

      // Potential energy pairwise: - G m_i m_j / sqrt(r^2 + eps^2)
      for (let j = i + 1; j < n; j++) {
        const bj = bodies[j];
        const dx = bj.pos.x - b.pos.x;
        const dy = bj.pos.y - b.pos.y;
        const dist = Math.sqrt(dx * dx + dy * dy + epsSq);
        potentialEnergy -= (G * m * bj.mass) / dist;
      }
    }

    const totalEnergy = kineticEnergy + potentialEnergy;

    if (this.initialEnergy === null && Math.abs(totalEnergy) > 1e-12) {
      this.initialEnergy = totalEnergy;
    }

    const relativeEnergyDrift =
      this.initialEnergy !== null && Math.abs(this.initialEnergy) > 1e-12
        ? (totalEnergy - this.initialEnergy) / Math.abs(this.initialEnergy)
        : 0;

    const com = totalMass > 0 ? new Vector2D(comX / totalMass, comY / totalMass) : new Vector2D();
    const comVel = totalMass > 0 ? new Vector2D(comVx / totalMass, comVy / totalMass) : new Vector2D();

    return {
      kineticEnergy,
      potentialEnergy,
      totalEnergy,
      angularMomentum,
      centerOfMass: com,
      centerOfMassVel: comVel,
      totalMass,
      relativeEnergyDrift
    };
  }
}
