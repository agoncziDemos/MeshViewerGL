import { formatVec3 } from "../engine/math/vec3Utils";
import type { MeshData } from "../engine/mesh/meshTypes";
import { formatNumber } from "./formatters";

type MeshStatsPanelProps = {
  mesh: MeshData | null;
};

export function MeshStatsPanel({ mesh }: MeshStatsPanelProps) {
  if (!mesh) {
    return (
      <aside className="stats-panel">
        <h2>Mesh Stats</h2>
        <p className="empty-state">No STL loaded yet.</p>
      </aside>
    );
  }

  return (
    <aside className="stats-panel">
      <h2>Mesh Stats</h2>

      <div className="stat-row">
        <span>Name</span>
        <strong>{mesh.name}</strong>
      </div>

      <div className="stat-row">
        <span>Triangles</span>
        <strong>{mesh.triangleCount.toLocaleString()}</strong>
      </div>

      <div className="stat-row">
        <span>Vertices</span>
        <strong>{mesh.vertexCount.toLocaleString()}</strong>
      </div>

      <div className="stat-group">
        <h3>Bounds</h3>
        <p>
          <span>Min:</span> {formatVec3(mesh.bounds.min)}
        </p>
        <p>
          <span>Max:</span> {formatVec3(mesh.bounds.max)}
        </p>
        <p>
          <span>Center:</span> {formatVec3(mesh.bounds.center)}
        </p>
        <p>
          <span>Size:</span> {formatVec3(mesh.bounds.size)}
        </p>
        <p>
          <span>Radius:</span> {formatNumber(mesh.bounds.radius)}
        </p>
      </div>
    </aside>
  );
}
