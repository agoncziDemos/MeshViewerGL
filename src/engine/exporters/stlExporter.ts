import type { MeshData } from "../mesh/meshTypes";

export function exportMeshToAsciiStl(mesh: MeshData): string {
  const solidName = sanitizeStlName(mesh.name);
  const lines = [`solid ${solidName}`];
  const positions = mesh.positions;

  for (let i = 0; i < positions.length; i += 9) {
    const ax = positions[i];
    const ay = positions[i + 1];
    const az = positions[i + 2];

    const bx = positions[i + 3];
    const by = positions[i + 4];
    const bz = positions[i + 5];

    const cx = positions[i + 6];
    const cy = positions[i + 7];
    const cz = positions[i + 8];

    const normal = computeFacetNormal(ax, ay, az, bx, by, bz, cx, cy, cz);

    lines.push(
      `  facet normal ${formatNumber(normal.x)} ${formatNumber(
        normal.y,
      )} ${formatNumber(normal.z)}`,
      "    outer loop",
      `      vertex ${formatNumber(ax)} ${formatNumber(ay)} ${formatNumber(az)}`,
      `      vertex ${formatNumber(bx)} ${formatNumber(by)} ${formatNumber(bz)}`,
      `      vertex ${formatNumber(cx)} ${formatNumber(cy)} ${formatNumber(cz)}`,
      "    endloop",
      "  endfacet",
    );
  }

  lines.push(`endsolid ${solidName}`);

  return `${lines.join("\n")}\n`;
}

function computeFacetNormal(
  ax: number,
  ay: number,
  az: number,
  bx: number,
  by: number,
  bz: number,
  cx: number,
  cy: number,
  cz: number,
) {
  const abx = bx - ax;
  const aby = by - ay;
  const abz = bz - az;

  const acx = cx - ax;
  const acy = cy - ay;
  const acz = cz - az;

  const nx = aby * acz - abz * acy;
  const ny = abz * acx - abx * acz;
  const nz = abx * acy - aby * acx;

  const length = Math.hypot(nx, ny, nz);

  if (length === 0) {
    return { x: 0, y: 0, z: 0 };
  }

  return {
    x: nx / length,
    y: ny / length,
    z: nz / length,
  };
}

function sanitizeStlName(name: string): string {
  return name.replace(/\.[^.]+$/, "").replace(/[^\w.-]+/g, "_") || "mesh";
}

function formatNumber(value: number): string {
  return Number.isFinite(value) ? value.toPrecision(8) : "0";
}
