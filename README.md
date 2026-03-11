

````md
# Gesture Particles

An interactive **hand-tracked 3D particle experience** built with **React**, **TypeScript**, **Three.js**, and **MediaPipe Hands**.

Move your hands in front of your camera to control a live particle sculpture in the browser. Rotate it, scale it, cycle colors, and customize the scene with built-in visual controls.

## Live Demo

**GitHub Pages:**  
[https://rayhanson-git.github.io/Gesture-Particles/](https://rayhanson-git.github.io/Gesture-Particles/)

---

## Preview

Add a screenshot or GIF here once you capture one.

```md
![Gesture Particles Preview](./preview.png)
````

A short screen recording/GIF would make this README look even better.

---

## Features

* **Real-time hand tracking** using MediaPipe
* **Interactive 3D particle system** powered by Three.js
* **Gesture-based control**

  * **Left hand rotation** rotates the particle object
  * **Left hand pinch** cycles through color presets
  * **Right hand openness** scales the particle system
  * **Right hand pinch** gives finer scale control
* **Built-in control panel** for live customization
* **Bloom effects** for a glowing visual style
* **Multiple particle templates**

  * Sphere
  * Torus
  * Helix
  * DNA
  * Galaxy
  * Star
  * Saturn
  * Aurora
* **Camera preview** with hand feedback overlay
* **Performance/FPS monitor**
* **Responsive fullscreen experience**

---

## Tech Stack

* **React**
* **TypeScript**
* **Vite**
* **Three.js**
* **MediaPipe Hands**
* **Tailwind CSS**
* **react-colorful**
* **postprocessing**

---

## How It Works

This project combines computer vision and 3D rendering in the browser:

1. **MediaPipe Hands** detects hand landmarks from your webcam feed
2. Hand position, openness, and pinch state are calculated in real time
3. Those values are mapped to particle system behavior inside a **Three.js** scene
4. A floating UI lets you change colors, templates, bloom, density, size, opacity, and more

---

## Controls

### Gesture Controls

* **Left hand movement / rotation** → rotates the particle system
* **Left hand pinch** → changes particle color preset
* **Right hand open/close** → scales the particle system
* **Right hand pinch** → fine scaling behavior

### UI Controls

You can also adjust:

* Particle template
* Particle color
* Bloom on/off
* Bloom intensity
* Particle size
* Particle opacity
* Particle density
* Pulsate intensity
* Auto-rotate speed
* Background color
* Left hand on/off
* Right hand on/off
* Hand dots on/off
* FPS monitor

---

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/Rayhanson-Git/Gesture-Particles.git
cd Gesture-Particles
```

### 2. Install dependencies

```bash
npm install
```

### 3. Start the development server

```bash
npm run dev
```

### 4. Open in your browser

Vite will give you a local URL, usually:

```bash
http://localhost:5173
```

---

## Build for Production

```bash
npm run build
```

To preview the production build locally:

```bash
npm run preview
```

---

## Deployment

This project is configured for **GitHub Pages** deployment using **GitHub Actions**.

For GitHub Pages, the Vite config uses:

```ts
base: '/Gesture-Particles/'
```

So the deployed app works correctly at:

```txt
https://Rayhanson-Git.github.io/Gesture-Particles/
```

---

## Project Structure

```bash
Gesture-Particles/
├── src/
│   ├── components/
│   │   ├── CameraPreview.tsx
│   │   ├── EnhancedControlPanel.tsx
│   │   ├── HandCube.tsx
│   │   ├── HandFeedbackRings.tsx
│   │   ├── HandIndicator.tsx
│   │   ├── ParticleSystem.ts
│   │   ├── PerformanceMonitor.tsx
│   │   └── ThreeScene.tsx
│   ├── hooks/
│   │   └── useHandTracking.ts
│   ├── utils/
│   │   ├── colorPresets.ts
│   │   ├── gestureDetection.ts
│   │   └── particleTemplates.ts
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── public/
├── index.html
├── package.json
├── vite.config.ts
└── README.md
```

---

## Notes

* Camera permission is required for hand tracking to work
* Best experienced on a desktop/laptop browser with a webcam
* Good lighting helps hand detection perform more reliably
* If the live site loads but appears broken, make sure the Vite `base` path is set correctly for GitHub Pages

---

## Future Improvements

* More gesture actions
* Preset save/load system
* Custom particle animations
* Audio-reactive mode
* Mobile optimization
* Screenshot/export mode
* UI themes and scene presets

---

## Acknowledgements

* [Three.js](https://threejs.org/)
* [MediaPipe Hands](https://developers.google.com/mediapipe)
* [Vite](https://vitejs.dev/)
* [React](https://react.dev/)

---

## Author

**Rayhanson / Rayhanson-Git**
GitHub: [@Rayhanson-Git](https://github.com/Rayhanson-Git)

---

## License

This project is open source and available under the **MIT License**.
