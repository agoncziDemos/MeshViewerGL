import { quat, vec3 } from "gl-matrix";
import type { MeshData } from "../mesh/meshTypes";

export type CameraState = {
  orientation: quat;
  distance: number;
  target: vec3;
};

const MIN_CAMERA_DISTANCE = 0.01;
const ORBIT_SPEED = 0.006;
const PAN_SPEED = 0.0015;
const ZOOM_SPEED = 0.001;

/*
  Change these if the drag direction feels backwards.

  1 keeps the current direction.
  -1 flips that axis.
*/
const ORBIT_X_SIGN = -1;
const ORBIT_Y_SIGN = -1;

export function createInitialCamera(mesh: MeshData | null): CameraState {
  const radius = mesh ? Math.max(mesh.bounds.radius, MIN_CAMERA_DISTANCE) : 4;
  const center = mesh ? vec3.fromValues(...mesh.bounds.center) : vec3.create();
  const orientation = quat.create();

  applyWorldRotation(orientation, [0, 1, 0], Math.PI * 0.25);
  applyWorldRotation(orientation, getCameraRight({ orientation, distance: 1, target: center }), -Math.PI * 0.18);

  return {
    orientation,
    distance: radius * 2.6,
    target: center,
  };
}

export function getCameraPosition(camera: CameraState): vec3 {
  const offset = vec3.fromValues(0, 0, camera.distance);

  vec3.transformQuat(offset, offset, camera.orientation);
  vec3.add(offset, offset, camera.target);

  return offset;
}

export function getCameraUp(camera: CameraState): vec3 {
  const up = vec3.fromValues(0, 1, 0);

  vec3.transformQuat(up, up, camera.orientation);

  return up;
}

export function orbitCamera(
  camera: CameraState,
  deltaX: number,
  deltaY: number,
): CameraState {
  const orientation = quat.clone(camera.orientation);

  applyWorldRotation(
    orientation,
    [0, 1, 0],
    deltaX * ORBIT_SPEED * ORBIT_X_SIGN,
  );

  applyWorldRotation(
    orientation,
    getCameraRight({ ...camera, orientation }),
    deltaY * ORBIT_SPEED * ORBIT_Y_SIGN,
  );

  quat.normalize(orientation, orientation);

  return {
    ...camera,
    orientation,
  };
}

export function panCamera(
  camera: CameraState,
  deltaX: number,
  deltaY: number,
): CameraState {
  const panScale = camera.distance * PAN_SPEED;
  const right = getCameraRight(camera);
  const up = getCameraUp(camera);
  const pan = vec3.create();

  vec3.scaleAndAdd(pan, pan, right, deltaX * panScale);
  vec3.scaleAndAdd(pan, pan, up, -deltaY * panScale);

  const target = vec3.clone(camera.target);
  vec3.add(target, target, pan);

  return {
    ...camera,
    target,
  };
}

export function zoomCamera(camera: CameraState, deltaY: number): CameraState {
  const zoomFactor = Math.exp(deltaY * ZOOM_SPEED);

  return {
    ...camera,
    distance: Math.max(MIN_CAMERA_DISTANCE, camera.distance * zoomFactor),
  };
}

function getCameraRight(camera: CameraState): vec3 {
  const right = vec3.fromValues(1, 0, 0);

  vec3.transformQuat(right, right, camera.orientation);

  return right;
}

function applyWorldRotation(
  orientation: quat,
  axis: vec3 | [number, number, number],
  angle: number,
) {
  const rotation = quat.setAxisAngle(quat.create(), axis, angle);

  quat.multiply(orientation, rotation, orientation);
}
