import { mat4 } from "gl-matrix";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  createInitialCamera,
  getCameraPosition,
  getCameraUp,
  orbitCamera,
  panCamera,
  type CameraState,
  zoomCamera,
} from "../engine/camera/orbitCamera";
import {
  addMeasurementPoint,
  createEmptyMeasurement,
  getMeasurementDistance,
  type MeasurementState,
} from "../engine/measurement/measurement";
import type { MeshData, Vec3 } from "../engine/mesh/meshTypes";
import {
  createPickRay,
  pickMeshTriangle,
  type PickResult,
} from "../engine/picking/rayPicking";
import {
  type ShaderMode,
  WebglRenderer,
} from "../engine/renderer/webglRenderer";
import { InspectionOverlay } from "./InspectionOverlay";
import { ViewerToolbar } from "./ViewerToolbar";

type ViewerCanvasProps = {
  mesh: MeshData | null;
  viewResetKey: number;
  isProcessingMesh: boolean;
  remeshTargetEdgeLength: number;
  onRemesh: () => void;
  onRemeshTargetEdgeLengthChange: (targetEdgeLength: number) => void;
};

type PointerDragState = {
  pointerId: number;
  startX: number;
  startY: number;
  lastX: number;
  lastY: number;
  mode: "orbit" | "pan";
  moved: boolean;
};

const CLICK_MOVE_TOLERANCE = 4;

export function ViewerCanvas({
  mesh,
  viewResetKey,
  isProcessingMesh,
  remeshTargetEdgeLength,
  onRemesh,
  onRemeshTargetEdgeLengthChange,
}: ViewerCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rendererRef = useRef<WebglRenderer | null>(null);
  const dragStateRef = useRef<PointerDragState | null>(null);
  const latestViewRef = useRef<mat4>(mat4.create());
  const latestProjectionRef = useRef<mat4>(mat4.create());

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [camera, setCamera] = useState<CameraState>(() =>
    createInitialCamera(null),
  );
  const [shaderMode, setShaderMode] = useState<ShaderMode>("solid");
  const [showWireframe, setShowWireframe] = useState(false);
  const [showBoundingBox, setShowBoundingBox] = useState(false);
  const [showNormals, setShowNormals] = useState(false);
  const [clipRatio, setClipRatio] = useState(0.5);
  const [lightDirection, setLightDirection] = useState<Vec3>([0.4, 0.8, 0.6]);
  const [measurement, setMeasurement] = useState<MeasurementState>(() =>
    createEmptyMeasurement(),
  );
  const [selectedPick, setSelectedPick] = useState<PickResult | null>(null);

  const meshKey = useMemo(() => {
    if (!mesh) {
      return "empty";
    }

    return `${mesh.name}-${mesh.triangleCount}-${mesh.bounds.radius}`;
  }, [mesh]);

  useEffect(() => {
    setCamera(createInitialCamera(mesh));
  }, [viewResetKey]);

  useEffect(() => {
    setMeasurement(createEmptyMeasurement());
    setSelectedPick(null);
  }, [meshKey]);

  useEffect(() => {
    const canvas = canvasRef.current;

    if (!canvas) {
      return;
    }

    try {
      const renderer = new WebglRenderer(canvas);
      rendererRef.current = renderer;
      setErrorMessage(null);

      return () => {
        renderer.dispose();
        rendererRef.current = null;
      };
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Failed to initialize WebGL2.",
      );
    }
  }, []);

  useEffect(() => {
    rendererRef.current?.setMesh(mesh);
  }, [mesh]);

  useEffect(() => {
    let animationFrameId = 0;

    function renderFrame() {
      const renderer = rendererRef.current;
      const canvas = canvasRef.current;

      if (renderer && canvas) {
        const aspect =
          Math.max(1, canvas.clientWidth) / Math.max(1, canvas.clientHeight);
        const projection = mat4.create();
        const view = mat4.create();
        const cameraPosition = getCameraPosition(camera);

        mat4.perspective(projection, Math.PI / 4, aspect, 0.01, 100000);
        mat4.lookAt(view, cameraPosition, camera.target, getCameraUp(camera));

        latestViewRef.current = view;
        latestProjectionRef.current = projection;

        renderer.render(
          {
            view,
            projection,
            position: cameraPosition,
          },
          {
            shaderMode,
            showWireframe,
            showBoundingBox,
            showNormals,
            clipRatio,
            measurementPoints: measurement.points,
            lightDirection,
          },
        );
      }

      animationFrameId = requestAnimationFrame(renderFrame);
    }

    animationFrameId = requestAnimationFrame(renderFrame);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [
    camera,
    shaderMode,
    showWireframe,
    showBoundingBox,
    showNormals,
    clipRatio,
    measurement,
    lightDirection,
  ]);

  function handlePointerDown(event: React.PointerEvent<HTMLCanvasElement>) {
    event.currentTarget.setPointerCapture(event.pointerId);

    dragStateRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      lastX: event.clientX,
      lastY: event.clientY,
      mode:
        event.button === 1 || event.button === 2 || event.shiftKey
          ? "pan"
          : "orbit",
      moved: false,
    };
  }

  function handlePointerMove(event: React.PointerEvent<HTMLCanvasElement>) {
    const dragState = dragStateRef.current;

    if (!dragState || dragState.pointerId !== event.pointerId) {
      return;
    }

    const dx = event.clientX - dragState.lastX;
    const dy = event.clientY - dragState.lastY;

    updateDragMovedState(dragState, event.clientX, event.clientY);

    dragState.lastX = event.clientX;
    dragState.lastY = event.clientY;

    setCamera((current) =>
      dragState.mode === "orbit"
        ? orbitCamera(current, dx, dy)
        : panCamera(current, dx, dy),
    );
  }

  function handlePointerUp(event: React.PointerEvent<HTMLCanvasElement>) {
    const dragState = dragStateRef.current;

    if (!dragState || dragState.pointerId !== event.pointerId) {
      return;
    }

    dragStateRef.current = null;

    if (!dragState.moved) {
      pickAt(event.clientX, event.clientY);
    }
  }

  function handleWheel(event: React.WheelEvent<HTMLCanvasElement>) {
    event.preventDefault();
    setCamera((current) => zoomCamera(current, event.deltaY));
  }

  function handleContextMenu(event: React.MouseEvent<HTMLCanvasElement>) {
    event.preventDefault();
  }

  function handleFitView() {
    setCamera(createInitialCamera(mesh));
  }

  function handleClearMeasurement() {
    setMeasurement(createEmptyMeasurement());
    setSelectedPick(null);
  }

  function handleLightDirectionChange(axisIndex: number, value: number) {
    setLightDirection((current) => {
      const next: Vec3 = [current[0], current[1], current[2]];
      next[axisIndex] = value;
      return next;
    });
  }

  function pickAt(clientX: number, clientY: number) {
    const canvas = canvasRef.current;

    if (!canvas || !mesh) {
      return;
    }

    const ray = createPickRay(
      canvas,
      clientX,
      clientY,
      latestViewRef.current,
      latestProjectionRef.current,
    );

    if (!ray) {
      return;
    }

    const pick = pickMeshTriangle(mesh, ray);

    if (!pick) {
      return;
    }

    setSelectedPick(pick);
    setMeasurement((current) => addMeasurementPoint(current, pick.position));
  }

  const latestPickedPoint =
    measurement.points.length > 0
      ? measurement.points[measurement.points.length - 1]
      : null;

  return (
    <div className="viewer-canvas-shell">
      <ViewerToolbar
        shaderMode={shaderMode}
        showWireframe={showWireframe}
        showBoundingBox={showBoundingBox}
        showNormals={showNormals}
        clipRatio={clipRatio}
        lightDirection={lightDirection}
        remeshTargetEdgeLength={remeshTargetEdgeLength}
        canRemesh={Boolean(mesh) && !isProcessingMesh}
        onShaderModeChange={setShaderMode}
        onWireframeToggle={() => setShowWireframe((value) => !value)}
        onBoundingBoxToggle={() => setShowBoundingBox((value) => !value)}
        onNormalsToggle={() => setShowNormals((value) => !value)}
        onClipRatioChange={setClipRatio}
        onLightDirectionChange={handleLightDirectionChange}
        onFitView={handleFitView}
        onClearMeasurement={handleClearMeasurement}
        onRemesh={onRemesh}
        onRemeshTargetEdgeLengthChange={onRemeshTargetEdgeLengthChange}
      />

      <canvas
        ref={canvasRef}
        className="viewer-canvas"
        onContextMenu={handleContextMenu}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onWheel={handleWheel}
      />

      {!mesh && (
        <div className="viewer-empty-overlay">
          <h2>No mesh loaded</h2>
          <p>Upload an STL file to view it here.</p>
        </div>
      )}

      {mesh && (
        <InspectionOverlay
          selectedPick={selectedPick}
          latestPickedPoint={latestPickedPoint}
          measurementDistance={getMeasurementDistance(measurement)}
        />
      )}

      {errorMessage && <div className="viewer-error-overlay">{errorMessage}</div>}
    </div>
  );
}

function updateDragMovedState(
  dragState: PointerDragState,
  clientX: number,
  clientY: number,
) {
  const totalDx = clientX - dragState.startX;
  const totalDy = clientY - dragState.startY;

  if (
    Math.abs(totalDx) > CLICK_MOVE_TOLERANCE ||
    Math.abs(totalDy) > CLICK_MOVE_TOLERANCE
  ) {
    dragState.moved = true;
  }
}

