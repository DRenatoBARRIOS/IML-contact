import { useEffect } from "react";
import VisionPage from "./pages/VisionPage.jsx";
import ClinicalWorkspacePage from "./pages/ClinicalWorkspacePage.jsx";
import InteroperabilityPage from "./pages/InteroperabilityPage.jsx";
import CollaboratePage from "./pages/CollaboratePage.jsx";
import NotFoundPage from "./pages/NotFoundPage.jsx";
import CountryExplorer from "./components/CountryExplorer.jsx";
import PageMasthead from "./components/PageMasthead.jsx";
import PageFrame from "./components/SiteChrome.jsx";

const BASE_URL = import.meta.env.BASE_URL || "/";

/*
 * These few rules are deliberately kept here so this App.jsx can replace the
 * current file on site-test without requiring another CSS upload.
 */
const REFERENCE_ADJUSTMENTS = `
  .footer-brand > img {
    display: none !important;
  }

  body[data-iml-route="/country-profiles"] .page-masthead-grid,
  body[data-iml-route="/manuscripts"] .page-masthead-grid {
    min-height: 280px;
    padding-block: 48px 56px;
  }

  body[data-iml-route="/country-profiles"] .page-masthead h1,
  body[data-iml-route="/manuscripts"] .page-masthead h1 {
    font-size: clamp(3rem, 4.8vw, 5.1rem);
  }

  body[data-iml-route="/country-profiles"] .profiles-heading {
    margin-bottom: 30px;
  }

  @media (max-width: 760px) {
    body[data-iml-route="/country-profiles"] .page-masthead-grid,
    body[data-iml-route="/manuscripts"] .page-masthead-grid {
      padding-block: 38px 48px;
    }
  }
`;

function HomePage() {
  return (
    <PageFrame active="/" home>
      <section className="hero" id="top">
        <div className="shell hero-grid">
          <div className="hero-copy">
            <p className="eyebrow">Open · vendor-neutral · academic</p>
            <h1>Health information should illuminate care — not fragment it.</h1>
            <p className="hero-lede">
              IML unites two complementary paths: an open-source clinical workspace and an open integration layer for existing systems.
            </p>
            <div className="hero-actions">
              <a className="button primary" href="/vision">Explore the project</a>
              <a className="button secondary" href="/country-profiles">View country profiles</a>
            </div>
            <div className="hero-paths" aria-label="Two complementary paths">
              <a className="path-card" href="/clinical-workspace">
                <span className="path-number">01</span>
                <span>
                  <strong>Open Clinical Workspace</strong>
                  <small>A progressively deployable clinical foundation.</small>
                </span>
              </a>
              <a className="path-card" href="/interoperability">
                <span className="path-number">02</span>
                <span>
                  <strong>Integration &amp; evidence layer</strong>
                  <small>Connect systems, preserve meaning, document evidence.</small>
                </span>
              </a>
            </div>
          </div>
          <div className="hero-art">
            <div className="hero-art-frame">
              <img src="/hero-lamp-editorial.png" alt="Hand-drawn IML lamp illuminating connected evidence paths" />
            </div>
          </div>
        </div>
        <div className="shell principle">
          <span />
          <p>Health is the objective. Trustworthy information is the foundation. Interoperability is the path.</p>
          <span />
        </div>
      </section>

      <section className="vision home-intro" aria-labelledby="home-intro-heading">
        <div className="shell vision-grid">
          <div>
            <p className="section-kicker">One environment · two paths</p>
            <h2 id="home-intro-heading">A reference workspace and an open way to connect what already exists.</h2>
          </div>
          <p>
            IML does not impose an exclusive monolith. It brings together a modular clinical foundation and an integration approach for software, laboratories, registries, payers and national infrastructure.
          </p>
        </div>
      </section>
    </PageFrame>
  );
}

function CountryProfilesPage() {
  return (
    <PageFrame active="/country-profiles">
      <PageMasthead
        eyebrow="Country evidence"
        title="Country profiles"
        lede="Explore evidence, sources and limitations. Profiles support inquiry; they are not rankings."
      />
      <section className="section profiles-section" aria-labelledby="profiles-heading">
        <div className="shell">
          <div className="profiles-heading">
            <p className="section-kicker">Live explorer</p>
            <p id="profiles-heading">Select any country on the map. Neutral means not yet examined, never low maturity.</p>
          </div>
          <CountryExplorer />
        </div>
      </section>
    </PageFrame>
  );
}

function ManuscriptsPage() {
  return (
    <PageFrame active="/manuscripts">
      <PageMasthead
        eyebrow="Scientific foundations"
        title="Manuscripts"
        lede="Founding vision and technical architecture for scientific review."
      />
      <section className="section manuscripts-section" aria-labelledby="manuscripts-heading">
        <div className="shell manuscript-layout">
          <div className="section-intro">
            <p className="section-kicker">Documents</p>
            <h2 id="manuscripts-heading">Read the current foundations.</h2>
          </div>
          <div className="manuscript-cards" aria-label="IML manuscripts">
            <article>
              <span>Manuscript 01</span>
              <h3>Founding vision</h3>
              <p>Why fragmented information harms care, and why a health information environment must be open, accountable and clinically grounded.</p>
              <a className="button primary" href={`${BASE_URL}IML_Founding_Manuscript.pdf`} target="_blank" rel="noreferrer">
                Read founding manuscript ↗
              </a>
            </article>
            <article>
              <span>Manuscript 02</span>
              <h3>Technical architecture</h3>
              <p>How modular software, interoperability layers, evidence and correction can form a coherent implementation path.</p>
              <a className="button secondary" href={`${BASE_URL}IML_Technical_Manuscript.pdf`} target="_blank" rel="noreferrer">
                Read technical manuscript ↗
              </a>
            </article>
          </div>
        </div>
      </section>
    </PageFrame>
  );
}

function IdentityTrustPage() {
  return (
    <PageFrame active="/identity-trust">
      <PageMasthead
        eyebrow="Identity infrastructure"
        title="Identity & Trust"
        lede="Identity is an enabling layer for continuity and accountability, not the whole of interoperability."
      />
      <section className="section vision-page" id="identity-trust" aria-labelledby="identity-trust-heading">
        <div className="shell next-paths-grid">
          <div className="section-intro">
            <p className="section-kicker">Identity · consent · provenance</p>
            <h2 id="identity-trust-heading">From trusted identity to authorised health and research linkage.</h2>
          </div>
          <div className="vision-prose">
            <p>
              IML does not replace national identity systems. It explores how recognised national identifiers can support authorised multicentre, longitudinal and epidemiological work while preserving national governance.
            </p>
            <p>
              Identity, identifier, access token and carrier mechanism must remain distinct. A QR code or mobile application should carry only a temporary signed token or a verifiable digital certificate, never sensitive identity or health information in clear text.
            </p>
            <p>
              The approach complements the <a className="text-link" href="https://id4d.worldbank.org/" target="_blank" rel="noopener noreferrer">World Bank ID4D initiative ↗</a> and may build on trust infrastructures such as the <a className="text-link" href="https://www.who.int/initiatives/global-digital-health-certification-network" target="_blank" rel="noopener noreferrer">WHO Global Digital Health Certification Network ↗</a>.
            </p>
            <div className="not-ranking">
              <strong>Governance boundary.</strong> Any universal linkage mechanism would remain regulated personal data and would require legal, ethical, security and equity review before implementation.
            </div>
          </div>
        </div>
      </section>
    </PageFrame>
  );
}

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
  "#id4d": "/identity-trust",
  "#evaluation": "/interoperability",
  "#methodology": "/interoperability#methodology",
  "#world": "/country-profiles",
  "#profiles": "/country-profiles",
  "#contact": "/collaborate",
};

const LEGACY_PATHS = {
  "/id4d": "/identity-trust",
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
}

function addIdentityTrustLinks(activePath) {
  const navs = document.querySelectorAll(".desktop-nav, .mobile-menu nav");

  navs.forEach((nav) => {
    let link = nav.querySelector('a[data-iml-identity-trust="true"]');
    if (!link) {
      link = document.createElement("a");
      link.href = "/identity-trust";
      link.textContent = "Identity & Trust";
      link.dataset.imlIdentityTrust = "true";

      const visionLink = nav.querySelector('a[href="/vision"]');
      if (visionLink) {
        visionLink.insertAdjacentElement("afterend", link);
      } else {
        nav.prepend(link);
      }
    }

    if (activePath === "/identity-trust") {
      link.setAttribute("aria-current", "page");
    } else {
      link.removeAttribute("aria-current");
    }
  });
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
      addIdentityTrustLinks(location.routePath);
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
      <style>{REFERENCE_ADJUSTMENTS}</style>
      <Page />
    </>
  );
}
