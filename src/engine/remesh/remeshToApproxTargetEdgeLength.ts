import { readTrianglesFromPositions } from "../geometry/triangleSoup";
import { buildMeshDataFromTriangles } from "../mesh/meshBuild";
import type { MeshData } from "../mesh/meshTypes";
import { splitLongEdgesToTargetLength } from "./splitLongEdgesRemesh";

export function remeshToApproxTargetEdgeLength(
  mesh: MeshData,
  targetEdgeLength: number,
): MeshData {
  if (targetEdgeLength <= 0) {
    throw new Error("Target edge length must be greater than zero.");
  }

  const inputTriangles = readTrianglesFromPositions(mesh.positions);
  const outputTriangles = splitLongEdgesToTargetLength(
    inputTriangles,
    targetEdgeLength,
  );

  return buildMeshDataFromTriangles(mesh.name, outputTriangles);
}

