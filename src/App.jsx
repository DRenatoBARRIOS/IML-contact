import { useEffect } from "react";
import InteroperabilityPage from "./pages/InteroperabilityPage.jsx";
import CollaboratePage from "./pages/CollaboratePage.jsx";
import NotFoundPage from "./pages/NotFoundPage.jsx";
import CountryExplorer from "./components/CountryExplorer.jsx";
import PageMasthead from "./components/PageMasthead.jsx";
import PageFrame from "./components/SiteChrome.jsx";

const BASE_URL = import.meta.env.BASE_URL || "/";

const clinicalModules = [
  ["Patient identity", "Reliable identification, duplicate prevention and correction."],
  ["Consultation & terminology", "A coherent encounter record that preserves local clinical language."],
  ["Laboratories & results", "Structured requests and traceable results with explicit provenance."],
  ["Audit & correction", "Attributable actions and visible, safely propagated corrections."],
];

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

  body[data-iml-route="/identity-trust"] .page-masthead-grid {
    min-height: 320px;
    grid-template-columns: minmax(0, 1.45fr) minmax(280px, .55fr);
    padding-block: 52px 62px;
  }

  body[data-iml-route="/identity-trust"] .page-masthead h1 {
    max-width: 1050px;
    font-size: clamp(3rem, 4.8vw, 5.15rem);
  }

  .identity-trust-section {
    background: var(--light);
    padding-block: clamp(48px, 6vw, 86px);
  }

  .identity-trust-card {
    border: 1px solid color-mix(in srgb, var(--teal) 42%, var(--line));
    border-radius: 24px;
    background: color-mix(in srgb, var(--teal-wash) 34%, var(--light));
    padding: clamp(28px, 4vw, 48px);
    box-shadow: 0 18px 48px rgba(19, 40, 58, .07);
  }

  .identity-trust-card h2 {
    margin: 0 0 20px;
    font-family: var(--font-source-serif), Georgia, serif;
    font-size: clamp(1.55rem, 2.2vw, 2.2rem);
    font-weight: 650;
    letter-spacing: -.025em;
    line-height: 1.15;
  }

  .identity-trust-card p {
    margin: 0;
    color: var(--soft);
    font-size: 1rem;
    line-height: 1.75;
  }

  .identity-trust-card p + p {
    margin-top: 18px;
  }

  @media (max-width: 760px) {
    body[data-iml-route="/country-profiles"] .page-masthead-grid,
    body[data-iml-route="/manuscripts"] .page-masthead-grid {
      padding-block: 38px 48px;
    }

    body[data-iml-route="/identity-trust"] .page-masthead-grid {
      min-height: auto;
      grid-template-columns: 1fr;
      padding-block: 38px 48px;
    }

    .identity-trust-card {
      border-radius: 18px;
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
              An open clinical workspace and an integration layer for systems that must cooperate without losing clinical meaning.
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
    </PageFrame>
  );
}

function VisionPage() {
  return (
    <PageFrame active="/vision">
      <PageMasthead
        eyebrow="Vision"
        title="One open environment. Two complementary paths."
        lede="IML links a modular clinical foundation with an open way to connect existing health information systems."
      />
      <section className="vision vision-page" aria-labelledby="vision-heading">
        <div className="shell vision-grid">
          <div>
            <p className="section-kicker">Purpose</p>
            <h2 id="vision-heading">Make trustworthy information useful across care.</h2>
          </div>
          <div className="vision-prose">
            <p>
              IML is not a new national silo. It is a vendor-neutral reference environment for clinical work, integration, evidence and correction.
            </p>
            <p>
              Identity remains a governed enabling layer. <a className="text-link" href="/identity-trust">Read Identity &amp; Trust →</a>
            </p>
          </div>
        </div>
      </section>
    </PageFrame>
  );
}

function ClinicalWorkspacePage() {
  return (
    <PageFrame active="/clinical-workspace">
      <PageMasthead
        eyebrow="Path 01 · Clinical foundation"
        title="A modular clinical workspace that can start small."
        lede="Open-source, inspectable and progressively deployable, with regional modules rather than a closed monolith."
      />
      <section className="section clinical-section" aria-labelledby="clinical-heading">
        <div className="shell section-split">
          <div className="section-intro sticky-intro">
            <p className="section-kicker">Current workstream</p>
            <span className="status-chip amber">Reference prototype</span>
            <h2 id="clinical-heading">Build on proven open-source foundations.</h2>
            <p>
              <a className="text-link" href="https://openmrs.org/" target="_blank" rel="noopener noreferrer">OpenMRS O3 ↗</a> is an important reference for the clinical workspace. IML explores how it can be complemented by regional packs and an independent integration layer.
            </p>
            <a className="text-link" href="/collaborate">Join the clinical workstream →</a>
          </div>
          <div className="module-grid">
            {clinicalModules.map(([title, copy], index) => (
              <article className="module-card" key={title}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <div><h3>{title}</h3><p>{copy}</p></div>
              </article>
            ))}
            <div className="design-note">
              <strong>Progressive deployment</strong>
              <p>Adopt and govern useful modules in stages; an initial installation should not require an entire national architecture.</p>
            </div>
          </div>
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
        title="Identity, consent and trust across fragmented systems"
        lede="Identity is an enabling layer for continuity and accountability, not the whole of interoperability."
      />
      <section className="identity-trust-section" id="identity-trust" aria-labelledby="identity-trust-heading">
        <div className="shell">
          <article className="identity-trust-card">
            <h2 id="identity-trust-heading">From trusted identity to authorised health and research linkage</h2>
            <p>
              IML does not propose replacing national identity systems. It explores how recognised national identifiers could contribute to a future universal health and research number for authorised multicentre, longitudinal and epidemiological studies. It complements the <a className="text-link" href="https://id4d.worldbank.org/" target="_blank" rel="noopener noreferrer">World Bank ID4D initiative ↗</a> and may build on trust infrastructures such as the <a className="text-link" href="https://www.who.int/initiatives/global-digital-health-certification-network" target="_blank" rel="noopener noreferrer">WHO Global Digital Health Certification Network ↗</a>.
            </p>
            <p>
              National models already differ. A future IML model could combine the national identifier namespace, a governed geographic reference and a protected keyed hash. The resulting number would remain regulated personal data and would require legal, ethical, security and equity review before implementation.
            </p>
            <p>
              Identity, identifier, access token and carrier mechanism must remain distinct. A QR code or mobile application should carry only a temporary signed token or a verifiable digital certificate, never sensitive identity or health information in clear text.
            </p>
            <p>
              The country-level <a className="text-link" href="https://monitor.digitalhealthmonitor.org/map" target="_blank" rel="noopener noreferrer">Global Digital Health Monitor map ↗</a> provides information on digital health. IML is different: it develops an independent comparative framework designed to guide structured country research, verify documentary evidence, identify information gaps and support contextual human validation.
            </p>
          </article>
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

function ensureIdentityTrustLinks(activePath) {
  document.querySelectorAll(".desktop-nav, .mobile-menu nav").forEach((nav) => {
    let link = nav.querySelector('a[href="/identity-trust"]');
    if (!link) {
      link = document.createElement("a");
      link.href = "/identity-trust";
      link.textContent = "Identity & Trust";
      const visionLink = nav.querySelector('a[href="/vision"]');
      if (visionLink) visionLink.insertAdjacentElement("afterend", link);
      else nav.prepend(link);
    }
    if (activePath === "/identity-trust") link.setAttribute("aria-current", "page");
    else link.removeAttribute("aria-current");
  });

  const projectFooter = [...document.querySelectorAll(".footer-grid > div")]
    .find((section) => section.querySelector("h3")?.textContent.trim() === "Project");
  if (projectFooter && !projectFooter.querySelector('a[href="/identity-trust"]')) {
    const link = document.createElement("a");
    link.href = "/identity-trust";
    link.textContent = "Identity & Trust";
    const visionLink = projectFooter.querySelector('a[href="/vision"]');
    if (visionLink) visionLink.insertAdjacentElement("afterend", link);
    else projectFooter.append(link);
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
      ensureIdentityTrustLinks(location.routePath);
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
