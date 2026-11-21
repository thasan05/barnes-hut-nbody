import { Simulation } from '../engine/Simulation';
import { PRESETS } from '../engine/Presets';
import { Renderer } from './Renderer';

export class UIManager {
  private sim: Simulation;
  private renderer: Renderer;

  // Drift history buffer for sparkline (last 120 frames)
  private driftHistory: number[] = [];
  private maxHistory = 120;

  // DOM Elements
  private countEl!: HTMLElement;
  private fpsEl!: HTMLElement;
  private computeTimeEl!: HTMLElement;
  private driftEl!: HTMLElement;
  private totalEnergyEl!: HTMLElement;
  private sparklineCanvas!: HTMLCanvasElement;
  private sparklineCtx!: CanvasRenderingContext2D;

  private presetSelect!: HTMLSelectElement;
  private playPauseBtn!: HTMLButtonElement;
  private stepBtn!: HTMLButtonElement;
  private resetBtn!: HTMLButtonElement;
  private algoToggleBtn!: HTMLButtonElement;
  private gridToggleBtn!: HTMLButtonElement;
  private trailsToggleBtn!: HTMLButtonElement;

  private thetaSlider!: HTMLInputElement;
  private thetaValEl!: HTMLElement;
  private dtSlider!: HTMLInputElement;
  private dtValEl!: HTMLElement;
  private epsilonSlider!: HTMLInputElement;
  private epsilonValEl!: HTMLElement;

  public isPaused: boolean = false;

  constructor(sim: Simulation, renderer: Renderer) {
    this.sim = sim;
    this.renderer = renderer;
    this.bindElements();
    this.setupListeners();
  }

  private bindElements(): void {
    this.countEl = document.getElementById('val-count')!;
    this.fpsEl = document.getElementById('val-fps')!;
    this.computeTimeEl = document.getElementById('val-time')!;
    this.driftEl = document.getElementById('val-drift')!;
    this.totalEnergyEl = document.getElementById('val-energy')!;
    this.sparklineCanvas = document.getElementById('energy-sparkline') as HTMLCanvasElement;
    this.sparklineCtx = this.sparklineCanvas.getContext('2d')!;

    this.presetSelect = document.getElementById('select-preset') as HTMLSelectElement;
    this.playPauseBtn = document.getElementById('btn-play-pause') as HTMLButtonElement;
    this.stepBtn = document.getElementById('btn-step') as HTMLButtonElement;
    this.resetBtn = document.getElementById('btn-reset') as HTMLButtonElement;
    this.algoToggleBtn = document.getElementById('btn-toggle-algo') as HTMLButtonElement;
    this.gridToggleBtn = document.getElementById('btn-toggle-grid') as HTMLButtonElement;
    this.trailsToggleBtn = document.getElementById('btn-toggle-trails') as HTMLButtonElement;

    this.thetaSlider = document.getElementById('slider-theta') as HTMLInputElement;
    this.thetaValEl = document.getElementById('val-theta')!;
    this.dtSlider = document.getElementById('slider-dt') as HTMLInputElement;
    this.dtValEl = document.getElementById('val-dt')!;
    this.epsilonSlider = document.getElementById('slider-epsilon') as HTMLInputElement;
    this.epsilonValEl = document.getElementById('val-epsilon')!;

    // Populate presets
    this.presetSelect.innerHTML = Object.values(PRESETS)
      .map((p) => `<option value="${p.id}">${p.name}</option>`)
      .join('');
  }

  private setupListeners(): void {
    // Preset change
    this.presetSelect.addEventListener('change', () => {
      this.loadCurrentPreset();
    });

    // Play/Pause
    this.playPauseBtn.addEventListener('click', () => {
      this.isPaused = !this.isPaused;
      this.playPauseBtn.textContent = this.isPaused ? 'Resume' : 'Pause';
      this.playPauseBtn.classList.toggle('active', !this.isPaused);
    });

    // Step
    this.stepBtn.addEventListener('click', () => {
      if (this.isPaused) {
        this.sim.step();
      }
    });

    // Reset
    this.resetBtn.addEventListener('click', () => {
      this.loadCurrentPreset();
    });

    // Algorithm toggle
    this.algoToggleBtn.addEventListener('click', () => {
      this.sim.config.useBarnesHut = !this.sim.config.useBarnesHut;
      this.algoToggleBtn.textContent = this.sim.config.useBarnesHut
        ? 'Barnes-Hut O(N log N)'
        : 'Direct Sum O(N²)';
      this.algoToggleBtn.classList.toggle('active', this.sim.config.useBarnesHut);
    });

    // Grid toggle
    this.gridToggleBtn.addEventListener('click', () => {
      this.renderer.showQuadtree = !this.renderer.showQuadtree;
      this.gridToggleBtn.classList.toggle('active', this.renderer.showQuadtree);
    });

    // Trails toggle
    this.trailsToggleBtn.addEventListener('click', () => {
      this.renderer.showTrails = !this.renderer.showTrails;
      this.trailsToggleBtn.classList.toggle('active', this.renderer.showTrails);
    });

    // Sliders
    this.thetaSlider.addEventListener('input', () => {
      const val = parseFloat(this.thetaSlider.value);
      this.sim.config.theta = val;
      this.thetaValEl.textContent = val.toFixed(2);
    });

    this.dtSlider.addEventListener('input', () => {
      const val = parseFloat(this.dtSlider.value);
      this.sim.config.dt = val;
      this.dtValEl.textContent = val.toFixed(3);
    });

    this.epsilonSlider.addEventListener('input', () => {
      const val = parseFloat(this.epsilonSlider.value);
      this.sim.config.epsilon = val;
      this.epsilonValEl.textContent = val.toFixed(1);
    });

    // Keyboard shortcuts
    window.addEventListener('keydown', (e) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLSelectElement) return;

      if (e.code === 'Space') {
        e.preventDefault();
        this.playPauseBtn.click();
      } else if (e.code === 'KeyR') {
        this.resetBtn.click();
      } else if (e.code === 'KeyG') {
        this.gridToggleBtn.click();
      } else if (e.code === 'KeyT') {
        this.trailsToggleBtn.click();
      } else if (e.code === 'KeyC') {
        // Reset camera
        this.renderer.camera = { x: 0, y: 0, zoom: 1.0 };
      }
    });
  }

  public loadCurrentPreset(): void {
    const presetId = this.presetSelect.value;
    const preset = PRESETS[presetId];
    if (!preset) return;

    this.sim.config.dt = preset.recommendedDt;
    this.sim.config.theta = preset.recommendedTheta;
    this.sim.config.G = preset.recommendedG;
    this.sim.config.epsilon = preset.recommendedEpsilon;

    this.dtSlider.value = preset.recommendedDt.toString();
    this.dtValEl.textContent = preset.recommendedDt.toFixed(3);

    this.thetaSlider.value = preset.recommendedTheta.toString();
    this.thetaValEl.textContent = preset.recommendedTheta.toFixed(2);

    this.epsilonSlider.value = preset.recommendedEpsilon.toString();
    this.epsilonValEl.textContent = preset.recommendedEpsilon.toFixed(1);

    this.sim.loadBodies(preset.create());
    this.renderer.camera = { x: 0, y: 0, zoom: 1.0 };
    this.driftHistory = [];
  }

  public updateTelemetry(fps: number): void {
    this.countEl.textContent = this.sim.bodies.length.toString();
    this.fpsEl.textContent = Math.round(fps).toString();
    this.computeTimeEl.textContent = `${this.sim.lastStepDurationMs.toFixed(2)} ms`;

    const m = this.sim.latestMetrics;
    if (m) {
      const drift = m.relativeEnergyDrift;
      this.driftEl.textContent = `${(drift * 100).toExponential(2)}%`;
      this.totalEnergyEl.textContent = m.totalEnergy.toFixed(1);

      this.driftHistory.push(drift);
      if (this.driftHistory.length > this.maxHistory) {
        this.driftHistory.shift();
      }
      this.renderSparkline();
    }
  }

  private renderSparkline(): void {
    const ctx = this.sparklineCtx;
    const w = this.sparklineCanvas.width;
    const h = this.sparklineCanvas.height;

    ctx.clearRect(0, 0, w, h);
    if (this.driftHistory.length < 2) return;

    // Find min and max in history (clamped to at least +/- 1e-4)
    let min = -1e-4;
    let max = 1e-4;
    for (let i = 0; i < this.driftHistory.length; i++) {
      const v = this.driftHistory[i];
      if (v < min) min = v;
      if (v > max) max = v;
    }

    const range = Math.max(1e-6, max - min);

    // Center zero guide line
    const zeroY = h - ((0 - min) / range) * h;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, zeroY);
    ctx.lineTo(w, zeroY);
    ctx.stroke();

    // Plot line
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    for (let i = 0; i < this.driftHistory.length; i++) {
      const val = this.driftHistory[i];
      const x = (i / (this.maxHistory - 1)) * w;
      const y = h - ((val - min) / range) * h;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }
}
