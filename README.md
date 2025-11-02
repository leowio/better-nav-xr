# Better Navigation XR

A hand gesture-based navigation library for VR that replaces the unintuitive point-and-click paradigm with natural, fluid interactions.

## Overview

Better Navigation XR addresses the fundamental challenge of VR UI navigation by developing an intuitive gesture-based interaction system. Instead of forcing users to use their hands as cursors to poke at floating screens, this library enables natural hand gestures optimized for three-dimensional space.

## Team

- [Leo Wang](https://github.com/leowio)
- Benjamin Cheung
- Ashton Chiu

Supervision: Prométhée Spathis & Jung Hyun Moon

## Core Gestures

- **Scrolling**: Gentle "wave" motion with an open palm
- **Swiping**: Quick, directional "flick" of the wrist or hand
- **Zooming**: Two-handed gesture (pull apart to zoom in, push together to zoom out)
- **Confirm/Decline**: Thumbs-up / thumbs-down gesture

## Technology Stack

- **WebXR**: Browser-based VR environment
- **React Three Fiber**: 3D rendering framework
- **@react-three/xr**: WebXR integration
- **three.js**: 3D graphics library
- **TypeScript**: Type-safe development

## Project Structure

This is a monorepo using Turborepo:

- `apps/web`: WebXR demo application
- `packages/nav`: Core gesture recognition library (`@repo/nav`)

## Getting Started

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev

# Build all packages
pnpm build
```

The web app will be available at `https://localhost:5173` (HTTPS required for WebXR).

## Development

The gesture recognition system uses raw hand joint data from the WebXR API (21 joints per hand) to detect gestures through rule-based algorithms and velocity/distance thresholds.

## License

MIT
