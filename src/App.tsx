import { useEffect, useState } from "react";
import SitesPanel from "./components/SitesPanel";
import PreviewPage from "./components/PreviewPage";
import SelfContainedBanner from "./SelfContainedBanner";
import { Shell } from "./store/ui";
import Home from "./store/pages/Home";
import Product, { Products } from "./store/pages/Product";
import Checkout from "./store/pages/Checkout";
import Order from "./store/pages/Order";
import Account from "./store/pages/Account";
import Owner from "./store/pages/Owner";

/**
 * Monico Labs — storefront + site lab, one static bundle.
 *
 * Hash routing keeps every route working on ANY static host with zero
 * server config. The storefront talks to the hub Worker (hub-worker/)
 * at VITE_HUB_URL; the original static site lab lives at #/lab and
 * still runs fully in the browser.
 */
function useHashRoute(): string {
  const [hash, setHash] = useState(() => window.location.hash || "#/");
  useEffect(() => {
    const onChange = () => { setHash(window.location.hash || "#/"); window.scrollTo(0, 0); };
    window.addEventListener("hashchange", onChange);
    return () => window.removeEventListener("hashchange", onChange);
  }, []);
  return hash;
}

function Store({ hash }: { hash: string }) {
  const parts = hash.replace(/^#\/?/, "").split("/").filter(Boolean);
  const [root, a, b] = parts;
  let page;
  if (!root) page = <Home />;
  else if (root === "products") page = <Products />;
  else if (root === "product" && a) page = <Product id={a} />;
  else if (root === "checkout" && a && b) page = <Checkout productId={a} tierId={b} />;
  else if (root === "order" && a) page = <Order id={a} />;
  else if (root === "account") page = <Account />;
  else if (root === "owner") page = <Owner />;
  else page = <Home />;
  return <Shell>{page}</Shell>;
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
  if (hash.startsWith("#/lab")) {
    return (
      <>
        <SelfContainedBanner />
        <SitesPanel />
      </>
    );
  }
  return <Store hash={hash} />;
}

export default App;
