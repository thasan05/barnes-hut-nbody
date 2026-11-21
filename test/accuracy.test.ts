import { describe, it, expect } from 'vitest';
import { Body } from '../src/core/Body';
import { Vector2D } from '../src/core/Vector2D';
import { evaluateForcesDirect, evaluateForcesBarnesHut } from '../src/core/Integrator';

describe('Barnes-Hut Accuracy vs Direct Summation', () => {
  function generateTestCluster(n: number): Body[] {
    const bodies: Body[] = [];
    for (let i = 0; i < n; i++) {
      const angle = (i / n) * Math.PI * 2;
      const r = 20 + ((i * 17) % 150);
      bodies.push(
        new Body({
          id: i + 1,
          pos: new Vector2D(r * Math.cos(angle), r * Math.sin(angle)),
          vel: new Vector2D(),
          mass: 1.0 + (i % 5) * 0.5
        })
      );
    }
    return bodies;
  }

  it('matches exact direct summation identically when theta = 0', () => {
    const bodies = generateTestCluster(60);
    const G = 1.0;
    const epsSq = 4.0;

    const directAccels = Array.from({ length: bodies.length }, () => new Vector2D());
    const bhAccels = Array.from({ length: bodies.length }, () => new Vector2D());

    evaluateForcesDirect(bodies, G, 0.0, epsSq, directAccels);
    evaluateForcesBarnesHut(bodies, G, 0.0, epsSq, bhAccels);

    for (let i = 0; i < bodies.length; i++) {
      expect(bhAccels[i].x).toBeCloseTo(directAccels[i].x, 6);
      expect(bhAccels[i].y).toBeCloseTo(directAccels[i].y, 6);
    }
  });

  it('bounds force relative RMSE to < 2.5% when theta = 0.5', () => {
    const bodies = generateTestCluster(120);
    const G = 1.0;
    const epsSq = 4.0;

    const directAccels = Array.from({ length: bodies.length }, () => new Vector2D());
    const bhAccels = Array.from({ length: bodies.length }, () => new Vector2D());

    evaluateForcesDirect(bodies, G, 0.0, epsSq, directAccels);
    evaluateForcesBarnesHut(bodies, G, 0.5, epsSq, bhAccels);

    let sumDiffSq = 0;
    let sumDirectSq = 0;

    for (let i = 0; i < bodies.length; i++) {
      const dx = bhAccels[i].x - directAccels[i].x;
      const dy = bhAccels[i].y - directAccels[i].y;
      sumDiffSq += dx * dx + dy * dy;
      sumDirectSq += directAccels[i].magSq();
    }

    const rmse = Math.sqrt(sumDiffSq / sumDirectSq);
    expect(rmse).toBeLessThan(0.025); // Under 2.5% relative error
  });
});
