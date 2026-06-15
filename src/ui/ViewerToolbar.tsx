import type { Vec3 } from "../engine/mesh/meshTypes";
import type { ShaderMode } from "../engine/renderer/webglRenderer";

type ViewerToolbarProps = {
  shaderMode: ShaderMode;
  showWireframe: boolean;
  showBoundingBox: boolean;
  showNormals: boolean;
  clipRatio: number;
  lightDirection: Vec3;
  remeshTargetEdgeLength: number;
  canRemesh: boolean;
  onShaderModeChange: (shaderMode: ShaderMode) => void;
  onWireframeToggle: () => void;
  onBoundingBoxToggle: () => void;
  onNormalsToggle: () => void;
  onClipRatioChange: (clipRatio: number) => void;
  onLightDirectionChange: (axisIndex: number, value: number) => void;
  onFitView: () => void;
  onClearMeasurement: () => void;
  onRemesh: () => void;
  onRemeshTargetEdgeLengthChange: (targetEdgeLength: number) => void;
};

export function ViewerToolbar({
  shaderMode,
  showWireframe,
  showBoundingBox,
  showNormals,
  clipRatio,
  lightDirection,
  remeshTargetEdgeLength,
  canRemesh,
  onShaderModeChange,
  onWireframeToggle,
  onBoundingBoxToggle,
  onNormalsToggle,
  onClipRatioChange,
  onLightDirectionChange,
  onFitView,
  onClearMeasurement,
  onRemesh,
  onRemeshTargetEdgeLengthChange,
}: ViewerToolbarProps) {
  return (
    <div className="viewer-toolbar">
      <div className="viewer-toolbar-left">
        <button type="button" onClick={onFitView}>
          Fit View
        </button>

        <button
          type="button"
          className={showWireframe ? "active" : ""}
          onClick={onWireframeToggle}
        >
          Wireframe
        </button>

        <button
          type="button"
          className={showBoundingBox ? "active" : ""}
          onClick={onBoundingBoxToggle}
        >
          Bounds
        </button>

        <button
          type="button"
          className={showNormals ? "active" : ""}
          onClick={onNormalsToggle}
        >
          Normals
        </button>

        <button type="button" onClick={onClearMeasurement}>
          Clear Measure
        </button>

        <select
          value={shaderMode}
          onChange={(event) =>
            onShaderModeChange(event.target.value as ShaderMode)
          }
        >
          <option value="solid">Solid</option>
          <option value="height">Height</option>
          <option value="xray">X-Ray</option>
          <option value="clipping">Clip</option>
        </select>

        {shaderMode === "clipping" && (
          <input
            aria-label="Clipping plane"
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={clipRatio}
            onChange={(event) => onClipRatioChange(Number(event.target.value))}
          />
        )}

        <div className="light-controls">
          <span>Light</span>

          <LightSlider
            label="X"
            value={lightDirection[0]}
            onChange={(value) => onLightDirectionChange(0, value)}
          />

          <LightSlider
            label="Y"
            value={lightDirection[1]}
            onChange={(value) => onLightDirectionChange(1, value)}
          />

          <LightSlider
            label="Z"
            value={lightDirection[2]}
            onChange={(value) => onLightDirectionChange(2, value)}
          />
        </div>
      </div>

      <div className="viewer-toolbar-right">
        <label className="remesh-control">
          <span>Edge {remeshTargetEdgeLength.toFixed(1)} mm</span>
          <input
            aria-label="Remesh target edge length"
            type="range"
            min="0.5"
            max="5"
            step="0.5"
            value={remeshTargetEdgeLength}
            onChange={(event) =>
              onRemeshTargetEdgeLengthChange(Number(event.target.value))
            }
          />
        </label>

        <button type="button" disabled={!canRemesh} onClick={onRemesh}>
          Remesh
        </button>
      </div>
    </div>
  );
}

type LightSliderProps = {
  label: string;
  value: number;
  onChange: (value: number) => void;
};

function LightSlider({ label, value, onChange }: LightSliderProps) {
  return (
    <label>
      {label}
      <input
        aria-label={`Light ${label}`}
        type="range"
        min="-1"
        max="1"
        step="0.05"
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
      />
    </label>
  );
}
