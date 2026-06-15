import type { Vec3 } from "../mesh/meshTypes";

export type Vector3Like = ArrayLike<number>;

export function appendLinePositions(
  output: number[],
  start: Vector3Like,
  end: Vector3Like,
) {
  output.push(start[0], start[1], start[2]);
  output.push(end[0], end[1], end[2]);
}

export function writeVec3(
  output: Float32Array,
  offset: number,
  value: Vec3,
): number {
  output[offset] = value[0];
  output[offset + 1] = value[1];
  output[offset + 2] = value[2];

  return offset + 3;
}
