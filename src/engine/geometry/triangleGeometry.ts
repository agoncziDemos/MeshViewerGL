import { vec3 } from "gl-matrix";
import { edgeLengthVec3, midpointVec3, toVec3 } from "../math/vec3Utils";
import type { MeshData, Vec3 } from "../mesh/meshTypes";
import type { Triangle } from "./triangleTypes";

const EPSILON = 1e-8;

export type TriangleVertices = {
  a: vec3;
  b: vec3;
  c: vec3;
};

export function getTriangleVertices(
  mesh: MeshData,
  triangleIndex: number,
): TriangleVertices {
  const offset = triangleIndex * 9;

  return {
    a: vec3.fromValues(
      mesh.positions[offset],
      mesh.positions[offset + 1],
      mesh.positions[offset + 2],
    ),
    b: vec3.fromValues(
      mesh.positions[offset + 3],
      mesh.positions[offset + 4],
      mesh.positions[offset + 5],
    ),
    c: vec3.fromValues(
      mesh.positions[offset + 6],
      mesh.positions[offset + 7],
      mesh.positions[offset + 8],
    ),
  };
}

export function getTriangleCentroid({ a, b, c }: TriangleVertices): vec3 {
  return vec3.fromValues(
    (a[0] + b[0] + c[0]) / 3,
    (a[1] + b[1] + c[1]) / 3,
    (a[2] + b[2] + c[2]) / 3,
  );
}

export function getTriangleNormal({ a, b, c }: TriangleVertices): vec3 | null {
  const edgeAB = vec3.subtract(vec3.create(), b, a);
  const edgeAC = vec3.subtract(vec3.create(), c, a);
  const normal = vec3.cross(vec3.create(), edgeAB, edgeAC);

  if (vec3.length(normal) < EPSILON) {
    return null;
  }

  return vec3.normalize(normal, normal);
}

export function getTriangleNormalVec3([a, b, c]: Triangle): Vec3 | null {
  const triangle = {
    a: vec3.fromValues(a[0], a[1], a[2]),
    b: vec3.fromValues(b[0], b[1], b[2]),
    c: vec3.fromValues(c[0], c[1], c[2]),
  };

  const normal = getTriangleNormal(triangle);

  return normal ? toVec3(normal) : null;
}

export function splitTriangleLongestEdge(
  triangle: Triangle,
  targetEdgeLength: number,
): Triangle[] {
  const [a, b, c] = triangle;

  const ab = edgeLengthVec3(a, b);
  const bc = edgeLengthVec3(b, c);
  const ca = edgeLengthVec3(c, a);

  if (ab <= targetEdgeLength && bc <= targetEdgeLength && ca <= targetEdgeLength) {
    return [triangle];
  }

  if (ab >= bc && ab >= ca) {
    const midpoint = midpointVec3(a, b);

    return [
      [a, midpoint, c],
      [midpoint, b, c],
    ];
  }

  if (bc >= ab && bc >= ca) {
    const midpoint = midpointVec3(b, c);

    return [
      [b, midpoint, a],
      [midpoint, c, a],
    ];
  }

  const midpoint = midpointVec3(c, a);

  return [
    [c, midpoint, b],
    [midpoint, a, b],
  ];
}

export function intersectRayTriangle(
  origin: vec3,
  direction: vec3,
  triangle: TriangleVertices,
): number | null {
  const edgeAB = vec3.subtract(vec3.create(), triangle.b, triangle.a);
  const edgeAC = vec3.subtract(vec3.create(), triangle.c, triangle.a);
  const pVector = vec3.cross(vec3.create(), direction, edgeAC);
  const determinant = vec3.dot(edgeAB, pVector);

  if (Math.abs(determinant) < EPSILON) {
    return null;
  }

  const inverseDeterminant = 1 / determinant;
  const tVector = vec3.subtract(vec3.create(), origin, triangle.a);
  const u = vec3.dot(tVector, pVector) * inverseDeterminant;

  if (u < 0 || u > 1) {
    return null;
  }

  const qVector = vec3.cross(vec3.create(), tVector, edgeAB);
  const v = vec3.dot(direction, qVector) * inverseDeterminant;

  if (v < 0 || u + v > 1) {
    return null;
  }

  const distance = vec3.dot(edgeAC, qVector) * inverseDeterminant;

  return distance > EPSILON ? distance : null;
}
