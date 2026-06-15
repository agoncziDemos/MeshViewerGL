import { useRef, useState } from "react";
import "./App.css";
import type { MeshData } from "./engine/mesh/meshTypes";
import { FileLoader } from "./ui/FileLoader";
import { MeshStatsPanel } from "./ui/MeshStatsPanel";
import { SampleStlMenu, type SampleStlOption } from "./ui/SampleStlMenu";
import { ViewerCanvas } from "./ui/ViewerCanvas";

type WorkerSuccessResponse = {
  type: "success";
  mesh: MeshData;
};

type WorkerErrorResponse = {
  type: "error";
  message: string;
};

type MeshWorkerResponse = WorkerSuccessResponse | WorkerErrorResponse;

const SAMPLE_STLS: SampleStlOption[] = [
  {
    label: "Gyroid",
    path: `${import.meta.env.BASE_URL}samples/Gyroid.stl`,
  },
  {
    label: "Stanford Bunny",
    path: `${import.meta.env.BASE_URL}samples/Stanford_Bunny.stl`,
  },
];

function App() {
  const clearProcessingAfterViewerUpdateRef = useRef(false);

  const [sourceMesh, setSourceMesh] = useState<MeshData | null>(null);
  const [mesh, setMesh] = useState<MeshData | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isProcessingMesh, setIsProcessingMesh] = useState(false);
  const [processingTitle, setProcessingTitle] = useState<string | null>(null);
  const [processingDetail, setProcessingDetail] = useState<string | null>(null);
  const [remeshTargetEdgeLength, setRemeshTargetEdgeLength] = useState(1.0);
  const [viewResetKey, setViewResetKey] = useState(0);

  async function handleFileSelected(file: File) {
    try {
      setErrorMessage(null);
      setIsProcessingMesh(true);
      setProcessingTitle("Loading STL");
      setProcessingDetail(file.name);

      await waitForProcessingOverlayPaint();

      const loadedMesh = await loadStlFileInWorker(file);

      clearProcessingAfterViewerUpdateRef.current = true;
      setSourceMesh(loadedMesh);
      setMesh(loadedMesh);
      setViewResetKey((value) => value + 1);
    } catch (error) {
      clearProcessingAfterViewerUpdateRef.current = false;
      setSourceMesh(null);
      setMesh(null);
      setErrorMessage(
        error instanceof Error ? error.message : "Failed to load STL file.",
      );
      clearProcessingState();
    }
  }

  async function handleSampleSelected(sample: SampleStlOption) {
    try {
      setErrorMessage(null);
      setIsProcessingMesh(true);
      setProcessingTitle("Loading Sample STL");
      setProcessingDetail(sample.label);

      await waitForProcessingOverlayPaint();

      const loadedMesh = await loadSampleStlInWorker(sample);

      clearProcessingAfterViewerUpdateRef.current = true;
      setSourceMesh(loadedMesh);
      setMesh(loadedMesh);
      setViewResetKey((value) => value + 1);
    } catch (error) {
      clearProcessingAfterViewerUpdateRef.current = false;
      setSourceMesh(null);
      setMesh(null);
      setErrorMessage(
        error instanceof Error ? error.message : "Failed to load sample STL.",
      );
      clearProcessingState();
    }
  }

  async function handleRemesh() {
    if (!sourceMesh) {
      return;
    }

    try {
      setErrorMessage(null);
      setIsProcessingMesh(true);
      setProcessingTitle("Remeshing");
      setProcessingDetail(
        `${sourceMesh.name}, target edge ${remeshTargetEdgeLength.toFixed(
          1,
        )} mm`,
      );

      await waitForProcessingOverlayPaint();

      const remeshedMesh = await remeshMeshInWorker(
        sourceMesh,
        remeshTargetEdgeLength,
      );

      clearProcessingAfterViewerUpdateRef.current = true;
      setMesh(remeshedMesh);
    } catch (error) {
      clearProcessingAfterViewerUpdateRef.current = false;
      setErrorMessage(
        error instanceof Error ? error.message : "Failed to remesh STL file.",
      );
      clearProcessingState();
    }
  }

  async function handleResetRemesh() {
    if (!sourceMesh || isProcessingMesh) {
      return;
    }

    try {
      setErrorMessage(null);
      setIsProcessingMesh(true);
      setProcessingTitle("Resetting Mesh");
      setProcessingDetail(sourceMesh.name);

      await waitForProcessingOverlayPaint();

      clearProcessingAfterViewerUpdateRef.current = true;
      setMesh(sourceMesh);
    } catch (error) {
      clearProcessingAfterViewerUpdateRef.current = false;
      setErrorMessage(
        error instanceof Error ? error.message : "Failed to reset mesh.",
      );
      clearProcessingState();
    }
  }

  function handleViewerMeshApplied() {
    if (!clearProcessingAfterViewerUpdateRef.current) {
      return;
    }

    clearProcessingAfterViewerUpdateRef.current = false;
    clearProcessingState();
  }

  function clearProcessingState() {
    setIsProcessingMesh(false);
    setProcessingTitle(null);
    setProcessingDetail(null);
  }

  return (
    <main className="app">
      <section className="viewer-layout">
        <div className="viewer-panel">
          <header className="app-header">
            <div>
                            <div className="app-title-row">
                <h1>MeshViewerGL</h1>

                <span
                  className="app-info"
                  tabIndex={0}
                  aria-label="MeshViewerGL information"
                >
                  i
                  <span className="app-info-tooltip">
                    MeshViewerGL is a raw WebGL2 STL inspection viewer. Load an
                    STL, inspect mesh statistics, orbit the model, toggle
                    wireframe, normals, bounding box, and measurement overlays,
                    switch shader modes, and remesh the displayed mesh by target
                    edge length.
                  </span>
                </span>
              </div>
              <p>STL mesh viewer and inspection tool.</p>
            </div>

            <div className="header-actions">
              <FileLoader onFileSelected={handleFileSelected} />

              <SampleStlMenu
                samples={SAMPLE_STLS}
                disabled={isProcessingMesh}
                onSampleSelected={handleSampleSelected}
              />
            </div>
          </header>

          <div
            className={
              isProcessingMesh ? "viewer-stage processing" : "viewer-stage"
            }
          >
            <ViewerCanvas
              mesh={mesh}
              viewResetKey={viewResetKey}
              isProcessingMesh={isProcessingMesh}
              remeshTargetEdgeLength={remeshTargetEdgeLength}
              canResetRemesh={Boolean(sourceMesh) && mesh !== sourceMesh && !isProcessingMesh}
              onRemesh={handleRemesh}
              onResetRemesh={handleResetRemesh}
              onRemeshTargetEdgeLengthChange={setRemeshTargetEdgeLength}
              onViewerMeshApplied={handleViewerMeshApplied}
            />

            {isProcessingMesh && (
              <div className="mesh-loading-overlay">
                <div className="mesh-loading-card">
                  <div className="mesh-loading-spinner" />
                  <div>
                    <h2>{processingTitle ?? "Processing mesh"}</h2>
                    <p>{processingDetail ?? "Working..."}</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {errorMessage && <p className="error-message">{errorMessage}</p>}
        </div>

        <MeshStatsPanel mesh={mesh} />
      </section>
    </main>
  );
}

async function loadStlFileInWorker(file: File): Promise<MeshData> {
  const buffer = await file.arrayBuffer();

  return parseStlBufferInWorker(file.name, buffer);
}

async function loadSampleStlInWorker(sample: SampleStlOption): Promise<MeshData> {
  const response = await fetch(sample.path);

  if (!response.ok) {
    throw new Error(`Failed to load sample STL: ${sample.label}`);
  }

  const buffer = await response.arrayBuffer();

  return parseStlBufferInWorker(`${sample.label}.stl`, buffer);
}

function parseStlBufferInWorker(
  name: string,
  buffer: ArrayBuffer,
): Promise<MeshData> {
  return new Promise((resolve, reject) => {
    const worker = new Worker(
      new URL("./engine/loaders/stlLoaderWorker.ts", import.meta.url),
      {
        type: "module",
      },
    );

    worker.onmessage = (event: MessageEvent<MeshWorkerResponse>) => {
      worker.terminate();

      if (event.data.type === "success") {
        resolve(event.data.mesh);
        return;
      }

      reject(new Error(event.data.message));
    };

    worker.onerror = (event) => {
      worker.terminate();
      reject(new Error(event.message || "Failed to run STL loader worker."));
    };

    worker.postMessage(
      {
        name,
        buffer,
      },
      [buffer],
    );
  });
}

function remeshMeshInWorker(
  mesh: MeshData,
  targetEdgeLength: number,
): Promise<MeshData> {
  return new Promise((resolve, reject) => {
    const worker = new Worker(
      new URL("./engine/remesh/remeshWorker.ts", import.meta.url),
      {
        type: "module",
      },
    );

    worker.onmessage = (event: MessageEvent<MeshWorkerResponse>) => {
      worker.terminate();

      if (event.data.type === "success") {
        resolve(event.data.mesh);
        return;
      }

      reject(new Error(event.data.message));
    };

    worker.onerror = (event) => {
      worker.terminate();
      reject(new Error(event.message || "Failed to run remesh worker."));
    };

    worker.postMessage({
      mesh,
      targetEdgeLength,
    });
  });
}

function waitForProcessingOverlayPaint(): Promise<void> {
  return new Promise((resolve) => {
    requestAnimationFrame(() => {
      window.setTimeout(resolve, 0);
    });
  });
}

export default App;

