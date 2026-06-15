import type { ChangeEvent } from "react";

type FileLoaderProps = {
  onFileSelected: (file: File) => void;
};

export function FileLoader({ onFileSelected }: FileLoaderProps) {
  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    onFileSelected(file);
    event.target.value = "";
  }

  return (
    <label className="file-loader">
      <span>Upload STL</span>
      <input type="file" accept=".stl" onChange={handleFileChange} />
    </label>
  );
}
