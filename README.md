# MiKaPo

Desktop real-time MMD motion capture for VTubing.  
Body, hands, and face from a webcam — live, with full control over every setting.

Runs on Electron. Captured via OBS with transparent or chroma-key background.

## What it does

- **Webcam** → MMD model in real time
- **Full body** — pose, both hands with fingers, face morphs (blink, mouth, smile, gaze)
- **Live tuning** — every parameter adjustable while running: bones, face thresholds, smoothing, lighting, camera
- **Save/load configs** — export all settings to JSON, import anytime. No restart needed.
- **OBS-ready** — background rendering continues when minimized. Windows 10 Capture works with hidden windows.

## Controls

| Panel | What |
|-------|------|
| Camera | Start/stop webcam, preview toggle |
| Bones | Enable/disable body parts in real-time |
| Face | Morph on/off, thresholds, smoothing, gaze |
| World | Camera follow, distance, angle; sun & ambient light; background color; body smoothing |
| MediaPipe | Detection confidence thresholds |
| Config | Save/load all settings as JSON |

## Stack

Electron + Next.js + Reze Engine (WebGPU MMD) + MediaPipe HolisticLandmarker

## Quick Start

```bash
npm install
npm run dev
```

## License

GNU General Public License v3.0 — see [LICENSE](./LICENSE).

Based on [MiKaPo](https://github.com/AmyangXYZ/MiKaPo) (MIT) and [Reze Engine](https://github.com/AmyangXYZ/reze-engine) (GPL v3).