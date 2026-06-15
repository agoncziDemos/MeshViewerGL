import { formatVec3 } from "../engine/measurement/measurement";
import type { Vec3 } from "../engine/mesh/meshTypes";
import type { PickResult } from "../engine/picking/rayPicking";

type InspectionOverlayProps = {
  selectedPick: PickResult | null;
  latestPickedPoint: Vec3 | null;
  measurementDistance: number | null;
};

export function InspectionOverlay({
  selectedPick,
  latestPickedPoint,
  measurementDistance,
}: InspectionOverlayProps) {
  return (
    <div className="inspection-overlay">
      {selectedPick && latestPickedPoint ? (
        <>
          <div>Triangle: {selectedPick.triangleIndex}</div>
          <div>Point: {formatVec3(latestPickedPoint)}</div>
          <div>Normal: {formatVec3(selectedPick.normal)}</div>
        </>
      ) : (
        <div>Click the mesh to pick measurement points.</div>
      )}

      {measurementDistance !== null && (
        <div>Distance: {measurementDistance.toFixed(3)}</div>
      )}
    </div>
  );
}
