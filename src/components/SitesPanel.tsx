import { useEffect, useMemo, useState } from "react";
import { DEFAULT_SITE_TEMPLATE, emptyState, newDeployment, newProject } from "../lib/model";
import type { AppState, Deployment } from "../lib/model";
import { createIndexedDBStore, createMemoryStore, isIndexedDBAvailable } from "../lib/store";
import type { StateStore } from "../lib/store";
import { desktopPlatform, featureList, isDesktopApp } from "../lib/env";
import { publishHtmlToIpfs } from "../lib/ipfs";
import "./SitesPanel.css";

const IPFS_HONESTY_NOTE =
  "Public via IPFS gateways. This browser is the provider while the page is open; " +
  "gateways were asked to cache a copy so the link can survive this tab closing. " +
  "Permanent availability is not guaranteed without paid pinning (not used). " +
  "Static HTML only — anything needing a backend can't work this way.";

function shortId(id: string): string {
  return id.length > 18 ? `${id.slice(0, 10)}…${id.slice(-6)}` : id;
}

function formatTime(iso: string): string {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

export default function SitesPanel() {
  const [store] = useState<StateStore>(() =>
    isIndexedDBAvailable() ? createIndexedDBStore() : createMemoryStore()
  );
  const [state, setState] = useState<AppState>(emptyState());
  const [ready, setReady] = useState(false);
  const [bootError, setBootError] = useState<string | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [newName, setNewName] = useState("");
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [publishingId, setPublishingId] = useState<string | null>(null);
  const [publishError, setPublishError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    store
      .load()
      .then((loaded) => {
        if (cancelled) return;
        const s = loaded ?? emptyState();
        setState(s);
        if (!selectedProjectId && s.projects.length > 0) {
          setSelectedProjectId(s.projects[0].id);
        }
        setReady(true);
      })
      .catch((err) => {
        if (cancelled) return;
        setBootError(err instanceof Error ? err.message : String(err));
        setReady(true);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [store]);

  const persist = (next: AppState): void => {
    setState(next);
    store.save(next).catch((err) => {
      setBootError(`Failed to save: ${err instanceof Error ? err.message : String(err)}`);
    });
  };

  const selectedProject = useMemo(
    () => state.projects.find((p) => p.id === selectedProjectId) ?? null,
    [state.projects, selectedProjectId]
  );

  const projectDeployments = useMemo(
    () =>
      state.deployments
        .filter((d) => d.projectId === selectedProjectId)
        .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1)),
    [state.deployments, selectedProjectId]
  );

  const createProject = (): void => {
    const project = newProject(newName);
    persist({ projects: [project, ...state.projects], deployments: state.deployments });
    setSelectedProjectId(project.id);
    setNewName("");
  };

  const deploy = (): void => {
    if (!selectedProject) return;
    const html = drafts[selectedProject.id] ?? DEFAULT_SITE_TEMPLATE;
    if (!html.trim()) return;
    const dep = newDeployment(selectedProject.id, html);
    const next: AppState = {
      projects: state.projects.map((p) =>
        p.id === selectedProject.id ? { ...p, activeDeploymentId: dep.id } : p
      ),
      deployments: [dep, ...state.deployments],
    };
    persist(next);
    setDrafts((d) => {
      const copy = { ...d };
      delete copy[selectedProject.id];
      return copy;
    });
  };

  const publish = async (dep: Deployment): Promise<void> => {
    if (!dep.deployedHtml) {
      setPublishError("This deployment has no HTML payload — only static HTML deployments can be published.");
      return;
    }
    setPublishingId(dep.id);
    setPublishError(null);
    try {
      const result = await publishHtmlToIpfs(dep.deployedHtml);
      const next: AppState = {
        ...state,
        deployments: state.deployments.map((d) =>
          d.id === dep.id
            ? { ...d, ipfsCid: result.cid, ipfsUrls: result.urls, ipfsPublishedAt: new Date().toISOString() }
            : d
        ),
      };
      persist(next);
    } catch (err) {
      setPublishError(
        `IPFS publish failed: ${err instanceof Error ? err.message : String(err)}. ` +
          "The in-browser node needs network access to IPFS transports — try again, or publish from the desktop app."
      );
    } finally {
      setPublishingId(null);
    }
  };

  const features = useMemo(() => featureList(), []);

  if (!ready) {
    return (
      <div className="sites sites--loading">
        <p>Loading Monico Labs…</p>
      </div>
    );
  }

  return (
    <div className="sites">
      <header className="sites__header">
        <div>
          <h1>Monico Labs</h1>
          <p className="sites__subtitle">Static build — no backend, no server, no keys.</p>
        </div>
        <div className="sites__badges">
          <span className="badge badge--ok" title="All project data stays in this browser">
            {isIndexedDBAvailable() ? "IndexedDB · this browser" : "Memory · not durable"}
          </span>
          {isDesktopApp ? (
            <span className="badge badge--info" title={`Running inside the desktop app on ${desktopPlatform ?? "unknown platform"}`}>
              Desktop app
            </span>
          ) : (
            <span className="badge" title="Plain web build — desktop-only features are labelled, never faked">
              Web build
            </span>
          )}
        </div>
      </header>

      {bootError && <div className="sites__error">{bootError}</div>}
      {!isIndexedDBAvailable() && (
        <div className="sites__warn">
          This browser has no IndexedDB — projects will live in memory only and vanish on reload.
          Use a real browser (or the desktop app) for durable storage.
        </div>
      )}

      <section className="sites__features">
        <h2>What works here</h2>
        <ul>
          {features.map((f) => (
            <li key={f.id} className={f.availableInBrowser ? "feat feat--yes" : "feat feat--no"}>
              <span className="feat__dot" aria-hidden />
              <div>
                <strong>{f.name}</strong>
                <span className="feat__tag">{f.availableInBrowser ? "works here" : "desktop app only"}</span>
                <p>{f.note}</p>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <div className="sites__columns">
        <section className="sites__projects">
          <h2>Projects</h2>
          <div className="sites__newrow">
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="New site name…"
              onKeyDown={(e) => {
                if (e.key === "Enter") createProject();
              }}
            />
            <button onClick={createProject}>New project</button>
          </div>
          {state.projects.length === 0 ? (
            <p className="sites__empty">No projects yet — create one to get started.</p>
          ) : (
            <ul className="sites__plist">
              {state.projects.map((p) => (
                <li key={p.id}>
                  <button
                    className={p.id === selectedProjectId ? "active" : ""}
                    onClick={() => setSelectedProjectId(p.id)}
                  >
                    <span className="sites__pname">{p.name}</span>
                    <span className="sites__pid">{shortId(p.id)}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="sites__deploys">
          {!selectedProject ? (
            <p className="sites__empty">Select a project to manage its deployments.</p>
          ) : (
            <>
              <h2>{selectedProject.name} — deployments</h2>
              <div className="sites__newdeploy">
                <label htmlFor="deploy-html">Site HTML (static — this is the whole deployment)</label>
                <textarea
                  id="deploy-html"
                  rows={10}
                  spellCheck={false}
                  value={drafts[selectedProject.id] ?? DEFAULT_SITE_TEMPLATE}
                  onChange={(e) => setDrafts((d) => ({ ...d, [selectedProject.id]: e.target.value }))}
                />
                <button className="sites__deploybtn" onClick={deploy}>
                  Deploy
                </button>
              </div>
              {projectDeployments.length === 0 ? (
                <p className="sites__empty">No deployments yet.</p>
              ) : (
                <ul className="sites__dlist">
                  {projectDeployments.map((dep) => (
                    <li key={dep.id} className="dep">
                      <div className="dep__head">
                        <span className={`dep__status dep__status--${dep.status}`}>{dep.status}</span>
                        <span className="dep__id" title={dep.id}>{shortId(dep.id)}</span>
                        <span className="dep__time">{formatTime(dep.createdAt)}</span>
                      </div>
                      {dep.commitMessage && <p className="dep__msg">{dep.commitMessage}</p>}
                      <div className="dep__actions">
                        {dep.previewUrl && (
                          <a className="btn" href={dep.previewUrl} target="_blank" rel="noreferrer">
                            Preview locally
                          </a>
                        )}
                        <button
                          className="btn btn--primary"
                          disabled={publishingId === dep.id}
                          onClick={() => publish(dep)}
                        >
                          {publishingId === dep.id ? "Publishing…" : "Publish public (IPFS)"}
                        </button>
                      </div>
                      {dep.ipfsCid && (
                        <div className="dep__ipfs">
                          <p>
                            <strong>CID:</strong> <code>{dep.ipfsCid}</code>
                          </p>
                          <ul>
                            {(dep.ipfsUrls ?? []).map((u) => (
                              <li key={u}>
                                <a href={u} target="_blank" rel="noreferrer">
                                  {u}
                                </a>
                              </li>
                            ))}
                          </ul>
                          <p className="dep__note">{IPFS_HONESTY_NOTE}</p>
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              )}
              {publishError && <div className="sites__error">{publishError}</div>}
            </>
          )}
        </section>
      </div>

      <section className="sites__selfhost">
        <h2>The self-hosting loop</h2>
        <p>
          This page <em>is</em> the app. Build once (<code>npm run build</code> → <code>dist/</code>),
          publish <code>dist/</code> to IPFS from the desktop app — or drop it in a public
          Supabase Storage bucket (free tier) — and from then on the app deploys itself.
          Once online, it hosts itself: new sites you publish from it are just more static files.
        </p>
      </section>
    </div>
  );
}
