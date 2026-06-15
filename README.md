# MeshViewerGL Demo

Live demo: [MeshViewerGL](https://agonczidemos.github.io/MeshViewerGL/)

MeshViewerGL Demo is a browser-based STL mesh viewer and inspection tool. It loads triangle meshes, renders them with a custom WebGL2 pipeline, provides interactive camera controls, shows mesh statistics, supports inspection overlays, and lets the user remesh or export the currently displayed mesh.

The main goal is to make the rendering and inspection pipeline explicit: STL parsing, mesh buffers, shader programs, camera transforms, picking, overlays, measurement tools, and mesh-processing controls are implemented directly in the application code.

## Features

* Load binary or ASCII STL triangle meshes in the browser.
* Choose sample STL files from the built-in sample menu.
* Render meshes through a custom WebGL2 renderer.
* Orbit, pan, zoom, and fit the camera to the mesh.
* Switch between solid, height, x-ray, and clipping shader modes.
* Toggle wireframe, bounding box, and normal-vector overlays.
* Adjust the light direction interactively.
* Click mesh triangles for picking and point-to-point measurement.
* Display mesh statistics such as triangle count, vertex count, bounds, size, and center.
* Remesh the displayed mesh by approximate target edge length.
* Reset the remeshed view back to the original loaded mesh.
* Save the currently displayed mesh as an STL file.
* Run STL loading and remeshing work in Web Workers so the UI can show processing state.

## Tech Stack

* TypeScript
* React
* Vite
* Raw WebGL2
* GLSL shaders
* gl-matrix
* Web Workers
* GitHub Pages

## Project Structure

```text
src/
  App.tsx                         Main React app, mesh state, loading state, and top-level controls.
  App.css                         App layout, viewer styling, panels, toolbar, menus, and tooltip styling.
  main.tsx                        React app entry point.

  engine/
    camera/
      orbitCamera.ts              Orbit, pan, zoom, fit-view, and camera-position helpers.

    exporters/
      stlExporter.ts              ASCII STL export for the currently displayed mesh.

    geometry/
      triangleSoup.ts             Triangle-soup helpers used by mesh-processing code.

    loaders/
      stlLoader.ts                Binary and ASCII STL parsing.
      stlLoaderWorker.ts          Web Worker wrapper for STL loading.

    math/
      vec3.ts                     Basic vector helpers.

    measurement/
      measurement.ts              Picked-point measurement state and distance calculations.

    mesh/
      meshBuild.ts                Mesh construction helpers.
      meshStats.ts                Mesh bounds and statistics helpers.
      meshTypes.ts                Shared mesh, bounds, and vector types.

    overlays/
      boundingBoxBuilder.ts       Bounding-box line geometry.
      normalArrowBuilder.ts       Normal-vector overlay geometry.
      wireframeBuilder.ts         Wireframe line geometry.

    picking/
      rayPicking.ts               Screen-to-mesh ray construction and triangle picking.

    remesh/
      remeshToApproxTargetEdgeLength.ts  Remeshing orchestration.
      remeshWorker.ts             Web Worker wrapper for remeshing.
      splitLongEdgesRemesh.ts     Long-edge splitting implementation.

    renderer/
      glUtils.ts                  WebGL shader/program utility helpers.
      webglRenderer.ts            WebGL2 renderer, buffers, uniforms, render passes, and overlays.

    shaders/
      solidShader.ts              Mesh and line GLSL shader sources.

  ui/
    FileLoader.tsx                Local STL file input.
    InspectionOverlay.tsx         Pick and measurement overlay display.
    MeshStatsPanel.tsx            Mesh statistics side panel.
    SampleStlMenu.tsx             Built-in sample STL dropdown.
    SaveStlButton.tsx             STL export button.
    ViewerCanvas.tsx              Canvas, renderer lifecycle, camera input, picking, and render loop.
    ViewerToolbar.tsx             Viewer controls and shader/overlay/remesh controls.
    formatters.ts                 Formatting helpers for numeric mesh data.
```

## How It Works

The app parses STL files into a flat triangle mesh made of position and normal buffers. Loading runs in a Web Worker, so larger files can be parsed while the main UI shows a processing overlay.

The renderer creates WebGL2 buffers for the mesh positions, normals, wireframe lines, bounding-box lines, and normal-vector overlay lines. Each frame, the React viewer state is converted into camera matrices, shader options, light direction, clipping parameters, and overlay toggles, then passed into the custom WebGL2 renderer.

The shader pipeline supports multiple inspection modes. Solid mode uses basic lighting, height mode colors the mesh by vertical position, x-ray mode renders transparent geometry, and clipping mode discards geometry above the selected clip height.

Picking uses the current view and projection matrices to build a ray from the mouse position into the scene. The picker tests that ray against mesh triangles and stores selected points for inspection and distance measurement.

The remeshing path reads the displayed triangle soup, splits long triangle edges toward the selected target edge length, rebuilds mesh buffers, and sends the result back to the viewer. The user can then inspect or export the remeshed STL.

## Build

Install dependencies:

```bash
npm install
```

Run the app locally:

```bash
npm run dev
```

Build the frontend:

```bash
npm run build
```

## Deployment

MeshViewerGL is deployed as a static GitHub Pages site. The Vite build generates the production `dist/` folder, which can be published through the repo's GitHub Pages workflow.

## Usage

1. Open the demo.
2. Load an STL file or choose a sample STL.
3. Orbit, pan, zoom, or fit the camera to inspect the mesh.
4. Switch shader modes to inspect shape, height, transparency, or clipping.
5. Toggle wireframe, bounds, and normals as needed.
6. Click points on the mesh to inspect and measure distances.
7. Adjust the target edge length and click Remesh to generate a remeshed display mesh.
8. Use Reset to return to the original loaded mesh.
9. Use Save STL to export the currently displayed mesh.

## License

No license has been selected yet.