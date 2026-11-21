import { Simulation } from '../engine/Simulation';
import { Vector2D } from '../core/Vector2D';

export interface Camera {
  x: number;
  y: number;
  zoom: number;
}

export class Renderer {
  public canvas: HTMLCanvasElement;
  public ctx: CanvasRenderingContext2D;
  public camera: Camera = { x: 0, y: 0, zoom: 1.0 };
  public showQuadtree: boolean = true;
  public showTrails: boolean = true;
  public showVelocityVectors: boolean = false;
  public showCenterOfMass: boolean = true;

  // Slingshot drag state
  public isDragging: boolean = false;
  public dragStartWorld: Vector2D | null = null;
  public dragCurrentWorld: Vector2D | null = null;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) throw new Error('Failed to acquire 2D canvas context');
    this.ctx = ctx;
  }

  resize(width: number, height: number): void {
    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = width * dpr;
    this.canvas.height = height * dpr;
    this.ctx.scale(dpr, dpr);
  }

  worldToScreen(worldPos: Vector2D): Vector2D {
    const width = this.canvas.clientWidth;
    const height = this.canvas.clientHeight;
    return new Vector2D(
      (worldPos.x - this.camera.x) * this.camera.zoom + width * 0.5,
      (worldPos.y - this.camera.y) * this.camera.zoom + height * 0.5
    );
  }

  screenToWorld(screenX: number, screenY: number): Vector2D {
    const width = this.canvas.clientWidth;
    const height = this.canvas.clientHeight;
    return new Vector2D(
      (screenX - width * 0.5) / this.camera.zoom + this.camera.x,
      (screenY - height * 0.5) / this.camera.zoom + this.camera.y
    );
  }

  render(sim: Simulation): void {
    const width = this.canvas.clientWidth;
    const height = this.canvas.clientHeight;
    const ctx = this.ctx;

    // 1. Dark obsidian background with subtle vignette
    ctx.save();
    ctx.fillStyle = '#08090c';
    ctx.fillRect(0, 0, width, height);

    // Apply camera transform
    ctx.translate(width * 0.5, height * 0.5);
    ctx.scale(this.camera.zoom, this.camera.zoom);
    ctx.translate(-this.camera.x, -this.camera.y);

    // 2. Render Quadtree partitions if enabled
    if (this.showQuadtree && sim.latestTree && sim.config.useBarnesHut) {
      const boxes: { x: number; y: number; size: number; depth: number }[] = [];
      sim.latestTree.collectBoxes(boxes);

      ctx.save();
      for (let i = 0; i < boxes.length; i++) {
        const b = boxes[i];
        // Deeper levels get thinner and slightly dimmer lines
        const alpha = Math.max(0.04, 0.22 - b.depth * 0.025);
        ctx.strokeStyle = `rgba(56, 189, 248, ${alpha})`;
        ctx.lineWidth = 1 / this.camera.zoom;
        ctx.strokeRect(b.x, b.y, b.size, b.size);
      }
      ctx.restore();
    }

    // 3. Render Trails
    if (this.showTrails) {
      ctx.save();
      for (let i = 0; i < sim.bodies.length; i++) {
        const b = sim.bodies[i];
        if (b.trail.length < 2) continue;

        ctx.beginPath();
        ctx.moveTo(b.trail[0].x, b.trail[0].y);
        for (let t = 1; t < b.trail.length; t++) {
          ctx.lineTo(b.trail[t].x, b.trail[t].y);
        }
        ctx.strokeStyle = b.color;
        ctx.globalAlpha = 0.25;
        ctx.lineWidth = Math.max(0.8, (b.radius * 0.4) / Math.sqrt(this.camera.zoom));
        ctx.stroke();
      }
      ctx.restore();
    }

    // 4. Render Bodies with radial glow
    ctx.save();
    for (let i = 0; i < sim.bodies.length; i++) {
      const b = sim.bodies[i];
      const r = Math.max(1.2, b.radius / Math.sqrt(this.camera.zoom));

      // Glow halo for prominent masses
      if (b.mass > 5 || b.isFixed) {
        const glowRadius = r * 3.5;
        const grad = ctx.createRadialGradient(b.pos.x, b.pos.y, r * 0.5, b.pos.x, b.pos.y, glowRadius);
        grad.addColorStop(0, b.color);
        grad.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(b.pos.x, b.pos.y, glowRadius, 0, Math.PI * 2);
        ctx.fill();
      }

      // Core particle
      ctx.fillStyle = b.color;
      ctx.beginPath();
      ctx.arc(b.pos.x, b.pos.y, r, 0, Math.PI * 2);
      ctx.fill();

      // Velocity vectors
      if (this.showVelocityVectors) {
        ctx.strokeStyle = 'rgba(251, 191, 36, 0.7)';
        ctx.lineWidth = 1 / this.camera.zoom;
        ctx.beginPath();
        ctx.moveTo(b.pos.x, b.pos.y);
        ctx.lineTo(b.pos.x + b.vel.x * 6, b.pos.y + b.vel.y * 6);
        ctx.stroke();
      }
    }
    ctx.restore();

    // 5. Center of Mass crosshair
    if (this.showCenterOfMass && sim.latestMetrics) {
      const com = sim.latestMetrics.centerOfMass;
      ctx.save();
      ctx.strokeStyle = 'rgba(244, 63, 94, 0.6)';
      ctx.lineWidth = 1.2 / this.camera.zoom;
      const arm = 8 / this.camera.zoom;
      ctx.beginPath();
      ctx.moveTo(com.x - arm, com.y);
      ctx.lineTo(com.x + arm, com.y);
      ctx.moveTo(com.x, com.y - arm);
      ctx.lineTo(com.x, com.y + arm);
      ctx.stroke();
      ctx.restore();
    }

    // 6. Interactive slingshot drag line
    if (this.isDragging && this.dragStartWorld && this.dragCurrentWorld) {
      ctx.save();
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2 / this.camera.zoom;
      ctx.setLineDash([4 / this.camera.zoom, 4 / this.camera.zoom]);
      ctx.beginPath();
      ctx.moveTo(this.dragStartWorld.x, this.dragStartWorld.y);
      ctx.lineTo(this.dragCurrentWorld.x, this.dragCurrentWorld.y);
      ctx.stroke();

      // Draw ghost particle at start
      ctx.setLineDash([]);
      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      ctx.arc(this.dragStartWorld.x, this.dragStartWorld.y, 4 / this.camera.zoom, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    ctx.restore();
  }
}
