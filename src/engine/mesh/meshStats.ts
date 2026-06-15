import type { MeshBounds, MeshStats } from "./meshTypes";

export function computeMeshBounds(positions: Float32Array): MeshBounds {
  if (positions.length < 3) {
    return {
      min: [0, 0, 0],
      max: [0, 0, 0],
      center: [0, 0, 0],
      size: [0, 0, 0],
      radius: 0,
    };
  }

  let minX = positions[0];
  let minY = positions[1];
  let minZ = positions[2];

  let maxX = positions[0];
  let maxY = positions[1];
  let maxZ = positions[2];

  for (let i = 3; i < positions.length; i += 3) {
    const x = positions[i];
    const y = positions[i + 1];
    const z = positions[i + 2];

    minX = Math.min(minX, x);
    minY = Math.min(minY, y);
    minZ = Math.min(minZ, z);

    maxX = Math.max(maxX, x);
    maxY = Math.max(maxY, y);
    maxZ = Math.max(maxZ, z);
  }

  const sizeX = maxX - minX;
  const sizeY = maxY - minY;
  const sizeZ = maxZ - minZ;

  return {
    min: [minX, minY, minZ],
    max: [maxX, maxY, maxZ],
    center: [
      (minX + maxX) * 0.5,
      (minY + maxY) * 0.5,
      (minZ + maxZ) * 0.5,
    ],
    size: [sizeX, sizeY, sizeZ],
    radius: Math.sqrt(sizeX * sizeX + sizeY * sizeY + sizeZ * sizeZ) * 0.5,
  };
}

export function createMeshStats(
  triangleCount: number,
  vertexCount: number,
  bounds: MeshBounds,
): MeshStats {
  return {
    triangleCount,
    vertexCount,
    bounds,
  };
}
