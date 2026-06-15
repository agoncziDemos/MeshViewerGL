import type { Vec3 } from "../mesh/meshTypes";
import type { Triangle } from "./triangleTypes";

export function readTrianglesFromPositions(positions: Float32Array): Triangle[] {
  const triangles: Triangle[] = [];

  for (let i = 0; i < positions.length; i += 9) {
    triangles.push([
      readVec3(positions, i),
      readVec3(positions, i + 3),
      readVec3(positions, i + 6),
    ]);
  }

  return triangles;
}

export function writeTrianglesToPositions(triangles: Triangle[]): Float32Array {
  const positions = new Float32Array(triangles.length * 9);
  let offset = 0;

  for (const [a, b, c] of triangles) {
    offset = writeVec3(positions, offset, a);
    offset = writeVec3(positions, offset, b);
    offset = writeVec3(positions, offset, c);
  }

  return positions;
}

function readVec3(positions: Float32Array, offset: number): Vec3 {
  return [positions[offset], positions[offset + 1], positions[offset + 2]];
}

function writeVec3(
  positions: Float32Array,
  offset: number,
  value: Vec3,
): number {
  positions[offset] = value[0];
  positions[offset + 1] = value[1];
  positions[offset + 2] = value[2];

  return offset + 3;
}
