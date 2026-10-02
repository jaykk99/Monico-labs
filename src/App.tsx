import { useEffect, useState } from "react";
import SitesPanel from "./components/SitesPanel";
import PreviewPage from "./components/PreviewPage";
import SelfContainedBanner from "./SelfContainedBanner";

/**
 * Monico Labs — static web build.
 *
 * Hash routing keeps every route working on ANY static host with zero
 * server configuration: `#/preview/<deploymentId>` renders a deployment's
 * stored HTML from the browser's own IndexedDB. No backend is ever called —
 * this bundle must boot and work with no network at all (IPFS publish is
 * the only feature that touches the network, and it's explicit).
 *
 * SelfContainedBanner sits on top: when the bundle is served by the Monico
 * server it shows the honest self-containment / degradation state from
 * /api/health; on a pure static host the fetch fails and it renders null.
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
    return (
      <>
        <SelfContainedBanner />
        <PreviewPage deploymentId={hash.slice("#/preview/".length)} />
      </>
    );
  }
  return (
    <>
      <SelfContainedBanner />
      <SitesPanel />
    </>
  );
}

export default App;
