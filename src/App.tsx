import { useEffect, useState } from "react";
import SitesPanel from "./components/SitesPanel";
import PreviewPage from "./components/PreviewPage";

/**
 * Monico Labs — static web build.
 *
 * Hash routing keeps every route working on ANY static host with zero
 * server configuration: `#/preview/<deploymentId>` renders a deployment's
 * stored HTML from the browser's own IndexedDB. No backend is ever called —
 * this bundle must boot and work with no network at all (IPFS publish is
 * the only feature that touches the network, and it's explicit).
 */
function useHashRoute(): string {
  const [hash, setHash] = useState(() => window.location.hash);
  useEffect(() => {
    const onChange = () => setHash(window.location.hash);
    window.addEventListener("hashchange", onChange);
    return () => window.removeEventListener("hashchange", onChange);
  }, []);
  return hash;
}

function App() {
  const hash = useHashRoute();
  if (hash.startsWith("#/preview/")) {
    return <PreviewPage deploymentId={hash.slice("#/preview/".length)} />;
  }
  return <SitesPanel />;
}

export default App;
