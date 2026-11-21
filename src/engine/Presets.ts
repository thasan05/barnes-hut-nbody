import { Body } from '../core/Body';
import { Vector2D } from '../core/Vector2D';

export interface PresetInfo {
  id: string;
  name: string;
  description: string;
  recommendedDt: number;
  recommendedTheta: number;
  recommendedG: number;
  recommendedEpsilon: number;
  create: () => Body[];
}

export const PRESETS: Record<string, PresetInfo> = {
  galaxyCollision: {
    id: 'galaxyCollision',
    name: 'Galactic Collision',
    description: 'Two disk galaxies on an eccentric collision course, forming tidal bridges and tails.',
    recommendedDt: 0.2,
    recommendedTheta: 0.6,
    recommendedG: 1.0,
    recommendedEpsilon: 5.0,
    create: () => {
      const bodies: Body[] = [];
      const G = 1.0;

      // Galaxy 1 (Spiral A)
      const core1Mass = 2500;
      const core1Pos = new Vector2D(-220, -100);
      const core1Vel = new Vector2D(0.55, 0.22);
      bodies.push(
        new Body({
          pos: core1Pos,
          vel: core1Vel,
          mass: core1Mass,
          radius: 6.5,
          color: '#fbbf24' // Gold core
        })
      );

      const numStars1 = 450;
      for (let i = 0; i < numStars1; i++) {
        const r = 25 + Math.random() * 160;
        const theta = Math.random() * Math.PI * 2;
        const vMag = Math.sqrt((G * core1Mass) / r);

        // Circular orbit with small random dispersion
        const pos = new Vector2D(
          core1Pos.x + r * Math.cos(theta),
          core1Pos.y + r * Math.sin(theta)
        );
        const vel = new Vector2D(
          core1Vel.x - vMag * Math.sin(theta) + (Math.random() - 0.5) * 0.1,
          core1Vel.y + vMag * Math.cos(theta) + (Math.random() - 0.5) * 0.1
        );

        // Color based on distance from core
        const color = r < 70 ? '#93c5fd' : '#c4b5fd';
        bodies.push(
          new Body({
            pos,
            vel,
            mass: 0.2,
            radius: 1.6,
            color
          })
        );
      }

      // Galaxy 2 (Spiral B - retrograde angle)
      const core2Mass = 1800;
      const core2Pos = new Vector2D(220, 100);
      const core2Vel = new Vector2D(-0.55, -0.22);
      bodies.push(
        new Body({
          pos: core2Pos,
          vel: core2Vel,
          mass: core2Mass,
          radius: 5.5,
          color: '#f87171' // Crimson core
        })
      );

      const numStars2 = 350;
      for (let i = 0; i < numStars2; i++) {
        const r = 20 + Math.random() * 130;
        const theta = Math.random() * Math.PI * 2;
        const vMag = Math.sqrt((G * core2Mass) / r);

        const pos = new Vector2D(
          core2Pos.x + r * Math.cos(theta),
          core2Pos.y + r * Math.sin(theta)
        );
        // Tilted orbit inclination
        const vel = new Vector2D(
          core2Vel.x + vMag * Math.sin(theta) * 0.9,
          core2Vel.y - vMag * Math.cos(theta) * 0.9
        );

        const color = r < 55 ? '#fca5a5' : '#fdba74';
        bodies.push(
          new Body({
            pos,
            vel,
            mass: 0.2,
            radius: 1.5,
            color
          })
        );
      }

      return bodies;
    }
  },

  figureEight: {
    id: 'figureEight',
    name: 'Figure-Eight 3-Body Choreography',
    description: 'Exact analytical periodic orbit discovered by Chenciner & Montgomery (2000).',
    recommendedDt: 0.005,
    recommendedTheta: 0.0, // Exact O(N^2)
    recommendedG: 100.0,
    recommendedEpsilon: 0.001,
    create: () => {
      // In canonical dimensionless units: G=1, m=1.
      // Scaling: scale distance by S, time by T -> G' = G * S^3 / (M * T^2)
      const scale = 180;
      const vScale = Math.sqrt(100.0 * 1.0 / scale) * scale; // v ~ r / t

      const x1 = -0.97000436 * scale;
      const y1 = 0.24308753 * scale;
      const vx1 = 0.46620531 * (vScale / scale);
      const vy1 = 0.43236573 * (vScale / scale);

      const x2 = -x1;
      const y2 = -y1;
      const vx2 = vx1;
      const vy2 = vy1;

      const x3 = 0;
      const y3 = 0;
      const vx3 = -2 * vx1;
      const vy3 = -2 * vy1;

      const mass = 1.0;

      return [
        new Body({
          pos: new Vector2D(x1, y1),
          vel: new Vector2D(vx1, vy1),
          mass,
          radius: 5,
          color: '#38bdf8'
        }),
        new Body({
          pos: new Vector2D(x2, y2),
          vel: new Vector2D(vx2, vy2),
          mass,
          radius: 5,
          color: '#f43f5e'
        }),
        new Body({
          pos: new Vector2D(x3, y3),
          vel: new Vector2D(vx3, vy3),
          mass,
          radius: 5,
          color: '#a855f7'
        })
      ];
    }
  },

  plummerSphere: {
    id: 'plummerSphere',
    name: 'Plummer Globular Cluster',
    description: 'Self-gravitating astrophysical cluster in virial hydrostatic equilibrium.',
    recommendedDt: 0.15,
    recommendedTheta: 0.5,
    recommendedG: 1.0,
    recommendedEpsilon: 4.0,
    create: () => {
      const bodies: Body[] = [];
      const N = 800;
      const G = 1.0;
      const a = 120; // Scale radius
      const totalClusterMass = 1200;
      const m = totalClusterMass / N;

      for (let i = 0; i < N; i++) {
        // Plummer radius sampling: r = a / sqrt(u^(-2/3) - 1)
        const u = Math.max(1e-4, Math.random());
        const r = a / Math.sqrt(Math.pow(u, -2 / 3) - 1);
        const theta = Math.random() * Math.PI * 2;

        const x = r * Math.cos(theta);
        const y = r * Math.sin(theta);

        // Escape velocity v_esc = sqrt(2 G M / sqrt(r^2 + a^2))
        const vEsc = Math.sqrt((2 * G * totalClusterMass) / Math.sqrt(r * r + a * a));

        // Sample velocity magnitude from isotropic distribution (von Neumann rejection)
        let v = 0;
        let q = 0;
        do {
          q = Math.random();
          const g = q * q * Math.pow(1 - q * q, 3.5);
          if (Math.random() < g / 0.1) {
            v = q * vEsc * 0.8;
            break;
          }
        } while (true);

        const vTheta = Math.random() * Math.PI * 2;
        const vx = v * Math.cos(vTheta);
        const vy = v * Math.sin(vTheta);

        const colRatio = Math.min(1, r / (a * 2));
        const color = colRatio < 0.3 ? '#fef08a' : colRatio < 0.7 ? '#67e8f9' : '#818cf8';

        bodies.push(
          new Body({
            pos: new Vector2D(x, y),
            vel: new Vector2D(vx, vy),
            mass: m,
            radius: 1.8,
            color
          })
        );
      }
      return bodies;
    }
  },

  trojanAsteroids: {
    id: 'trojanAsteroids',
    name: 'Lagrange Points & Trojans',
    description: 'Central star with orbiting gas giant and stable Trojan swarms at L4 and L5.',
    recommendedDt: 0.08,
    recommendedTheta: 0.5,
    recommendedG: 1.0,
    recommendedEpsilon: 3.0,
    create: () => {
      const bodies: Body[] = [];
      const G = 1.0;

      // Sun
      const sunMass = 4000;
      bodies.push(
        new Body({
          pos: new Vector2D(0, 0),
          vel: new Vector2D(0, 0),
          mass: sunMass,
          radius: 9,
          color: '#facc15',
          isFixed: true
        })
      );

      // Gas Giant
      const jupR = 240;
      const jupMass = 60;
      const jupV = Math.sqrt((G * sunMass) / jupR);
      bodies.push(
        new Body({
          pos: new Vector2D(jupR, 0),
          vel: new Vector2D(0, jupV),
          mass: jupMass,
          radius: 5,
          color: '#fb923c'
        })
      );

      // Inner terrestrial planet
      const innerR = 110;
      const innerV = Math.sqrt((G * sunMass) / innerR);
      bodies.push(
        new Body({
          pos: new Vector2D(0, innerR),
          vel: new Vector2D(-innerV, 0),
          mass: 2.0,
          radius: 3,
          color: '#38bdf8'
        })
      );

      // L4 Trojans (+60 deg) and L5 Trojans (-60 deg)
      const numTrojans = 150;
      for (let i = 0; i < numTrojans; i++) {
        const isL4 = i % 2 === 0;
        const baseAngle = isL4 ? Math.PI / 3 : -Math.PI / 3;
        const angle = baseAngle + (Math.random() - 0.5) * 0.28;
        const r = jupR + (Math.random() - 0.5) * 24;

        const pos = new Vector2D(r * Math.cos(angle), r * Math.sin(angle));
        const vMag = Math.sqrt((G * sunMass) / r);
        const vel = new Vector2D(-vMag * Math.sin(angle), vMag * Math.cos(angle));

        bodies.push(
          new Body({
            pos,
            vel,
            mass: 0.01,
            radius: 1.4,
            color: isL4 ? '#34d399' : '#a78bfa'
          })
        );
      }

      return bodies;
    }
  }
};
