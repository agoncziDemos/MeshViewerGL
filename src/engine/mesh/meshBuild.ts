import { writeTrianglesToPositions } from "../geometry/triangleSoup";
import type { Triangle } from "../geometry/triangleTypes";
import { computeMeshBounds } from "./meshStats";
import type { MeshData } from "./meshTypes";
import { buildFlatNormalsFromPositions } from "./meshNormals";

export function buildMeshDataFromPositions(
  name: string,
  positions: Float32Array,
  normals = buildFlatNormalsFromPositions(positions),
): MeshData {
  const vertexCount = positions.length / 3;
  const triangleCount = vertexCount / 3;

  return {
    name,
    positions,
    normals,
    vertexCount,
    triangleCount,
    bounds: computeMeshBounds(positions),
  };
}

export function buildMeshDataFromTriangles(
  name: string,
  triangles: Triangle[],
): MeshData {
  return buildMeshDataFromPositions(name, writeTrianglesToPositions(triangles));
}
