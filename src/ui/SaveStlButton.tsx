import { exportMeshToAsciiStl } from "../engine/exporters/stlExporter";
import type { MeshData } from "../engine/mesh/meshTypes";

type SaveStlButtonProps = {
  mesh: MeshData | null;
  disabled: boolean;
};

export function SaveStlButton({ mesh, disabled }: SaveStlButtonProps) {
  function handleClick() {
    if (!mesh || disabled) {
      return;
    }

    const stlText = exportMeshToAsciiStl(mesh);
    const blob = new Blob([stlText], {
      type: "model/stl;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = createDownloadName(mesh.name);
    link.click();

    URL.revokeObjectURL(url);
  }

  return (
    <button
      type="button"
      className="save-stl-button"
      disabled={!mesh || disabled}
      onClick={handleClick}
    >
      Save STL
    </button>
  );
}

function createDownloadName(name: string): string {
  const baseName = name.replace(/\.[^.]+$/, "").replace(/[^\w.-]+/g, "_");

  return `${baseName || "mesh"}.stl`;
}
