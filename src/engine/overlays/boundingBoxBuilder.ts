import type { MeshBounds } from "../mesh/meshTypes";

export function buildBoundingBoxPositions(bounds: MeshBounds): Float32Array {
  const [minX, minY, minZ] = bounds.min;
  const [maxX, maxY, maxZ] = bounds.max;

  const corners = [
    [minX, minY, minZ],
    [maxX, minY, minZ],
    [maxX, maxY, minZ],
    [minX, maxY, minZ],
    [minX, minY, maxZ],
    [maxX, minY, maxZ],
    [maxX, maxY, maxZ],
    [minX, maxY, maxZ],
  ];

  const edges = [
    [0, 1],
    [1, 2],
    [2, 3],
    [3, 0],

    [4, 5],
    [5, 6],
    [6, 7],
    [7, 4],

    [0, 4],
    [1, 5],
    [2, 6],
    [3, 7],
  ];

  const positions = new Float32Array(edges.length * 2 * 3);
  let offset = 0;

  for (const [startIndex, endIndex] of edges) {
    const start = corners[startIndex];
    const end = corners[endIndex];

    positions[offset] = start[0];
    positions[offset + 1] = start[1];
    positions[offset + 2] = start[2];

    positions[offset + 3] = end[0];
    positions[offset + 4] = end[1];
    positions[offset + 5] = end[2];

    offset += 6;
  }

  return positions;
}
