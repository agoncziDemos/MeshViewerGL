import { mat3, mat4, vec3 } from "gl-matrix";
import type { MeshData, Vec3 } from "../mesh/meshTypes";
import { buildBoundingBoxPositions } from "../overlays/boundingBoxBuilder";
import { buildNormalArrowPositions } from "../overlays/normalArrowBuilder";
import { buildWireframePositions } from "../overlays/wireframeBuilder";
import {
  lineFragmentShaderSource,
  lineVertexShaderSource,
  meshFragmentShaderSource,
  meshVertexShaderSource,
} from "../shaders/solidShader";
import { createProgram, getUniformLocation } from "./glUtils";

export type ShaderMode = "solid" | "height" | "xray" | "clipping";

export type RenderOptions = {
  shaderMode: ShaderMode;
  showWireframe: boolean;
  showBoundingBox: boolean;
  showNormals: boolean;
  clipRatio: number;
  measurementPoints: Vec3[];
  lightDirection: Vec3;
};

type MeshUniforms = {
  model: WebGLUniformLocation;
  view: WebGLUniformLocation;
  projection: WebGLUniformLocation;
  normalMatrix: WebGLUniformLocation;
  baseColor: WebGLUniformLocation;
  lightDirection: WebGLUniformLocation;
  cameraPosition: WebGLUniformLocation;
  boundsMin: WebGLUniformLocation;
  boundsMax: WebGLUniformLocation;
  shaderMode: WebGLUniformLocation;
  clipZ: WebGLUniformLocation;
};

type LineUniforms = {
  view: WebGLUniformLocation;
  projection: WebGLUniformLocation;
  color: WebGLUniformLocation;
};

type MeshGpuResources = {
  vao: WebGLVertexArrayObject;
  positionBuffer: WebGLBuffer;
  normalBuffer: WebGLBuffer;
  wireframeBuffer: WebGLBuffer;
  boundingBoxBuffer: WebGLBuffer;
  normalArrowBuffer: WebGLBuffer;
  vertexCount: number;
  wireframeVertexCount: number;
  boundingBoxVertexCount: number;
  normalArrowVertexCount: number;
  boundsMin: Vec3;
  boundsMax: Vec3;
};

export type RenderCamera = {
  view: mat4;
  projection: mat4;
  position: vec3;
};

const SHADER_MODE_TO_ID: Record<ShaderMode, number> = {
  solid: 0,
  height: 1,
  xray: 2,
  clipping: 3,
};

export class WebglRenderer {
  private readonly gl: WebGL2RenderingContext;
  private readonly meshProgram: WebGLProgram;
  private readonly lineProgram: WebGLProgram;
  private readonly meshUniforms: MeshUniforms;
  private readonly lineUniforms: LineUniforms;
  private readonly dynamicBuffer: WebGLBuffer;

  private meshResources: MeshGpuResources | null = null;
  private readonly model = mat4.create();
  private readonly normalMatrix = mat3.create();

  constructor(canvas: HTMLCanvasElement) {
    const gl = canvas.getContext("webgl2", {
      antialias: true,
      alpha: false,
    });

    if (!gl) {
      throw new Error("WebGL2 is not supported in this browser.");
    }

    const dynamicBuffer = gl.createBuffer();

    if (!dynamicBuffer) {
      throw new Error("Failed to create dynamic WebGL buffer.");
    }

    this.gl = gl;
    this.dynamicBuffer = dynamicBuffer;

    this.meshProgram = createProgram(
      gl,
      meshVertexShaderSource,
      meshFragmentShaderSource,
    );

    this.lineProgram = createProgram(
      gl,
      lineVertexShaderSource,
      lineFragmentShaderSource,
    );

    this.meshUniforms = {
      model: getUniformLocation(gl, this.meshProgram, "uModel"),
      view: getUniformLocation(gl, this.meshProgram, "uView"),
      projection: getUniformLocation(gl, this.meshProgram, "uProjection"),
      normalMatrix: getUniformLocation(gl, this.meshProgram, "uNormalMatrix"),
      baseColor: getUniformLocation(gl, this.meshProgram, "uBaseColor"),
      lightDirection: getUniformLocation(gl, this.meshProgram, "uLightDirection"),
      cameraPosition: getUniformLocation(gl, this.meshProgram, "uCameraPosition"),
      boundsMin: getUniformLocation(gl, this.meshProgram, "uBoundsMin"),
      boundsMax: getUniformLocation(gl, this.meshProgram, "uBoundsMax"),
      shaderMode: getUniformLocation(gl, this.meshProgram, "uShaderMode"),
      clipZ: getUniformLocation(gl, this.meshProgram, "uClipZ"),
    };

    this.lineUniforms = {
      view: getUniformLocation(gl, this.lineProgram, "uView"),
      projection: getUniformLocation(gl, this.lineProgram, "uProjection"),
      color: getUniformLocation(gl, this.lineProgram, "uColor"),
    };

    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.CULL_FACE);
    gl.cullFace(gl.BACK);
    gl.clearColor(0.965, 0.976, 0.988, 1.0);
  }

  setMesh(mesh: MeshData | null) {
    this.disposeMesh();

    if (!mesh) {
      return;
    }

    const gl = this.gl;
    const vao = gl.createVertexArray();
    const positionBuffer = gl.createBuffer();
    const normalBuffer = gl.createBuffer();
    const wireframeBuffer = gl.createBuffer();
    const boundingBoxBuffer = gl.createBuffer();
    const normalArrowBuffer = gl.createBuffer();

    if (
      !vao ||
      !positionBuffer ||
      !normalBuffer ||
      !wireframeBuffer ||
      !boundingBoxBuffer ||
      !normalArrowBuffer
    ) {
      throw new Error("Failed to create mesh GPU resources.");
    }

    const wireframePositions = buildWireframePositions(mesh.positions);
    const boundingBoxPositions = buildBoundingBoxPositions(mesh.bounds);
    const normalArrowPositions = buildNormalArrowPositions(mesh);

    gl.bindVertexArray(vao);

    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, mesh.positions, gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, mesh.normals, gl.STATIC_DRAW);
    gl.enableVertexAttribArray(1);
    gl.vertexAttribPointer(1, 3, gl.FLOAT, false, 0, 0);

    gl.bindVertexArray(null);

    gl.bindBuffer(gl.ARRAY_BUFFER, wireframeBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, wireframePositions, gl.STATIC_DRAW);

    gl.bindBuffer(gl.ARRAY_BUFFER, boundingBoxBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, boundingBoxPositions, gl.STATIC_DRAW);

    gl.bindBuffer(gl.ARRAY_BUFFER, normalArrowBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, normalArrowPositions, gl.STATIC_DRAW);

    gl.bindBuffer(gl.ARRAY_BUFFER, null);

    this.meshResources = {
      vao,
      positionBuffer,
      normalBuffer,
      wireframeBuffer,
      boundingBoxBuffer,
      normalArrowBuffer,
      vertexCount: mesh.vertexCount,
      wireframeVertexCount: wireframePositions.length / 3,
      boundingBoxVertexCount: boundingBoxPositions.length / 3,
      normalArrowVertexCount: normalArrowPositions.length / 3,
      boundsMin: mesh.bounds.min,
      boundsMax: mesh.bounds.max,
    };
  }

  resizeToDisplaySize() {
    const canvas = this.gl.canvas as HTMLCanvasElement;
    const pixelRatio = window.devicePixelRatio || 1;
    const width = Math.max(1, Math.floor(canvas.clientWidth * pixelRatio));
    const height = Math.max(1, Math.floor(canvas.clientHeight * pixelRatio));

    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }

    this.gl.viewport(0, 0, canvas.width, canvas.height);
  }

  render(camera: RenderCamera, options: RenderOptions) {
    const gl = this.gl;

    this.resizeToDisplaySize();
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    if (!this.meshResources) {
      return;
    }

    mat4.identity(this.model);
    mat3.normalFromMat4(this.normalMatrix, this.model);

    this.renderMesh(camera, options);

    if (options.showWireframe) {
      this.renderStaticLines(
        camera,
        this.meshResources.wireframeBuffer,
        this.meshResources.wireframeVertexCount,
        [0.04, 0.07, 0.11, 0.55],
      );
    }

    if (options.showBoundingBox) {
      this.renderStaticLines(
        camera,
        this.meshResources.boundingBoxBuffer,
        this.meshResources.boundingBoxVertexCount,
        [0.95, 0.52, 0.12, 1.0],
      );
    }

    if (options.showNormals) {
      this.renderStaticLines(
        camera,
        this.meshResources.normalArrowBuffer,
        this.meshResources.normalArrowVertexCount,
        [0.88, 0.15, 0.15, 1.0],
      );
    }

    this.renderMeasurement(camera, options.measurementPoints);
  }

  dispose() {
    this.disposeMesh();
    this.gl.deleteBuffer(this.dynamicBuffer);
    this.gl.deleteProgram(this.meshProgram);
    this.gl.deleteProgram(this.lineProgram);
  }

  private renderMesh(camera: RenderCamera, options: RenderOptions) {
    if (!this.meshResources) {
      return;
    }

    const gl = this.gl;
    const clipZ =
      this.meshResources.boundsMin[2] +
      (this.meshResources.boundsMax[2] - this.meshResources.boundsMin[2]) *
        options.clipRatio;

    if (options.shaderMode === "xray") {
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
      gl.depthMask(false);
      gl.disable(gl.CULL_FACE);
    } else {
      gl.disable(gl.BLEND);
      gl.depthMask(true);
      gl.enable(gl.CULL_FACE);
    }

    gl.useProgram(this.meshProgram);
    gl.bindVertexArray(this.meshResources.vao);

    gl.uniformMatrix4fv(this.meshUniforms.model, false, this.model);
    gl.uniformMatrix4fv(this.meshUniforms.view, false, camera.view);
    gl.uniformMatrix4fv(this.meshUniforms.projection, false, camera.projection);
    gl.uniformMatrix3fv(
      this.meshUniforms.normalMatrix,
      false,
      this.normalMatrix,
    );

    gl.uniform3f(this.meshUniforms.baseColor, 0.3, 0.48, 0.72);
    gl.uniform3fv(this.meshUniforms.lightDirection, options.lightDirection);
    gl.uniform3fv(this.meshUniforms.cameraPosition, camera.position);
    gl.uniform3fv(this.meshUniforms.boundsMin, this.meshResources.boundsMin);
    gl.uniform3fv(this.meshUniforms.boundsMax, this.meshResources.boundsMax);
    gl.uniform1i(
      this.meshUniforms.shaderMode,
      SHADER_MODE_TO_ID[options.shaderMode],
    );
    gl.uniform1f(this.meshUniforms.clipZ, clipZ);

    gl.drawArrays(gl.TRIANGLES, 0, this.meshResources.vertexCount);

    gl.bindVertexArray(null);
    gl.depthMask(true);
    gl.disable(gl.BLEND);
    gl.enable(gl.CULL_FACE);
  }

  private renderStaticLines(
    camera: RenderCamera,
    buffer: WebGLBuffer,
    vertexCount: number,
    color: [number, number, number, number],
  ) {
    const gl = this.gl;

    gl.useProgram(this.lineProgram);
    gl.uniformMatrix4fv(this.lineUniforms.view, false, camera.view);
    gl.uniformMatrix4fv(this.lineUniforms.projection, false, camera.projection);
    gl.uniform4fv(this.lineUniforms.color, color);

    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0);
    gl.drawArrays(gl.LINES, 0, vertexCount);
    gl.disableVertexAttribArray(0);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
  }

  private renderMeasurement(camera: RenderCamera, points: Vec3[]) {
    if (points.length === 0) {
      return;
    }

    const gl = this.gl;
    const pointPositions = new Float32Array(points.flat());

    gl.useProgram(this.lineProgram);
    gl.uniformMatrix4fv(this.lineUniforms.view, false, camera.view);
    gl.uniformMatrix4fv(this.lineUniforms.projection, false, camera.projection);

    gl.bindBuffer(gl.ARRAY_BUFFER, this.dynamicBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, pointPositions, gl.DYNAMIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0);

    gl.disable(gl.DEPTH_TEST);
    gl.uniform4f(this.lineUniforms.color, 0.9, 0.12, 0.12, 1.0);
    gl.drawArrays(gl.POINTS, 0, points.length);

    if (points.length === 2) {
      gl.uniform4f(this.lineUniforms.color, 0.9, 0.12, 0.12, 1.0);
      gl.drawArrays(gl.LINES, 0, 2);
    }

    gl.enable(gl.DEPTH_TEST);
    gl.disableVertexAttribArray(0);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
  }

  private disposeMesh() {
    if (!this.meshResources) {
      return;
    }

    const gl = this.gl;

    gl.deleteVertexArray(this.meshResources.vao);
    gl.deleteBuffer(this.meshResources.positionBuffer);
    gl.deleteBuffer(this.meshResources.normalBuffer);
    gl.deleteBuffer(this.meshResources.wireframeBuffer);
    gl.deleteBuffer(this.meshResources.boundingBoxBuffer);
    gl.deleteBuffer(this.meshResources.normalArrowBuffer);

    this.meshResources = null;
  }
}
