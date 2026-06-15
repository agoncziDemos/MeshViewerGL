import { parseStl } from "./stlLoader";
import type { MeshData } from "../mesh/meshTypes";

type StlLoaderWorkerRequest = {
  name: string;
  buffer: ArrayBuffer;
};

type StlLoaderWorkerSuccessResponse = {
  type: "success";
  mesh: MeshData;
};

type StlLoaderWorkerErrorResponse = {
  type: "error";
  message: string;
};

type WorkerSelf = {
  onmessage: ((event: MessageEvent<StlLoaderWorkerRequest>) => void) | null;
  postMessage: (message: unknown, transfer?: Transferable[]) => void;
};

const workerSelf = self as unknown as WorkerSelf;

workerSelf.onmessage = (event) => {
  try {
    const loadedMesh = parseStl(event.data.buffer, event.data.name);

    const response: StlLoaderWorkerSuccessResponse = {
      type: "success",
      mesh: loadedMesh,
    };

    workerSelf.postMessage(response, [
      loadedMesh.positions.buffer as ArrayBuffer,
      loadedMesh.normals.buffer as ArrayBuffer,
    ]);
  } catch (error) {
    const response: StlLoaderWorkerErrorResponse = {
      type: "error",
      message:
        error instanceof Error ? error.message : "Failed to load STL file.",
    };

    workerSelf.postMessage(response);
  }
};

export {};
