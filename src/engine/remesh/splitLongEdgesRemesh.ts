import type { Triangle } from "../geometry/triangleTypes";
import { splitTriangleLongestEdge } from "../geometry/triangleGeometry";

export function splitLongEdgesToTargetLength(
  triangles: Triangle[],
  targetEdgeLength: number,
): Triangle[] {
  const outputTriangles: Triangle[] = [];
  const pendingTriangles = [...triangles];

  while (pendingTriangles.length > 0) {
    const triangle = pendingTriangles.pop();

    if (!triangle) {
      continue;
    }

    const splitTriangles = splitTriangleLongestEdge(triangle, targetEdgeLength);

    if (splitTriangles.length === 1) {
      outputTriangles.push(splitTriangles[0]);
    } else {
      pendingTriangles.push(...splitTriangles);
    }
  }

  return outputTriangles;
}
