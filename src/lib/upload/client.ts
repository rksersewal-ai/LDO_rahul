"use client";

/**
 * Browser-side upload helpers. No server imports here — this runs in the client.
 */

export interface UploadMetadata {
  documentNumber: string;
  title: string;
  category: string;
  revision: string;
  revisionDate?: string | null;
  agency?: string;
  tags: string[];
  linkedPlIds: string[];
}

export interface UploadResponse {
  documentId: string;
  documentNumber: string;
  fileHash: string;
  fileSize: number;
  mimeType: string;
  ocrQueued: boolean;
}

/**
 * Compute the SHA-256 hex digest of a file using the Web Crypto API.
 * Used for the client-side duplicate pre-check before upload.
 */
export async function computeSha256(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const digest = await crypto.subtle.digest("SHA-256", buffer);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Upload a document via XMLHttpRequest so we can report real upload progress.
 * Resolves with the created document info, or rejects with a human-readable
 * error message taken from the server response.
 */
export function uploadDocument(params: {
  file: File;
  metadata: UploadMetadata;
  clearanceRequired?: number;
  onProgress?: (percent: number) => void;
  signal?: AbortSignal;
}): Promise<UploadResponse> {
  const { file, metadata, clearanceRequired, onProgress, signal } = params;

  return new Promise<UploadResponse>((resolve, reject) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("metadata", JSON.stringify(metadata));
    if (clearanceRequired !== undefined) {
      formData.append("clearanceRequired", String(clearanceRequired));
    }

    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/documents/upload");
    xhr.responseType = "json";

    if (xhr.upload) {
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable && onProgress) {
          onProgress(Math.round((e.loaded / e.total) * 100));
        }
      };
    }

    xhr.onload = () => {
      const body = xhr.response as { error?: string } & Partial<UploadResponse>;
      if (xhr.status >= 200 && xhr.status < 300 && body?.documentId) {
        resolve(body as UploadResponse);
      } else {
        reject(new Error(body?.error || `Upload failed (HTTP ${xhr.status}).`));
      }
    };

    xhr.onerror = () => reject(new Error("Network error during upload."));
    xhr.onabort = () => reject(new Error("Upload cancelled."));

    if (signal) {
      signal.addEventListener("abort", () => xhr.abort(), { once: true });
    }

    xhr.send(formData);
  });
}
