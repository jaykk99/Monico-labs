import { useEffect, useState } from "react";
import PreviewPage from "./components/PreviewPage";
import SitesPanel from "./components/SitesPanel";
import Console from "./console/Console";

/**
 * Monico Labs — hosting console.
 *
 * Hash routing keeps every route working on any static host:
 *   #/                      projects dashboard (and #/teams, #/system)
 *   #/p/<id>/<section>      a project: overview, deployments, domains, …
 *   #/preview/<deployment>  browser-only preview of a local deployment
 *   #/lab                   the original single-page site lab
 * With a Monico server behind it the console is fully live; on static
 * hosting it falls back to browser storage + in-page IPFS publishing.
 */
function useHash(): string {
  const [hash, setHash] = useState(() => window.location.hash);
  useEffect(() => {
    const f = () => setHash(window.location.hash);
    window.addEventListener("hashchange", f);
    return () => window.removeEventListener("hashchange", f);
  }, []);
  return hash;
}

export default function App() {
  const hash = useHash();
  if (hash.startsWith("#/preview/")) return <PreviewPage deploymentId={hash.slice("#/preview/".length)} />;
  if (hash.startsWith("#/lab")) return <SitesPanel />;
  return <Console />;
}
