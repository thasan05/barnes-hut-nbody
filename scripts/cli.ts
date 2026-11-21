import { Simulation } from '../src/engine/Simulation';
import { PRESETS } from '../src/engine/Presets';

const presetName = process.argv[2] || 'galaxyCollision';
const totalSteps = parseInt(process.argv[3] || '300', 10);

const preset = PRESETS[presetName];
if (!preset) {
  console.error(`Unknown preset: "${presetName}". Available presets: ${Object.keys(PRESETS).join(', ')}`);
  process.exit(1);
}

console.log(`[Barnes-Hut CLI] Initializing simulation preset: ${preset.name}`);
console.log(`[Barnes-Hut CLI] Bodies: ${preset.create().length} | Steps: ${totalSteps} | dt: ${preset.recommendedDt}\n`);

const sim = new Simulation();
sim.config.dt = preset.recommendedDt;
sim.config.theta = preset.recommendedTheta;
sim.config.G = preset.recommendedG;
sim.config.epsilon = preset.recommendedEpsilon;
sim.loadBodies(preset.create());

const startTime = performance.now();

for (let step = 1; step <= totalSteps; step++) {
  sim.step();

  if (step % 50 === 0 || step === totalSteps) {
    const m = sim.latestMetrics!;
    const pct = ((step / totalSteps) * 100).toFixed(0);
    const driftStr = (m.relativeEnergyDrift * 100).toExponential(3);
    console.log(
      `Step ${step.toString().padStart(4)}/${totalSteps} (${pct}%) | E: ${m.totalEnergy.toFixed(1)} | Drift: ${driftStr}% | Last Step: ${sim.lastStepDurationMs.toFixed(2)}ms`
    );
  }
}

const totalTime = performance.now() - startTime;
console.log(`\nSimulation completed in ${totalTime.toFixed(1)} ms (${(totalTime / totalSteps).toFixed(2)} ms/step avg).`);
