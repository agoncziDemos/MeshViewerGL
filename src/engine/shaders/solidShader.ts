export const meshVertexShaderSource = `#version 300 es
precision highp float;

layout(location = 0) in vec3 aPosition;
layout(location = 1) in vec3 aNormal;

uniform mat4 uModel;
uniform mat4 uView;
uniform mat4 uProjection;
uniform mat3 uNormalMatrix;

out vec3 vNormal;
out vec3 vWorldPosition;

void main() {
  vec4 worldPosition = uModel * vec4(aPosition, 1.0);

  vWorldPosition = worldPosition.xyz;
  vNormal = normalize(uNormalMatrix * aNormal);

  gl_Position = uProjection * uView * worldPosition;
}
`;

export const meshFragmentShaderSource = `#version 300 es
precision highp float;

in vec3 vNormal;
in vec3 vWorldPosition;

uniform vec3 uBaseColor;
uniform vec3 uLightDirection;
uniform vec3 uCameraPosition;
uniform vec3 uBoundsMin;
uniform vec3 uBoundsMax;
uniform int uShaderMode;
uniform float uClipZ;

out vec4 outColor;

vec3 solidColor() {
  vec3 normal = normalize(vNormal);
  vec3 lightDirection = normalize(uLightDirection);
  vec3 viewDirection = normalize(uCameraPosition - vWorldPosition);

  float diffuse = max(dot(normal, lightDirection), 0.0);
  vec3 halfVector = normalize(lightDirection + viewDirection);
  float specular = pow(max(dot(normal, halfVector), 0.0), 48.0);

  vec3 ambientColor = uBaseColor * 0.28;
  vec3 diffuseColor = uBaseColor * diffuse * 0.72;
  vec3 specularColor = vec3(1.0) * specular * 0.18;

  return ambientColor + diffuseColor + specularColor;
}

vec3 heightColor() {
  float heightRange = max(uBoundsMax.z - uBoundsMin.z, 0.000001);
  float t = clamp((vWorldPosition.z - uBoundsMin.z) / heightRange, 0.0, 1.0);

  vec3 lowColor = vec3(0.16, 0.30, 0.70);
  vec3 midColor = vec3(0.20, 0.70, 0.55);
  vec3 highColor = vec3(0.95, 0.72, 0.20);

  if (t < 0.5) {
    return mix(lowColor, midColor, t * 2.0);
  }

  return mix(midColor, highColor, (t - 0.5) * 2.0);
}

void main() {
  if (uShaderMode == 3 && vWorldPosition.z > uClipZ) {
    discard;
  }

  if (uShaderMode == 1) {
    outColor = vec4(heightColor(), 1.0);
    return;
  }

  if (uShaderMode == 2) {
    outColor = vec4(solidColor(), 0.38);
    return;
  }

  outColor = vec4(solidColor(), 1.0);
}
`;

export const lineVertexShaderSource = `#version 300 es
precision highp float;

layout(location = 0) in vec3 aPosition;

uniform mat4 uView;
uniform mat4 uProjection;

void main() {
  gl_Position = uProjection * uView * vec4(aPosition, 1.0);
  gl_PointSize = 9.0;
}
`;

export const lineFragmentShaderSource = `#version 300 es
precision highp float;

uniform vec4 uColor;

out vec4 outColor;

void main() {
  outColor = uColor;
}
`;
