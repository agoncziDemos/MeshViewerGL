import { vec3 } from "gl-matrix";
import { appendLinePositions } from "../geometry/lineGeometry";
import {
  getTriangleCentroid,
  getTriangleNormal,
  getTriangleVertices,
} from "../geometry/triangleGeometry";
import { getStablePerpendicularUnitVector } from "../math/vec3Utils";
import type { MeshData } from "../mesh/meshTypes";

const DEFAULT_SAMPLE_FRACTION = 1.0;
const MIN_ARROW_LENGTH = 0.001;

export function buildNormalArrowPositions(
  mesh: MeshData,
  sampleFraction = DEFAULT_SAMPLE_FRACTION,
): Float32Array {
  if (mesh.triangleCount === 0) {
    return new Float32Array();
  }

  const triangleIndices = sampleTriangleIndices(
    mesh.triangleCount,
    sampleFraction,
  );

  const arrowLength = Math.max(mesh.bounds.radius * 0.025, MIN_ARROW_LENGTH);
  const headLength = arrowLength * 0.25;
  const headWidth = arrowLength * 0.12;
  const positions: number[] = [];

  for (const triangleIndex of triangleIndices) {
    const triangle = getTriangleVertices(mesh, triangleIndex);
    const normal = getTriangleNormal(triangle);

    if (!normal) {
      continue;
    }

    const centroid = getTriangleCentroid(triangle);
    const tip = vec3.scaleAndAdd(vec3.create(), centroid, normal, arrowLength);

    appendLinePositions(positions, centroid, tip);

    const headBase = vec3.scaleAndAdd(
      vec3.create(),
      tip,
      normal,
      -headLength,
    );

    const tangent = getStablePerpendicularUnitVector(normal);
    const left = vec3.scaleAndAdd(vec3.create(), headBase, tangent, headWidth);
    const right = vec3.scaleAndAdd(vec3.create(), headBase, tangent, -headWidth);

    appendLinePositions(positions, tip, left);
    appendLinePositions(positions, tip, right);
  }

  return new Float32Array(positions);
}

function sampleTriangleIndices(
  triangleCount: number,
  sampleFraction: number,
): number[] {
  const clampedFraction = Math.min(Math.max(sampleFraction, 0), 1);
  const sampleCount = Math.max(1, Math.floor(triangleCount * clampedFraction));

  if (sampleCount >= triangleCount) {
    return Array.from({ length: triangleCount }, (_, index) => index);
  }

  const selected = new Set<number>();
  let seed = triangleCount * 1664525 + 1013904223;

  while (selected.size < sampleCount) {
    seed = nextRandomSeed(seed);
    selected.add(seed % triangleCount);
  }

  return Array.from(selected);
}

function nextRandomSeed(seed: number): number {
  return (seed * 1664525 + 1013904223) >>> 0;
}
