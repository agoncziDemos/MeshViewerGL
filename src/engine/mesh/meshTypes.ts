export type Vec3 = [number, number, number];

export type MeshBounds = {
  min: Vec3;
  max: Vec3;
  center: Vec3;
  size: Vec3;
  radius: number;
};

export type MeshData = {
  name: string;
  positions: Float32Array;
  normals: Float32Array;
  triangleCount: number;
  vertexCount: number;
  bounds: MeshBounds;
};

export type MeshStats = {
  triangleCount: number;
  vertexCount: number;
  bounds: MeshBounds;
};
