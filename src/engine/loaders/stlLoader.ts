import { computeMeshBounds } from "../mesh/meshStats";
import type { MeshData } from "../mesh/meshTypes";

const STL_HEADER_BYTES = 80;
const STL_TRIANGLE_COUNT_BYTES = 4;
const STL_TRIANGLE_BYTES = 50;
const STL_FIRST_TRIANGLE_OFFSET = STL_HEADER_BYTES + STL_TRIANGLE_COUNT_BYTES;

export async function loadStlFile(file: File): Promise<MeshData> {
  const buffer = await file.arrayBuffer();
  return parseStl(buffer, file.name);
}

export function parseStl(buffer: ArrayBuffer, name = "mesh.stl"): MeshData {
  if (isBinaryStl(buffer)) {
    return parseBinaryStl(buffer, name);
  }

  return parseAsciiStl(buffer, name);
}

function isBinaryStl(buffer: ArrayBuffer): boolean {
  if (buffer.byteLength < STL_FIRST_TRIANGLE_OFFSET) {
    return false;
  }

  const view = new DataView(buffer);
  const triangleCount = view.getUint32(STL_HEADER_BYTES, true);
  const expectedByteLength =
    STL_FIRST_TRIANGLE_OFFSET + triangleCount * STL_TRIANGLE_BYTES;

  return expectedByteLength === buffer.byteLength;
}

function parseBinaryStl(buffer: ArrayBuffer, name: string): MeshData {
  const view = new DataView(buffer);
  const triangleCount = view.getUint32(STL_HEADER_BYTES, true);
  const vertexCount = triangleCount * 3;

  const positions = new Float32Array(vertexCount * 3);
  const normals = new Float32Array(vertexCount * 3);

  let byteOffset = STL_FIRST_TRIANGLE_OFFSET;
  let vertexOffset = 0;

  for (let triangleIndex = 0; triangleIndex < triangleCount; triangleIndex++) {
    const nx = view.getFloat32(byteOffset, true);
    const ny = view.getFloat32(byteOffset + 4, true);
    const nz = view.getFloat32(byteOffset + 8, true);

    byteOffset += 12;

    for (let vertexIndex = 0; vertexIndex < 3; vertexIndex++) {
      const x = view.getFloat32(byteOffset, true);
      const y = view.getFloat32(byteOffset + 4, true);
      const z = view.getFloat32(byteOffset + 8, true);

      positions[vertexOffset] = x;
      positions[vertexOffset + 1] = y;
      positions[vertexOffset + 2] = z;

      normals[vertexOffset] = nx;
      normals[vertexOffset + 1] = ny;
      normals[vertexOffset + 2] = nz;

      vertexOffset += 3;
      byteOffset += 12;
    }

    byteOffset += 2;
  }

  return createMeshData(name, positions, normals);
}

function parseAsciiStl(buffer: ArrayBuffer, name: string): MeshData {
  const text = new TextDecoder("utf-8").decode(buffer);
  const lines = text.split(/\r?\n/);

  const positions: number[] = [];
  const normals: number[] = [];

  let currentNormal: [number, number, number] = [0, 0, 0];

  for (const rawLine of lines) {
    const line = rawLine.trim();
    const parts = line.split(/\s+/);

    if (parts[0] === "facet" && parts[1] === "normal" && parts.length >= 5) {
      currentNormal = [
        Number(parts[2]),
        Number(parts[3]),
        Number(parts[4]),
      ];
    }

    if (parts[0] === "vertex" && parts.length >= 4) {
      positions.push(Number(parts[1]), Number(parts[2]), Number(parts[3]));
      normals.push(currentNormal[0], currentNormal[1], currentNormal[2]);
    }
  }

  if (positions.length === 0 || positions.length % 9 !== 0) {
    throw new Error("Invalid STL file. Could not parse triangle vertices.");
  }

  return createMeshData(
    name,
    new Float32Array(positions),
    new Float32Array(normals),
  );
}

function createMeshData(
  name: string,
  positions: Float32Array,
  normals: Float32Array,
): MeshData {
  const vertexCount = positions.length / 3;
  const triangleCount = vertexCount / 3;
  const bounds = computeMeshBounds(positions);

  return {
    name,
    positions,
    normals,
    triangleCount,
    vertexCount,
    bounds,
  };
}
