"use client";

import { useParams } from "next/navigation";
import { useRef, useState } from "react";
import { trpc } from "@/lib/trpc/client";

function ExpiredState() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-md rounded-lg border bg-card p-8 text-center shadow-sm">
        <div className="mb-4 text-4xl">&#x23F3;</div>
        <h1 className="mb-2 text-xl font-semibold text-foreground">Link Expired</h1>
        <p className="text-muted-foreground">
          This share link has expired or reached its maximum view count. Please request a new link
          from the document owner.
        </p>
      </div>
    </div>
  );
}

function RevokedState() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-md rounded-lg border bg-card p-8 text-center shadow-sm">
        <div className="mb-4 text-4xl">&#x1F6AB;</div>
        <h1 className="mb-2 text-xl font-semibold text-foreground">Link Revoked</h1>
        <p className="text-muted-foreground">
          This share link has been revoked by the document owner and is no longer accessible.
        </p>
      </div>
    </div>
  );
}

function PasswordForm({
  onSubmit,
  error,
  isLoading,
}: {
  onSubmit: (password: string) => void;
  error: string | null;
  isLoading: boolean;
}) {
  const [password, setPassword] = useState("");

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-md rounded-lg border bg-card p-8 shadow-sm">
        <div className="mb-4 text-center text-4xl">&#x1F512;</div>
        <h1 className="mb-2 text-center text-xl font-semibold text-foreground">
          Password Required
        </h1>
        <p className="mb-6 text-center text-muted-foreground">
          This document is protected. Enter the password to view it.
        </p>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            onSubmit(password);
          }}
        >
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter password"
            className="mb-4 w-full rounded-md border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            required
            minLength={4}
          />
          {error && <p className="mb-4 text-sm text-destructive">{error}</p>}
          <button
            type="submit"
            disabled={isLoading || password.length < 4}
            className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            {isLoading ? "Verifying..." : "View Document"}
          </button>
        </form>
      </div>
    </div>
  );
}

function DocumentView({
  document,
  allowDownload,
  token,
  password,
}: {
  document: {
    id: string;
    documentNumber: string;
    title: string;
    description: string | null;
    category: string;
    status: string;
    revision: string;
    mimeType: string | null;
    originalFilename: string | null;
    pageCount: number | null;
    createdAt: string;
  };
  allowDownload: boolean;
  token: string;
  password?: string;
}) {
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const [isOpening, setIsOpening] = useState(false);

  const openSharedFile = async (disposition: "inline" | "attachment") => {
    setDownloadError(null);
    setIsOpening(true);
    try {
      const response = await fetch(`/api/share/${token}/download?disposition=${disposition}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(payload?.error ?? "Unable to open the shared document.");
      }

      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      if (disposition === "attachment") {
        const link = window.document.createElement("a");
        link.href = objectUrl;
        link.download = document.originalFilename ?? `${document.documentNumber}`;
        link.click();
        URL.revokeObjectURL(objectUrl);
      } else {
        window.open(objectUrl, "_blank", "noopener,noreferrer");
        window.setTimeout(() => URL.revokeObjectURL(objectUrl), 60_000);
      }
    } catch (error) {
      setDownloadError(error instanceof Error ? error.message : "Unable to open document.");
    } finally {
      setIsOpening(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-2xl rounded-lg border bg-card p-8 shadow-sm">
        <div className="mb-6 border-b pb-4">
          <h1 className="text-2xl font-semibold text-foreground">{document.title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {document.documentNumber} &bull; Rev. {document.revision}
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <span className="text-xs font-medium uppercase text-muted-foreground">Category</span>
            <p className="mt-1 text-sm text-foreground">{document.category.replace(/_/g, " ")}</p>
          </div>
          <div>
            <span className="text-xs font-medium uppercase text-muted-foreground">Status</span>
            <p className="mt-1 text-sm text-foreground capitalize">
              {document.status.replace(/_/g, " ")}
            </p>
          </div>
          {document.originalFilename && (
            <div>
              <span className="text-xs font-medium uppercase text-muted-foreground">Filename</span>
              <p className="mt-1 text-sm text-foreground">{document.originalFilename}</p>
            </div>
          )}
          {document.mimeType && (
            <div>
              <span className="text-xs font-medium uppercase text-muted-foreground">Type</span>
              <p className="mt-1 text-sm text-foreground">{document.mimeType}</p>
            </div>
          )}
          {document.pageCount && (
            <div>
              <span className="text-xs font-medium uppercase text-muted-foreground">Pages</span>
              <p className="mt-1 text-sm text-foreground">{document.pageCount}</p>
            </div>
          )}
          <div>
            <span className="text-xs font-medium uppercase text-muted-foreground">Created</span>
            <p className="mt-1 text-sm text-foreground">
              {new Date(document.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>

        {document.description && (
          <div className="mt-6 border-t pt-4">
            <span className="text-xs font-medium uppercase text-muted-foreground">Description</span>
            <p className="mt-1 text-sm text-foreground">{document.description}</p>
          </div>
        )}

        <div className="mt-6 flex flex-wrap items-center gap-2 border-t pt-4">
          {allowDownload ? (
            <span className="inline-flex items-center rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-800 dark:bg-green-900/30 dark:text-green-400">
              Download allowed
            </span>
          ) : (
            <span className="inline-flex items-center rounded-full bg-yellow-100 px-3 py-1 text-xs font-medium text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">
              View only
            </span>
          )}
          <button
            type="button"
            onClick={() => openSharedFile("inline")}
            disabled={isOpening}
            className="rounded-md border px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted disabled:opacity-50"
          >
            {isOpening ? "Opening..." : "Preview document"}
          </button>
          {allowDownload && (
            <button
              type="button"
              onClick={() => openSharedFile("attachment")}
              disabled={isOpening}
              className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              Download
            </button>
          )}
          {downloadError && <p className="basis-full text-sm text-destructive">{downloadError}</p>}
        </div>
      </div>
    </div>
  );
}

function NotFoundState() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-md rounded-lg border bg-card p-8 text-center shadow-sm">
        <div className="mb-4 text-4xl">&#x1F50D;</div>
        <h1 className="mb-2 text-xl font-semibold text-foreground">Not Found</h1>
        <p className="text-muted-foreground">
          This share link does not exist or may have been removed.
        </p>
      </div>
    </div>
  );
}

export default function ShareTokenPage() {
  const params = useParams();
  const token = params.token as string;
  const [_password, setPassword] = useState<string | undefined>(undefined);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const passwordRef = useRef<string | undefined>(undefined);

  const { data, isLoading, error, refetch } = trpc.documentShareLinks.resolveShareToken.useQuery(
    { token, password: passwordRef.current },
    {
      enabled: !!token,
      retry: false,
    },
  );

  const handlePasswordSubmit = (pw: string) => {
    setPasswordError(null);
    passwordRef.current = pw;
    setPassword(pw);
    refetch();
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (error) {
    if (error.data?.code === "NOT_FOUND") {
      return <NotFoundState />;
    }
    if (error.data?.code === "UNAUTHORIZED") {
      return (
        <PasswordForm
          onSubmit={handlePasswordSubmit}
          error="Invalid password. Please try again."
          isLoading={false}
        />
      );
    }
    return <NotFoundState />;
  }

  if (!data) {
    return <NotFoundState />;
  }

  if (data.status === "expired") {
    return <ExpiredState />;
  }

  if (data.status === "revoked") {
    return <RevokedState />;
  }

  if (data.status === "password_required") {
    return (
      <PasswordForm onSubmit={handlePasswordSubmit} error={passwordError} isLoading={isLoading} />
    );
  }

  if (data.status === "valid" && data.document) {
    return (
      <DocumentView
        document={data.document}
        allowDownload={data.allowDownload ?? false}
        token={token}
        password={passwordRef.current}
      />
    );
  }

  return <NotFoundState />;
}
