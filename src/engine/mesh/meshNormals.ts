import { getTriangleNormalVec3 } from "../geometry/triangleGeometry";
import { readTrianglesFromPositions } from "../geometry/triangleSoup";
import type { Vec3 } from "./meshTypes";

const FALLBACK_NORMAL: Vec3 = [0, 0, 1];

export function buildFlatNormalsFromPositions(
  positions: Float32Array,
): Float32Array {
  const triangles = readTrianglesFromPositions(positions);
  const normals = new Float32Array(positions.length);
  let offset = 0;

  for (const triangle of triangles) {
    const normal = getTriangleNormalVec3(triangle) ?? FALLBACK_NORMAL;

    offset = writeTriangleNormal(normals, offset, normal);
  }

  return normals;
}

function writeTriangleNormal(
  normals: Float32Array,
  offset: number,
  normal: Vec3,
): number {
  for (let vertex = 0; vertex < 3; vertex++) {
    normals[offset] = normal[0];
    normals[offset + 1] = normal[1];
    normals[offset + 2] = normal[2];
    offset += 3;
  }

  return offset;
}
