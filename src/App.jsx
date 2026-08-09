import { useEffect } from "react";
import {HomePage,
  IdentityTrustPage,
  ClinicalWorkspacePage,
  InteroperabilityPage,
  CountryProfilesPage,
  ManuscriptsPage,
  CollaboratePage,
  NotFoundPage,
} from "./pages/SitePages.jsx";
import { LEGACY_HASHES, LEGACY_PATHS } from "./siteConfig.js";

export const ROUTES = {
  "/": {
    component: HomePage,
    title: "IML Health — Open Health Information Environment",
    description: "An open-source clinical workspace and an open integration layer for health information systems.",
  },
  "/identity-trust": {
    component: IdentityTrustPage,
    title: "Identity & Trust — IML Health",
    description: "Identity, consent, provenance and trusted access across fragmented health information systems.",
  },
  "/clinical-workspace": {
    component: ClinicalWorkspacePage,
    title: "Open Clinical Workspace — IML Health",
    description: "A modular, open-source and vendor-neutral clinical workspace for progressive deployment.",
  },
  "/interoperability": {
    component: InteroperabilityPage,
    title: "Open-Source Health Interoperability — IML Health",
    description: "IML advances open-source health interoperability through clinical meaning, trusted identity, responsible governance and evidence-based learning.",
    canonical: "https://imlhealth.org/interoperability",
  },
  "/country-profiles": {
    component: CountryProfilesPage,
    title: "Country Profiles — IML Health",
    description: "Evidence-oriented country interoperability profiles with explicit sources and limitations.",
  },
  "/manuscripts": {
    component: ManuscriptsPage,
    title: "Manuscripts — IML Health",
    description: "The founding vision and technical architecture manuscripts of IML Health.",
  },
  "/collaborate": {
    component: CollaboratePage,
    title: "Collaborate — IML Health",
    description: "Contribute evidence, clinical review, research or open-source implementation experience to IML Health.",
  },
};


function cleanPath(pathname) {
  if (!pathname || pathname === "/") return "/";
  return pathname.replace(/\/+$/, "") || "/";
}

function resolveLocation() {
  const pathname = cleanPath(window.location.pathname);
  const legacyTarget = LEGACY_PATHS[pathname]
    || (pathname === "/" ? LEGACY_HASHES[window.location.hash.toLowerCase()] : null);
  if (!legacyTarget) return { routePath: pathname, canonicalTarget: null };
  return { routePath: legacyTarget.split("#")[0], canonicalTarget: legacyTarget };
}

function setMeta(route) {
  document.title = route.title;
  let description = document.querySelector('meta[name="description"]');
  if (!description) {
    description = document.createElement("meta");
    description.setAttribute("name", "description");
    document.head.appendChild(description);
  }
  description.setAttribute("content", route.description);

  let canonical = document.querySelector('link[rel="canonical"]');
  if (route.canonical) {
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.setAttribute("rel", "canonical");
      document.head.appendChild(canonical);
    }
    canonical.setAttribute("href", route.canonical);
  } else if (canonical) {
    canonical.remove();
  }
}

export default function App() {
  const location = resolveLocation();
  const route = ROUTES[location.routePath] || {
    component: NotFoundPage,
    title: "Page not found — IML Health",
    description: "The requested IML Health page could not be found.",
  };
  const Page = route.component;

  useEffect(() => {
    setMeta(route);
    document.body.dataset.imlRoute = location.routePath;

    if (location.canonicalTarget) {
      window.history.replaceState({}, "", location.canonicalTarget);
    }

    const fragment = (location.canonicalTarget?.split("#")[1] || window.location.hash.slice(1)).trim();
    window.requestAnimationFrame(() => {
      if (fragment && document.getElementById(fragment)) {
        document.getElementById(fragment).scrollIntoView();
      } else {
        window.scrollTo(0, 0);
      }
    });

    return () => {
      delete document.body.dataset.imlRoute;
    };
  }, [location.canonicalTarget, location.routePath, route]);

  return (
    <>
      <Page />
    </>
  );
}
