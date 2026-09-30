import { useEffect, useState } from "react";
import { emptyState } from "../lib/model";
import type { Deployment } from "../lib/model";
import { createIndexedDBStore, createMemoryStore, isIndexedDBAvailable } from "../lib/store";

/**
 * Local preview route (#/preview/<deploymentId>).
 *
 * No server involved: the deployment's HTML is read from the browser's own
 * IndexedDB and rendered in a sandboxed iframe. The hash-based route works
 * on any static host — local file server, Supabase Storage bucket, or an
 * IPFS gateway path like /ipfs/<cid>/index.html.
 */
export default function PreviewPage({ deploymentId }: { deploymentId: string }) {
  const [dep, setDep] = useState<Deployment | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const store = isIndexedDBAvailable() ? createIndexedDBStore() : createMemoryStore();
    store
      .load()
      .then((loaded) => {
        if (cancelled) return;
        const found = (loaded ?? emptyState()).deployments.find((d) => d.id === deploymentId);
        if (found) setDep(found);
        else setError(`No deployment found with id "${deploymentId}" in this browser.`);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : String(err));
      });
    return () => {
      cancelled = true;
    };
  }, [deploymentId]);

  if (error) {
    return (
      <div style={{ padding: 48, color: "#ffb3bd", fontFamily: "system-ui, sans-serif" }}>
        <h1>Preview unavailable</h1>
        <p>{error}</p>
        <p>
          <a href="#" style={{ color: "#7db4ff" }}>
            ← Back to Monico Labs
          </a>
        </p>
      </div>
    );
  }

  if (!dep) {
    return (
      <div style={{ padding: 48, color: "#9aa4bd", fontFamily: "system-ui, sans-serif" }}>
        Loading preview…
      </div>
    );
  }

  if (!dep.deployedHtml) {
    return (
      <div style={{ padding: 48, color: "#ffb3bd", fontFamily: "system-ui, sans-serif" }}>
        <h1>Preview unavailable</h1>
        <p>This deployment has no stored HTML.</p>
      </div>
    );
  }

  return (
    <iframe
      title={`Preview of deployment ${dep.id}`}
      srcDoc={dep.deployedHtml}
      sandbox="allow-scripts"
      style={{ position: "fixed", inset: 0, width: "100%", height: "100%", border: "none", background: "#fff" }}
    />
  );
}
