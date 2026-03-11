<div align="center">

<img src="https://img.shields.io/badge/Three.js-000000?style=for-the-badge&logo=threedotjs&logoColor=white" alt="Three.js"/>
<img src="https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React"/>
<img src="https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript"/>
<img src="https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white" alt="Vite"/>
<img src="https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="Tailwind CSS"/>

<br/>
<br/>

# ✨ Gesture Particles

### *Control a living universe of particles with nothing but your hands.*

**Gesture Particles** is an interactive 3D particle system that responds to your real-time hand gestures — scale, rotate, and recolor thousands of dazzling particles straight from your webcam, no controllers needed.

<br/>

[🚀 Live Demo](#) &nbsp;·&nbsp; [🐛 Report Bug](https://github.com/Rayhanson-Git/Gesture-Particles/issues) &nbsp;·&nbsp; [💡 Request Feature](https://github.com/Rayhanson-Git/Gesture-Particles/issues)

</div>

---

## 🎬 Overview

Gesture Particles fuses **computer vision**, **3D graphics**, and **creative design** into a single browser experience. Point your webcam at your hands and watch thousands of particles obey your every move:

- **Open your right hand** to expand the particle cloud
- **Pinch your left hand** to cycle through vivid color presets
- **Tilt your wrist** to rotate the 3D shape in any direction

All rendering is done client-side using WebGL via **Three.js**, and hand detection runs entirely in the browser with **Google MediaPipe** — no back-end, no installs, no plugins.

---

## ✨ Features

### 🖐️ Real-Time Hand Tracking
| Gesture | Hand | Effect |
|---|---|---|
| Open palm (spread) | Right | Expands particle scale (0× → 6×) |
| Pinch (thumb + index) | Right | Shrinks particle scale |
| Wrist tilt / rotation | Left | Rotates the entire particle formation |
| Pinch | Left | Cycles through color presets |

### 🎨 10 Stunning Particle Templates
Choose from procedurally generated shapes that are instantly recognizable:

| Template | Description |
|---|---|
| 🌐 **Sphere** | Perfect uniform sphere distribution |
| 📦 **Cube** | Crisp cubic volume |
| 🔺 **Pyramid** | Classic triangular pyramid |
| 🍩 **Torus** | Smooth donut ring |
| 🧬 **Helix** | Double helix with organic noise |
| 🔬 **DNA** | Two strands with connecting cross-bars |
| 🌌 **Galaxy** | 3-armed spiral with power-law density |
| ⭐ **Star** | 5-pointed star with concentric layers |
| 🪐 **Saturn** | Sphere with iconic outer rings |
| 🌠 **Aurora** | Northern-lights inspired wave curtains |

### 🌈 9 Color Presets + Custom Colors
Instantly switch between curated palettes, or dial in your own hex color with the built-in color picker.

### 💡 Post-Processing Bloom
An **Unreal Bloom** pass wraps every particle in a radiant glow, making the formation look like it's lit from within.

### ⚙️ Full Control Panel
A sleek, collapsible sidebar lets you fine-tune every aspect of the simulation in real time:
- **Density** — 5,000 to 25,000 particles
- **Size & Opacity**
- **Pulsation intensity** — wave-like breathing animation
- **Bloom intensity**
- **Auto-rotation** with adjustable speed
- **Background color**
- Enable / disable left or right hand independently

### 📷 Draggable Camera Preview
A floating, resizable picture-in-picture window overlays the 21-landmark hand skeleton directly onto your live camera feed so you always know what the model can see.

### 📊 Performance Monitor
A real-time FPS counter keeps you informed of rendering performance.

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Framework | React 18 + TypeScript |
| 3D Engine | Three.js 0.181 |
| Hand Tracking | Google MediaPipe Hands (CDN) |
| Post-Processing | `postprocessing` – UnrealBloomPass |
| Styling | Tailwind CSS 3 |
| Icons | Lucide React |
| Color Picker | react-colorful |
| Build | Vite 5 |

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** ≥ 18
- A modern browser with **WebGL** support
- A **webcam** (required for hand tracking)

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/Rayhanson-Git/Gesture-Particles.git
cd Gesture-Particles

# 2. Install dependencies
npm install

# 3. Start the development server
npm run dev
```

Then open [http://localhost:5173](http://localhost:5173) in your browser and allow webcam access when prompted.

### Build for Production

```bash
npm run build
```

The optimized output will be in the `dist/` directory, ready to deploy to any static host (Vercel, Netlify, GitHub Pages, etc.).

---

## 🎮 How to Use

1. **Grant webcam permission** when the browser asks.
2. The particle cloud will appear immediately — hand tracking activates once MediaPipe loads (~1–2 s).
3. **Hold up your right hand** in front of the camera. Spread your fingers to scale the cloud out; pinch to pull it back in.
4. **Hold up your left hand** and tilt your wrist to rotate the formation. Pinch with your left hand to cycle colors.
5. Use the **control panel** (⚙️ button, top-right) to switch templates, adjust particle density, enable bloom, and more.
6. Drag or resize the **camera preview** window to position it wherever you like.

---

## 🗂️ Project Structure

```
Gesture-Particles/
├── src/
│   ├── components/
│   │   ├── ThreeScene.tsx          # WebGL scene, camera, renderer, effect composer
│   │   ├── ParticleSystem.ts       # Particle geometry, material & animation engine
│   │   ├── EnhancedControlPanel.tsx# Collapsible settings sidebar
│   │   ├── ControlPanel.tsx        # Quick template / color switcher
│   │   ├── HandIndicator.tsx       # Hand detection status bar
│   │   ├── CameraPreview.tsx       # Draggable & resizable camera window
│   │   ├── HandFeedbackRings.tsx   # 3D ring indicators at hand positions
│   │   ├── HandCube.tsx            # Wrist cube for rotation visualisation
│   │   └── PerformanceMonitor.tsx  # Live FPS counter
│   ├── hooks/
│   │   └── useHandTracking.ts      # MediaPipe init, landmark processing, canvas draw
│   ├── utils/
│   │   ├── gestureDetection.ts     # Pinch / thumbs-up / peace-sign detection
│   │   ├── particleTemplates.ts    # 10 procedural shape generators
│   │   └── colorPresets.ts         # 9 built-in color palettes
│   ├── App.tsx                     # Root component & global state
│   ├── main.tsx                    # React entry point
│   └── index.css                   # Tailwind base + custom slider styles
├── index.html                      # HTML shell with MediaPipe CDN tags
├── vite.config.ts
├── tailwind.config.js
└── package.json
```

---

## 🔍 How It Works

```
Webcam Input
     │
     ▼
MediaPipe Hands  (21 landmarks per hand, 30 FPS)
     │
     ├─► Hand Openness  ──────────────────────────────────────────┐
     ├─► Gesture Detection  (pinch / thumbs-up / peace sign)      │
     ├─► 3D Wrist Position & Rotation                             │
     └─► Canvas Drawing  (camera preview skeleton overlay)        │
                                                                   │
     ┌─────────────────────────────────────────────────────────────┘
     │
     ▼
 Hand Data State  (React)
     │
     ├─► ThreeScene
     │      ├─► ParticleSystem.update()
     │      │      ├─► Apply wrist-driven rotation
     │      │      ├─► Apply openness-driven scale
     │      │      └─► Animate particle positions & glow colours
     │      └─► EffectComposer.render()  (Bloom pass)
     │
     └─► Visual Feedback
            ├─► HandFeedbackRings  (3D wrist indicators)
            ├─► HandIndicator  (openness % bars)
            └─► CameraPreview  (live feed + skeleton)
```

---

## 🤝 Contributing

Contributions are warmly welcome! Here's how to get involved:

1. **Fork** the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m "Add amazing feature"`
4. Push to your fork: `git push origin feature/amazing-feature`
5. Open a **Pull Request**

Please make sure your code builds cleanly (`npm run build`) before submitting.

---

## 📄 License

Distributed under the **MIT License**. See [`LICENSE`](LICENSE) for details.

---

<div align="center">

Made with ❤️ and a lot of hand-waving &nbsp;·&nbsp; [⭐ Star this repo](https://github.com/Rayhanson-Git/Gesture-Particles) if you found it cool!

</div>
