import type { MeshData } from "../mesh/meshTypes";
import { remeshToApproxTargetEdgeLength } from "./remeshToApproxTargetEdgeLength";

type RemeshWorkerRequest = {
  mesh: MeshData;
  targetEdgeLength: number;
};

type RemeshWorkerSuccessResponse = {
  type: "success";
  mesh: MeshData;
};

type RemeshWorkerErrorResponse = {
  type: "error";
  message: string;
};

type WorkerSelf = {
  onmessage: ((event: MessageEvent<RemeshWorkerRequest>) => void) | null;
  postMessage: (message: unknown, transfer?: Transferable[]) => void;
};

const workerSelf = self as unknown as WorkerSelf;

workerSelf.onmessage = (event) => {
  try {
    const remeshedMesh = remeshToApproxTargetEdgeLength(
      event.data.mesh,
      event.data.targetEdgeLength,
    );

    const response: RemeshWorkerSuccessResponse = {
      type: "success",
      mesh: remeshedMesh,
    };

    workerSelf.postMessage(response, [
      remeshedMesh.positions.buffer as ArrayBuffer,
      remeshedMesh.normals.buffer as ArrayBuffer,
    ]);
  } catch (error) {
    const response: RemeshWorkerErrorResponse = {
      type: "error",
      message:
        error instanceof Error ? error.message : "Failed to remesh STL file.",
    };

    workerSelf.postMessage(response);
  }
};

export {};
