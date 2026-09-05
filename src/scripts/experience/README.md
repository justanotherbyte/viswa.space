# Cinematic experience

The new experience lives at `/` and `/flight-archive/`. The original content routes remain available via normal document navigation.

## Replace the concept content

- `src/data/flight-archive.ts`: temporary project names, descriptions, years, and notes.
- `src/pages/index.astro`: homepage narrative and contact copy.
- `src/pages/flight-archive.astro`: project image mapping.
- `src/styles/expedition.css`: the cinematic route styles. The earlier article layouts use `global.css`.

## Motion ownership

- **GSAP / ScrollTrigger:** text entrances, image parallax, reading progress, and the scroll-to-sequence mapping.
- **Theatre.js:** seven authored vehicle/camera channels in `src/data/ascent.theatre.json`.
- **Lenis:** wheel momentum, driven by the same GSAP ticker.
- **Anime.js:** spring-based index menu entry choreography.
- **Motion:** hover gestures and research-note height transitions.
- **Barba.js:** shutter transitions between the two cinematic routes, metadata refresh, focus handling, history scroll restoration, and page teardown.
- **Three.js:** the locally constructed vehicle, materials, lighting, and renderer. No remote model files.

Each page mount returns disposers for timelines, observers, listeners, and GPU resources. Legacy routes use normal navigation, so their Astro scripts still run normally.

## Theatre visual editor

Start the server with `npm run dev -- --background`, then open `http://localhost:4321/?studio` in a development browser. Select **Viswa — Ascent → Ascent → Vehicle** in Theatre Studio. Pause motion with the page control before editing or scrubbing, so scrolling does not overwrite the editor position. Export the project state from Studio and replace `src/data/ascent.theatre.json` to save authored changes to the repository. Studio's local edits alone are not repository changes.

Studio is dynamically imported only when both `import.meta.env.DEV` and the `studio` query parameter are present. Production visitors do not load the editor.

## Validation

- `npm run build`
- `node --test src/scripts/experience/ascent.test.mjs`

The timeline test evaluates the real Theatre state and interpolation. It does not test WebGL rendering or browser page transitions.

Reduced motion uses native scrolling, removes cinematic entrances and transitions, and fixes the vehicle at its opening pose. WebGL failure leaves a static image visible. The interface has no audio and does not require a scroll animation to expose its content.
