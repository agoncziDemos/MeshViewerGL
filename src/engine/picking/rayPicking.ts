import { mat4, vec3, vec4 } from "gl-matrix";
import {
  getTriangleNormal,
  getTriangleVertices,
  intersectRayTriangle,
} from "../geometry/triangleGeometry";
import type { MeshData, Vec3 } from "../mesh/meshTypes";
import { toVec3 } from "../math/vec3Utils";

export type PickRay = {
  origin: vec3;
  direction: vec3;
};

export type PickResult = {
  triangleIndex: number;
  position: Vec3;
  normal: Vec3;
  distance: number;
};

const EPSILON = 1e-8;

export function createPickRay(
  canvas: HTMLCanvasElement,
  clientX: number,
  clientY: number,
  view: mat4,
  projection: mat4,
): PickRay | null {
  const rect = canvas.getBoundingClientRect();

  const normalizedX = ((clientX - rect.left) / rect.width) * 2 - 1;
  const normalizedY = -(((clientY - rect.top) / rect.height) * 2 - 1);

  const viewProjection = mat4.multiply(mat4.create(), projection, view);
  const inverseViewProjection = mat4.invert(mat4.create(), viewProjection);

  if (!inverseViewProjection) {
    return null;
  }

  const nearPoint = unprojectPoint(
    normalizedX,
    normalizedY,
    -1,
    inverseViewProjection,
  );

  const farPoint = unprojectPoint(
    normalizedX,
    normalizedY,
    1,
    inverseViewProjection,
  );

  if (!nearPoint || !farPoint) {
    return null;
  }

  const direction = vec3.normalize(
    vec3.create(),
    vec3.subtract(vec3.create(), farPoint, nearPoint),
  );

  return {
    origin: nearPoint,
    direction,
  };
}

export function pickMeshTriangle(mesh: MeshData, ray: PickRay): PickResult | null {
  let closestPick: PickResult | null = null;

  for (let triangleIndex = 0; triangleIndex < mesh.triangleCount; triangleIndex++) {
    const triangle = getTriangleVertices(mesh, triangleIndex);
    const distance = intersectRayTriangle(ray.origin, ray.direction, triangle);

    if (distance === null) {
      continue;
    }

    if (closestPick && distance >= closestPick.distance) {
      continue;
    }

    const normal = getTriangleNormal(triangle);

    if (!normal) {
      continue;
    }

    const position = vec3.scaleAndAdd(
      vec3.create(),
      ray.origin,
      ray.direction,
      distance,
    );

    closestPick = {
      triangleIndex,
      position: toVec3(position),
      normal: toVec3(normal),
      distance,
    };
  }

  return closestPick;
}

function unprojectPoint(
  normalizedX: number,
  normalizedY: number,
  normalizedZ: number,
  inverseViewProjection: mat4,
): vec3 | null {
  const point = vec4.fromValues(normalizedX, normalizedY, normalizedZ, 1);

  vec4.transformMat4(point, point, inverseViewProjection);

  if (Math.abs(point[3]) < EPSILON) {
    return null;
  }

  return vec3.fromValues(point[0] / point[3], point[1] / point[3], point[2] / point[3]);
}
