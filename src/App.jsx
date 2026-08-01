import { useEffect } from "react";
import HomePage from "./pages/HomePage.jsx";
import VisionPage from "./pages/VisionPage.jsx";
import ClinicalWorkspacePage from "./pages/ClinicalWorkspacePage.jsx";
import InteroperabilityPage from "./pages/InteroperabilityPage.jsx";
import CountryProfilesPage from "./pages/CountryProfilesPage.jsx";
import ManuscriptsPage from "./pages/ManuscriptsPage.jsx";
import CollaboratePage from "./pages/CollaboratePage.jsx";
import NotFoundPage from "./pages/NotFoundPage.jsx";

export const ROUTES = {
  "/": {
    component: HomePage,
    title: "IML Health — Open Health Information Environment",
    description: "An open-source clinical workspace and an open integration layer for health information systems.",
  },
  "/vision": {
    component: VisionPage,
    title: "Vision — IML Health",
    description: "The purpose, scope and current state of the IML Open Health Information Environment.",
  },
  "/clinical-workspace": {
    component: ClinicalWorkspacePage,
    title: "Open Clinical Workspace — IML Health",
    description: "A modular, open-source and vendor-neutral clinical workspace for progressive deployment.",
  },
  "/interoperability": {
    component: InteroperabilityPage,
    title: "Interoperability — IML Health",
    description: "IML's open integration, evidence and learning layer for health information systems.",
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

const LEGACY_HASHES = {
  "#id4d": "/vision#identity-trust",
  "#evaluation": "/interoperability",
  "#methodology": "/interoperability#methodology",
  "#world": "/country-profiles",
  "#profiles": "/country-profiles",
  "#contact": "/collaborate",
};

const LEGACY_PATHS = {
  "/id4d": "/vision#identity-trust",
  "/evaluation": "/interoperability",
  "/methodology": "/interoperability#methodology",
  "/world": "/country-profiles",
  "/profiles": "/country-profiles",
  "/contact": "/collaborate",
};

function cleanPath(pathname) {
  if (!pathname || pathname === "/") return "/";
  return pathname.replace(/\/+$/, "") || "/";
}

function resolveLocation() {
  const pathname = cleanPath(window.location.pathname);
  const legacyTarget = LEGACY_PATHS[pathname] || (pathname === "/" ? LEGACY_HASHES[window.location.hash.toLowerCase()] : null);
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
  }, [location.canonicalTarget, route]);

  return <Page />;
}
