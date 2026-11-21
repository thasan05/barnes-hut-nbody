import { describe, it, expect } from 'vitest';
import { Body } from '../src/core/Body';
import { Vector2D } from '../src/core/Vector2D';
import { LeapfrogIntegrator } from '../src/core/Integrator';
import { MetricsTracker } from '../src/core/Metrics';

describe('Symplectic Leapfrog Integrator & Conservation Laws', () => {
  it('conserves energy and angular momentum in a 2-body Kepler orbit', () => {
    const G = 1.0;
    const centralMass = 1000;
    const orbitingMass = 1.0;
    const r0 = 100;
    const vCircular = Math.sqrt((G * centralMass) / r0);

    const sun = new Body({
      pos: new Vector2D(0, 0),
      vel: new Vector2D(0, 0),
      mass: centralMass,
      isFixed: true
    });

    const planet = new Body({
      pos: new Vector2D(r0, 0),
      vel: new Vector2D(0, vCircular),
      mass: orbitingMass
    });

    const bodies = [sun, planet];
    const integrator = new LeapfrogIntegrator();
    const metricsTracker = new MetricsTracker();

    const dt = 0.05;
    const steps = 1200; // Over one complete orbital period (T = 2 pi sqrt(r^3/GM) ~ 62.83s, 62.83/0.05 ~ 1256 steps)

    for (let s = 0; s < steps; s++) {
      integrator.step(bodies, dt, G, 0.0, 0.0, false);
      metricsTracker.compute(bodies, G, 0.0);
    }

    const finalMetrics = metricsTracker.compute(bodies, G, 0.0);

    // Hamiltonian relative energy drift must stay strictly bounded (< 0.1% for circular orbit)
    expect(Math.abs(finalMetrics.relativeEnergyDrift)).toBeLessThan(0.001);

    // Planet should have completed its orbit and returned within 1% of initial radius
    const finalRadius = planet.pos.dist(sun.pos);
    expect(Math.abs(finalRadius - r0) / r0).toBeLessThan(0.01);
  });

  it('demonstrates time-reversibility of the Leapfrog scheme', () => {
    const G = 1.0;
    const b1 = new Body({ pos: new Vector2D(-20, 10), vel: new Vector2D(0.2, 0.5), mass: 10 });
    const b2 = new Body({ pos: new Vector2D(30, -15), vel: new Vector2D(-0.3, -0.1), mass: 15 });
    const bodies = [b1, b2];

    const initialPos1 = b1.pos.clone();
    const initialPos2 = b2.pos.clone();

    const integrator = new LeapfrogIntegrator();
    const dt = 0.1;
    const steps = 100;

    // Forward integration
    for (let i = 0; i < steps; i++) {
      integrator.step(bodies, dt, G, 0.0, 0.01, false);
    }

    // Invert velocities
    b1.vel.multiplyScalar(-1);
    b2.vel.multiplyScalar(-1);
    integrator.reset();

    // Backward integration
    for (let i = 0; i < steps; i++) {
      integrator.step(bodies, dt, G, 0.0, 0.01, false);
    }

    // Reversible trajectory returns to origin to high precision
    expect(b1.pos.dist(initialPos1)).toBeLessThan(1e-4);
    expect(b2.pos.dist(initialPos2)).toBeLessThan(1e-4);
  });
});
