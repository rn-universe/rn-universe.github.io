# RN SYSTEM 🌌

**RN = RIGHT NOW**

RN SYSTEM is an interactive personal universe by **Aryan Bhagwan Patil**. It is designed as an explorable 3D environment rather than a conventional portfolio.

## The idea

Start inside **RN SYSTEM**, explore projects, experiments, ideas, notes, and other parts of the work. Zoom outward for a wider perspective:

**RN SYSTEM → SOLAR SYSTEM → MILKY WAY**

The Milky Way is the outer boundary of the experience. Zooming back in returns the visitor to the RN system and its individual worlds.

## Experience

- Interactive 3D environment powered by Three.js
- Orbit, drag, zoom, and focus-based exploration
- Cinematic camera movement between objects
- Data-driven system content
- Responsive desktop and mobile layout
- Adaptive rendering for lower-power devices
- Reduced-motion support
- Accessible HTML UI and keyboard scale navigation

## Structure

```text
.
├── index.html
└── src/
    ├── main.js
    ├── styles.css
    ├── data/
    │   └── content.js
    └── scene/
        ├── system.js
        ├── galaxy.js
        └── particles.js
```

## Run locally

This is a static GitHub Pages site using browser-native ES modules and a Three.js CDN import map.

A local HTTP server is recommended because browsers can restrict module loading from `file://` URLs.

```bash
python3 -m http.server 8000
```

Then open `http://localhost:8000`.

## Live site

**https://rn-universe.github.io/**

## Status

RN SYSTEM is an evolving experiment. The interface, visual language, interaction model, and universe architecture will continue to change as new work is added.

## Credits

Created by **Aryan Bhagwan Patil**.

Inspired by the idea of treating a portfolio as a world that can be explored, not a page that can only be scrolled.
