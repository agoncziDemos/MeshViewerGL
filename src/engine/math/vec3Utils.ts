import { vec3 } from "gl-matrix";
import type { Vec3 } from "../mesh/meshTypes";

export function toVec3(value: vec3): Vec3 {
  return [value[0], value[1], value[2]];
}

export function fromVec3(value: Vec3): vec3 {
  return vec3.fromValues(value[0], value[1], value[2]);
}

export function distanceVec3(a: Vec3, b: Vec3): number {
  return Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]);
}

export function edgeLengthVec3(a: Vec3, b: Vec3): number {
  return distanceVec3(a, b);
}

export function midpointVec3(a: Vec3, b: Vec3): Vec3 {
  return [
    (a[0] + b[0]) * 0.5,
    (a[1] + b[1]) * 0.5,
    (a[2] + b[2]) * 0.5,
  ];
}

export function getStablePerpendicularUnitVector(direction: vec3): vec3 {
  const reference =
    Math.abs(direction[1]) < 0.9
      ? vec3.fromValues(0, 1, 0)
      : vec3.fromValues(1, 0, 0);

  const perpendicular = vec3.cross(vec3.create(), direction, reference);

  if (vec3.length(perpendicular) < 1e-8) {
    return vec3.fromValues(1, 0, 0);
  }

  return vec3.normalize(perpendicular, perpendicular);
}

export function formatVec3(value: Vec3): string {
  return `${value[0].toFixed(3)}, ${value[1].toFixed(3)}, ${value[2].toFixed(
    3,
  )}`;
}
