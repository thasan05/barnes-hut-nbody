import { Body } from '../core/Body';
import { LeapfrogIntegrator } from '../core/Integrator';
import { MetricsTracker, SystemMetrics } from '../core/Metrics';
import { QuadTree } from '../tree/QuadTree';

export interface SimulationConfig {
  G: number;
  dt: number;
  theta: number;
  epsilon: number;
  useBarnesHut: boolean;
  substeps: number;
}

export class Simulation {
  public bodies: Body[] = [];
  public config: SimulationConfig = {
    G: 1.0,
    dt: 0.15,
    theta: 0.6,
    epsilon: 4.0,
    useBarnesHut: true,
    substeps: 1
  };

  public integrator = new LeapfrogIntegrator();
  public metricsTracker = new MetricsTracker();
  public latestMetrics: SystemMetrics | null = null;
  public latestTree: QuadTree | null = null;
  public lastStepDurationMs: number = 0;
  public stepCount: number = 0;

  loadBodies(bodies: Body[]): void {
    this.bodies = bodies;
    this.integrator.reset();
    this.metricsTracker.reset();
    this.latestTree = null;
    this.stepCount = 0;
    this.updateMetrics();
  }

  step(): void {
    const t0 = performance.now();
    const effectiveDt = this.config.dt / this.config.substeps;

    for (let s = 0; s < this.config.substeps; s++) {
      this.integrator.step(
        this.bodies,
        effectiveDt,
        this.config.G,
        this.config.theta,
        this.config.epsilon,
        this.config.useBarnesHut,
        (tree) => {
          this.latestTree = tree;
        }
      );
    }

    this.stepCount++;
    // Record trail every 2 steps for fluid visual performance
    if (this.stepCount % 2 === 0) {
      for (let i = 0; i < this.bodies.length; i++) {
        this.bodies[i].recordTrail();
      }
    }

    this.lastStepDurationMs = performance.now() - t0;
    this.updateMetrics();
  }

  updateMetrics(): void {
    this.latestMetrics = this.metricsTracker.compute(
      this.bodies,
      this.config.G,
      this.config.epsilon
    );
  }

  addBody(body: Body): void {
    this.bodies.push(body);
    this.integrator.reset();
  }

  clear(): void {
    this.bodies = [];
    this.integrator.reset();
    this.metricsTracker.reset();
    this.latestTree = null;
    this.latestMetrics = null;
  }
}
