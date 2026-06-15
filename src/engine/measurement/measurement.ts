import type { Vec3 } from "../mesh/meshTypes";
import { distanceVec3, formatVec3 } from "../math/vec3Utils";

export type MeasurementState = {
  points: Vec3[];
};

export function createEmptyMeasurement(): MeasurementState {
  return {
    points: [],
  };
}

export function addMeasurementPoint(
  measurement: MeasurementState,
  point: Vec3,
): MeasurementState {
  if (measurement.points.length >= 2) {
    return {
      points: [point],
    };
  }

  return {
    points: [...measurement.points, point],
  };
}

export function getMeasurementDistance(
  measurement: MeasurementState,
): number | null {
  if (measurement.points.length !== 2) {
    return null;
  }

  return distanceVec3(measurement.points[0], measurement.points[1]);
}

export { formatVec3 };
