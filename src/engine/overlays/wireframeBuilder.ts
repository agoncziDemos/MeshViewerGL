import { readTrianglesFromPositions } from "../geometry/triangleSoup";
import { appendLinePositions } from "../geometry/lineGeometry";

export function buildWireframePositions(
  trianglePositions: Float32Array,
): Float32Array {
  const triangles = readTrianglesFromPositions(trianglePositions);
  const positions: number[] = [];

  for (const [a, b, c] of triangles) {
    appendLinePositions(positions, a, b);
    appendLinePositions(positions, b, c);
    appendLinePositions(positions, c, a);
  }

  return new Float32Array(positions);
}
