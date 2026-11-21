import { Simulation } from '../engine/Simulation';
import { Renderer } from './Renderer';
import { UIManager } from './UI';
import { Vector2D } from '../core/Vector2D';
import { Body } from '../core/Body';

function initApp(): void {
  const canvas = document.getElementById('sim-canvas') as HTMLCanvasElement;
  const renderer = new Renderer(canvas);
  const sim = new Simulation();
  const ui = new UIManager(sim, renderer);

  // Resize handler
  function resize(): void {
    renderer.resize(window.innerWidth, window.innerHeight);
  }
  window.addEventListener('resize', resize);
  resize();

  // Load initial preset (Galactic Collision)
  ui.loadCurrentPreset();

  // Mouse & Gesture Interaction
  let isPanning = false;
  let panStartX = 0;
  let panStartY = 0;
  let cameraStartPos = { x: 0, y: 0 };

  canvas.addEventListener('mousedown', (e: MouseEvent) => {
    if (e.button === 0 && e.shiftKey) {
      // Slingshot body creation
      renderer.isDragging = true;
      const worldPos = renderer.screenToWorld(e.clientX, e.clientY);
      renderer.dragStartWorld = worldPos;
      renderer.dragCurrentWorld = worldPos.clone();
    } else if (e.button === 0 || e.button === 1 || e.button === 2) {
      // Pan camera
      isPanning = true;
      panStartX = e.clientX;
      panStartY = e.clientY;
      cameraStartPos = { x: renderer.camera.x, y: renderer.camera.y };
    }
  });

  window.addEventListener('mousemove', (e: MouseEvent) => {
    if (renderer.isDragging && renderer.dragStartWorld) {
      renderer.dragCurrentWorld = renderer.screenToWorld(e.clientX, e.clientY);
    } else if (isPanning) {
      const dx = (e.clientX - panStartX) / renderer.camera.zoom;
      const dy = (e.clientY - panStartY) / renderer.camera.zoom;
      renderer.camera.x = cameraStartPos.x - dx;
      renderer.camera.y = cameraStartPos.y - dy;
    }
  });

  window.addEventListener('mouseup', (e: MouseEvent) => {
    if (renderer.isDragging && renderer.dragStartWorld && renderer.dragCurrentWorld) {
      const start = renderer.dragStartWorld;
      const current = renderer.dragCurrentWorld;
      // Velocity vector points from start towards current or slingshot opposite
      const vel = start.sub(current).scale(0.04);
      const newBody = new Body({
        pos: start,
        vel: vel,
        mass: 2.0,
        radius: 3.0,
        color: '#f43f5e'
      });
      sim.addBody(newBody);
      renderer.isDragging = false;
      renderer.dragStartWorld = null;
      renderer.dragCurrentWorld = null;
    }

    if (isPanning) {
      isPanning = false;
    }
  });

  // Prevent context menu on canvas
  canvas.addEventListener('contextmenu', (e) => e.preventDefault());

  // Mouse Wheel Zoom centered on cursor
  canvas.addEventListener('wheel', (e: WheelEvent) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.12 : 0.89;
    const mouseWorldBefore = renderer.screenToWorld(e.clientX, e.clientY);

    renderer.camera.zoom = Math.max(0.05, Math.min(20, renderer.camera.zoom * zoomFactor));

    const mouseWorldAfter = renderer.screenToWorld(e.clientX, e.clientY);
    renderer.camera.x += mouseWorldBefore.x - mouseWorldAfter.x;
    renderer.camera.y += mouseWorldBefore.y - mouseWorldAfter.y;
  }, { passive: false });

  // Main Loop
  let lastTimestamp = performance.now();
  let fps = 60;

  function animate(timestamp: number): void {
    const elapsed = timestamp - lastTimestamp;
    lastTimestamp = timestamp;

    if (elapsed > 0) {
      const instantFps = 1000 / elapsed;
      fps = fps * 0.92 + instantFps * 0.08;
    }

    if (!ui.isPaused) {
      sim.step();
    }

    renderer.render(sim);
    ui.updateTelemetry(fps);

    requestAnimationFrame(animate);
  }

  requestAnimationFrame(animate);
}

document.addEventListener('DOMContentLoaded', initApp);
