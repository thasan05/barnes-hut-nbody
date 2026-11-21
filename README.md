# Barnes-Hut N-Body Gravitational Simulator

A TypeScript and HTML5 Canvas implementation of an N-body gravitational simulation. It utilizes a spatial quadtree data structure to reduce gravitational all-pairs complexity from $O(N^2)$ to $O(N \log N)$, combined with a symplectic Leapfrog integrator to maintain Hamiltonian energy conservation over extended time horizons.

## Overview

In direct gravitational simulations, computing interactions between $N$ bodies requires $N(N-1)/2$ pairwise force evaluations per step. The Barnes-Hut algorithm partitions two-dimensional space recursively into quadrants. Distant clusters of particles are approximated by their collective mass and center of mass when the ratio of cell size $s$ to distance $d$ falls below an opening angle threshold $\theta$:

$$\frac{s}{d} < \theta$$

### Core Capabilities

- **Spatial QuadTree Decomposition**: Dynamic recursive spatial partitioning with center-of-mass updates and adaptive bounding boxes.
- **Symplectic Leapfrog Integrator**: Time-reversible kick-drift-kick numerical integration scheme preserving phase-space volume and preventing artificial orbital decay.
- **Plummer Softening Kernel**: Gravitational softening parameter $\epsilon$ to eliminate numerical division singularities during close flybys:
  $$F = \frac{G \cdot m_i \cdot m_j}{(r^2 + \epsilon^2)^{3/2}}$$
- **Real-Time Telemetry**: Frame rate counter, step compute timer, Hamiltonian energy monitor ($E = T + U$), and real-time relative drift tracking ($\Delta E / E_0$).
- **Interactive Visualizer**: Canvas 2D rendering with dynamic quadtree partition overlay, particle trajectory trails, velocity vectors, and interactive mouse controls (pan, zoom, slingshot).
- **Astronomical Presets**:
  - Galactic Collision (spiral galaxies with central massive cores and tidal arms)
  - Figure-Eight 3-body choreography
  - Plummer globular star cluster
  - Restricted 3-body Lagrange points ($L_4$ / $L_5$ Trojan swarms)

## Benchmarks

Measurements comparing direct all-pairs summation against the Barnes-Hut quadtree engine:

| Bodies ($N$) | Direct $O(N^2)$ | Barnes-Hut $O(N \log N)$ | Speedup | Relative Force Error |
|---:|---:|---:|---:|---:|
| 100 | 0.57 ms | 1.38 ms | 0.41x | 0.65% |
| 250 | 2.06 ms | 2.00 ms | 1.03x | 0.77% |
| 500 | 6.96 ms | 2.70 ms | 2.58x | 0.75% |
| 1,000 | 29.80 ms | 9.13 ms | 3.26x | 1.71% |
| 2,000 | 107.99 ms | 11.37 ms | 9.50x | 1.49% |
| 4,000 | 464.92 ms | 32.19 ms | 14.44x | 2.06% |

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm

### Installation

```bash
git clone https://github.com/thasan05/barnes-hut-nbody.git
cd barnes-hut-nbody
npm install
```

### Running the Interactive Visualizer

```bash
npm run dev
```

Open `http://localhost:3000` in your web browser.

### Running Automated Tests

```bash
npm test
```

### Running Benchmarks & Headless CLI

```bash
npm run benchmark
npm run cli galaxyCollision 200
```

## Project Architecture

```
barnes-hut-nbody/
├── src/
│   ├── core/
│   │   ├── Vector2D.ts      # 2D vector algebra with in-place operations
│   │   ├── Body.ts          # Particle definitions and trails
│   │   ├── Integrator.ts    # Leapfrog kick-drift-kick integrator
│   │   └── Metrics.ts       # Kinetic, potential, and Hamiltonian tracking
│   ├── tree/
│   │   ├── BoundingBox.ts   # Spatial boundaries and subdivision
│   │   └── QuadTree.ts      # Barnes-Hut recursive quadtree
│   ├── engine/
│   │   ├── Presets.ts       # Initial astrophysical conditions
│   │   └── Simulation.ts    # Simulation controller and stepping loop
│   └── web/
│       ├── Renderer.ts      # Canvas 2D engine and visual overlays
│       ├── UI.ts            # HUD, sliders, and energy sparkline
│       └── main.ts          # Event loop and input handlers
├── test/                    # Vitest test suites (14 tests)
├── scripts/                 # Benchmarks and CLI simulation runner
├── index.html               # Web application interface
└── vite.config.ts           # Bundler configuration
```

## Controls

- **Left-Click + Drag**: Pan viewport
- **Mouse Wheel**: Zoom in / out
- **Shift + Drag**: Slingshot and inject a custom particle into orbit
- **Space**: Pause / Resume simulation
- **R**: Reset current preset
- **C**: Center camera
- **G**: Toggle quadtree grid visualization
- **T**: Toggle particle trails

## License

MIT License - see [LICENSE](LICENSE) for details.
