import logoImage from "../assets/iml-logo.png";
import heroLampImage from "../assets/hero-lamp-editorial.png";
import CountryExplorer from "../features/countries/CountryExplorer.jsx";
import { navigation, interoperabilityLayers } from "../siteConfig.js";
import { latestRegulatoryWatch } from "../data/regulatoryWatch.js";
import { latestSoftwareWatch } from "../data/softwareWatch.js";

const BASE_URL = import.meta.env.BASE_URL || "/";

function SiteHeader({ active, home }) {
  return (
    <header className="site-header">
      <div className="shell header-inner">
        <a className={`brand${home ? " brand-home" : ""}`} href="/" aria-label="IML Health home">
          <span className="brand-mark" aria-hidden="true">
            <img src={logoImage} alt="" width="54" height="64" />
          </span>
          <span className="brand-copy">
            <strong>IML Health</strong>
            <span>Open Health Information Environment</span>
          </span>
        </a>
        <nav className="desktop-nav" aria-label="Primary navigation">
          {navigation.map((item) => (
            <a href={item.href} key={item.href} aria-current={active === item.href ? "page" : undefined}>{item.label}</a>
          ))}
        </nav>
        <details className="mobile-menu">
          <summary>Menu</summary>
          <nav aria-label="Mobile navigation">
            <a href="/" aria-current={active === "/" ? "page" : undefined}>Home</a>
            {navigation.map((item) => (
              <a href={item.href} key={item.href} aria-current={active === item.href ? "page" : undefined}>{item.label}</a>
            ))}
          </nav>
        </details>
      </div>
    </header>
  );
}

function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="shell footer-grid">
        <div className="footer-brand">
          <div>
            <strong>IML Health</strong>
            <p>Independent, non-commercial and open for scientific review.</p>
          </div>
        </div>
        <div>
          <h3>Explore</h3>
          <a href="/clinical-workspace">Clinical workspace</a>
          <a href="/interoperability">Interoperability</a>
          <a href="/country-profiles">Country profiles</a>
        </div>
        <div>
          <h3>Project</h3>
          <a href="/identity-trust">Identity &amp; Trust</a>
          <a href="/manuscripts">Manuscripts</a>
          <a href="/collaborate">Collaborate</a>
        </div>
      </div>
      <div className="shell footer-bottom">
        <span>© {new Date().getFullYear()} IML Health</span>
      </div>
    </footer>
  );
}

function PageFrame({ active, home = false, children }) {
  return (
    <>
      <a className="skip-link" href="#page-content">Skip to the content</a>
      <SiteHeader active={active} home={home} />
      <main id="page-content">{children}</main>
      <div className="page-ornament" aria-hidden="true">
        <span />
        <i />
        <i />
        <span />
      </div>
      <SiteFooter />
    </>
  );
}

function ProgressionField({ step }) {
  const drawing = (() => {
    switch (step) {
      case "identity":
        return (
          <>
            <path className="progression-sage" d="M-100 500 C350 485 660 410 1000 360" />
            <path className="progression-gold" d="M1000 360 C1230 360 1425 255 1680 190" />
            <circle className="progression-ring progression-ring-primary" cx="1085" cy="360" r="92" />
            <circle className="progression-ring progression-ring-secondary" cx="1085" cy="360" r="154" />
            <circle className="progression-node progression-node-focus" cx="1085" cy="360" r="8" />
            <circle className="progression-node" cx="725" cy="420" r="4" />
            <circle className="progression-node progression-node-gold" cx="1375" cy="245" r="4" />
          </>
        );

      case "clinical":
        return (
          <>
            <path className="progression-sage" d="M-70 605 C265 550 480 480 710 360 C930 245 1190 170 1680 118" />
            <path className="progression-gold" d="M55 710 C350 590 550 520 755 410 C975 295 1245 255 1680 255" />
            <path className="progression-soft" d="M610 225 L790 350 L660 510 L875 575" />
            <circle className="progression-node" cx="610" cy="225" r="5" />
            <circle className="progression-node progression-node-focus" cx="790" cy="350" r="7" />
            <circle className="progression-node progression-node-gold" cx="660" cy="510" r="5" />
            <circle className="progression-node" cx="875" cy="575" r="5" />
            <circle className="progression-node" cx="1090" cy="255" r="5" />
          </>
        );

      case "interoperability":
        return (
          <>
            <path className="progression-sage" d="M85 205 C330 60 575 125 790 360 C995 590 1240 650 1515 515" />
            <path className="progression-gold" d="M95 530 C350 660 600 565 790 360 C985 150 1230 90 1515 220" />
            <path className="progression-soft" d="M255 180 L430 270 L310 430 L505 515 L790 360" />
            <path className="progression-soft" d="M790 360 L1100 190 L1280 280 L1170 435 L1405 505" />
            {[["255","180"],["430","270"],["310","430"],["1100","190"],["1170","435"],["1405","505"]].map(([cx, cy]) => (
              <circle className="progression-node" cx={cx} cy={cy} r="4" key={`${cx}-${cy}`} />
            ))}
            <circle className="progression-node progression-node-gold" cx="505" cy="515" r="4" />
            <circle className="progression-node progression-node-gold" cx="1280" cy="280" r="4" />
            <circle className="progression-node progression-node-focus" cx="790" cy="360" r="7" />
          </>
        );

      case "countries":
        return (
          <>
            <ellipse className="progression-sage progression-orbit" cx="800" cy="360" rx="760" ry="262" />
            <ellipse className="progression-gold progression-orbit" cx="800" cy="360" rx="525" ry="350" />
            <path className="progression-soft" d="M0 350 C325 250 555 255 800 360 C1055 470 1285 470 1600 360" />
            <circle className="progression-node" cx="220" cy="288" r="4" />
            <circle className="progression-node progression-node-gold" cx="470" cy="232" r="4" />
            <circle className="progression-node progression-node-focus" cx="800" cy="360" r="6" />
            <circle className="progression-node" cx="1125" cy="445" r="4" />
            <circle className="progression-node progression-node-gold" cx="1380" cy="410" r="4" />
          </>
        );

      case "manuscripts":
        return (
          <>
            <path className="progression-sage" d="M-70 160 C245 115 430 205 635 300 C805 375 970 390 1660 390" />
            <path className="progression-gold" d="M-70 535 C250 590 435 510 635 420 C810 343 975 330 1660 330" />
            <path className="progression-soft progression-writing" d="M900 430 H1510" />
            <path className="progression-soft progression-writing" d="M990 478 H1460" />
            <path className="progression-soft progression-writing" d="M1060 526 H1385" />
            <circle className="progression-node progression-node-focus" cx="635" cy="360" r="6" />
            <circle className="progression-node progression-node-gold" cx="1015" cy="390" r="4" />
            <circle className="progression-node" cx="1320" cy="330" r="4" />
          </>
        );

      default:
        return null;
    }
  })();

  if (!drawing) return null;

  return (
    <svg
      className={`progression-field progression-field-${step}`}
      viewBox="0 0 1600 720"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
      focusable="false"
    >
      <g>{drawing}</g>
    </svg>
  );
}

function PageMasthead({
  title,
  lede,
  compact = false,
  mirroredLamp = false,
  visualStep = null,
}) {
  const progressionClass = visualStep ? ` has-progression progression-step-${visualStep}` : "";

  return (
    <section className={`page-masthead${compact ? " page-masthead-compact" : ""}${progressionClass}`}>
      {visualStep ? <ProgressionField step={visualStep} /> : null}
      <div className="shell page-masthead-grid">
        <div>
          <a className="back-home" href="/">← IML Health home</a>
          <h1>{title}</h1>
        </div>
        {mirroredLamp ? (
          <div className="collaborate-masthead-aside">
            <div className="collaborate-lamp-frame" aria-hidden="true">
              <img src={heroLampImage} alt="" />
            </div>
            <p>{lede}</p>
          </div>
        ) : <p>{lede}</p>}
      </div>
    </section>
  );
}

function WatchPanel({ label, entry }) {
  if (!entry) return null;
  const monitoredSources = Array.isArray(entry.monitoredSources)
    ? entry.monitoredSources.join(", ")
    : entry.monitoredSources;

  return (
    <details className="evidence-register watch-panel">
      <summary>
        <span>
          <strong>{label}</strong>
          <small>{entry.dateLabel || entry.date}{entry.scope ? ` · ${entry.scope}` : ""}</small>
        </span>
        <span>+</span>
      </summary>
      <div className="evidence-list">
        <article className="evidence-item">
          {entry.title ? <p><b>{entry.title}</b></p> : null}
          {entry.summary ? <p>{entry.summary}</p> : null}
          {entry.imlImpact ? <p><b>IML impact.</b> {entry.imlImpact}</p> : null}
          {entry.note ? <p>{entry.note}</p> : null}
          {entry.sources?.length ? (
            <>
              <p><b>Sources</b></p>
              <ul>
                {entry.sources.map((source) => (
                  <li key={source.url || source.label}>
                    <a className="text-link" href={source.url} target="_blank" rel="noopener noreferrer">
                      {source.label} ↗
                    </a>
                  </li>
                ))}
              </ul>
            </>
          ) : null}
          {monitoredSources ? <p><small>Sources monitored by IML: {monitoredSources}.</small></p> : null}
        </article>
      </div>
    </details>
  );
}

function HomePage() {
  return (
    <PageFrame active="/" home>
      <section className="hero" id="top">
        <div className="shell hero-grid">
          <div className="hero-copy">
            <h1>Health information should illuminate care — not fragment it.</h1>
            <p className="hero-lede">
              An open clinical workspace and an integration layer for systems that must cooperate without losing clinical meaning.
            </p>
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
                  <strong>Interoperability</strong>
                  <small>Connect systems, preserve meaning, document evidence.</small>
                </span>
              </a>
            </div>
          </div>
          <div className="hero-art">
            <div className="hero-art-frame">
              <img src={heroLampImage} alt="Hand-drawn IML lamp illuminating connected evidence paths" />
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

function ClinicalWorkspacePage() {
  return (
    <PageFrame active="/clinical-workspace">
      <PageMasthead
        title="Primary care deserves software that can be trusted, adapted and kept."
        lede="Open-source software is needed so that primary-care teams can adapt, maintain and share the tools on which care depends."
        visualStep="clinical"
      />
      <section className="section clinical-section" aria-labelledby="clinical-heading">
        <div className="shell primary-care-layout">
          <div className="section-intro sticky-intro">
            <p className="section-kicker">The clinical need</p>
            <h2 id="clinical-heading">Care should not be held hostage by its software.</h2>
            <p>
              The record should support listening, examining, deciding, prescribing, follow-up and correction. IML develops an open clinical workspace that can start small, connect to existing systems and keep data understandable and exportable.
            </p>
          </div>
          <div className="primary-care-content">
            <div className="primary-care-promise">
              <span>01</span>
              <div>
                <h3>Useful at the point of care</h3>
                <p>A coherent consultation record, local terminology, results with provenance and a clear clinical history — without making the clinician work for the system.</p>
              </div>
            </div>
            <div className="primary-care-promise">
              <span>02</span>
              <div>
                <h3>Open to scrutiny and improvement</h3>
                <p>Code, data structures and corrections can be inspected, tested and improved by clinicians, universities and communities.</p>
              </div>
            </div>
            <div className="primary-care-promise">
              <span>03</span>
              <div>
                <h3>Adaptable without vendor lock-in</h3>
                <p>Regional packs can add language, terminology and national services without changing the common core.</p>
              </div>
            </div>

            <aside className="clinical-reference">
              <strong>Build with existing open-source work.</strong>
              <p>
                IML reviews mature open-source health software before rebuilding existing functions.
                <a className="text-link" href="https://openmrs.org/" target="_blank" rel="noopener noreferrer"> OpenMRS ↗</a> informs clinical record design,
                <a className="text-link" href="https://hapifhir.io/" target="_blank" rel="noopener noreferrer"> HAPI FHIR ↗</a> provides a reference for FHIR interoperability, and
                <a className="text-link" href="https://www.orthanc-server.com/" target="_blank" rel="noopener noreferrer"> Orthanc ↗</a> demonstrates a lightweight open approach to medical imaging.
              </p>
              <p className="ai-regulatory-note"><b>Responsible AI.</b> AI-assisted functions must remain traceable, proportionate and subject to professional review and validation.</p>
            </aside>

            {latestSoftwareWatch ? <WatchPanel label="Latest open-source software watch" entry={latestSoftwareWatch} /> : null}
            <WatchPanel label="Latest regulatory watch" entry={latestRegulatoryWatch} />

            <div className="clinical-action-row">
              <a className="text-link" href="/collaborate">Join the clinical workstream →</a>
              <a className="text-link" href="/manuscripts">Read the founding manuscript →</a>
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
        title="Country profiles"
        lede="Explore evidence, sources and limitations. Profiles support inquiry; they are not rankings."
        visualStep="countries"
      />
      <section className="section profiles-section" aria-labelledby="profiles-heading">
        <div className="shell">
          <div className="profiles-heading">
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
        title="Manuscripts"
        lede="Founding vision and technical architecture for scientific review."
        visualStep="manuscripts"
      />
      <section className="section manuscripts-section" aria-labelledby="manuscripts-heading">
        <div className="shell manuscript-layout">
          <div className="section-intro">
            <h2 id="manuscripts-heading">Read the current foundations.</h2>
          </div>
          <div className="manuscript-cards" aria-label="IML manuscripts">
            <article>
              <h3>Founding vision</h3>
              <p>Why fragmented information harms care, and why a health information environment must be open, accountable and clinically grounded.</p>
              <a className="button primary" href={`${BASE_URL}IML_Founding_Manuscript.pdf`} target="_blank" rel="noreferrer">
                Read founding manuscript ↗
              </a>
            </article>
            <article>
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
        title="Identity, consent and trust across fragmented systems"
        lede="Identity enables continuity and accountability, but it is only one layer of interoperability."
        visualStep="identity"
      />
      <section className="identity-trust-section" id="identity-trust" aria-labelledby="identity-trust-heading">
        <div className="shell">
          <article className="identity-trust-card">
            <h2 id="identity-trust-heading">Trust before linkage.</h2>
            <p>IML works with recognised national identity and trust infrastructures rather than proposing a parallel identity system.</p>

            <div className="primary-care-content">
              <div className="primary-care-promise">
                <span>01</span>
                <div>
                  <h3>Use national identity, do not replace it</h3>
                  <p>National identifiers can support continuity and authorised linkage. IML complements the <a className="text-link" href="https://id4d.worldbank.org/" target="_blank" rel="noopener noreferrer">World Bank ID4D initiative ↗</a> and may build on trust infrastructures such as the <a className="text-link" href="https://www.who.int/initiatives/global-digital-health-certification-network" target="_blank" rel="noopener noreferrer">WHO Global Digital Health Certification Network ↗</a>.</p>
                </div>
              </div>
              <div className="primary-care-promise">
                <span>02</span>
                <div>
                  <h3>Separate identity, identifiers and access</h3>
                  <p>A QR code or mobile application should carry only a temporary signed token or verifiable certificate, never sensitive identity or health information in clear text.</p>
                </div>
              </div>
              <div className="primary-care-promise">
                <span>03</span>
                <div>
                  <h3>Enable governed health and research linkage</h3>
                  <p>A future IML model could combine national identifier namespaces, governed geographic references and protected keyed hashes. Any implementation would require legal, ethical, security and equity review.</p>
                </div>
              </div>
            </div>

            <aside className="clinical-reference">
              <strong>How IML differs from GDHM</strong>
              <p>The <a className="text-link" href="https://monitor.digitalhealthmonitor.org/map" target="_blank" rel="noopener noreferrer">Global Digital Health Monitor map ↗</a> provides comparative digital-health information. IML uses public information as possible evidence, but develops an independent framework for documentary verification, information gaps, interoperability and contextual human validation.</p>
            </aside>
          </article>
        </div>
      </section>
    </PageFrame>
  );
}


function InteroperabilityPage() {
  return (
    <PageFrame active="/interoperability">
      <PageMasthead
        title="Open-source health interoperability."
        lede="A connection becomes useful only when technical exchange, shared meaning, workflow, governance and clinical purpose hold together."
        visualStep="interoperability"
      />
      <section className="section interoperability-section" aria-labelledby="layers-heading">
        <div className="shell">
          <div className="wide-heading"><div><h2 id="layers-heading">Exchange must preserve meaning and responsibility.</h2></div><p>IML treats interoperability as an end-to-end clinical and institutional capability rather than a narrow interface project.<br /><br /><small><span lang="fr">Interopérabilité open source en santé</span> · <span lang="es">Interoperabilidad de código abierto en salud</span> · <span lang="zh-Hans">开源医疗信息互操作性</span></small></p></div>
          <div className="layer-grid">{interoperabilityLayers.map(([number, title, copy]) => <article key={title}><span>{number}</span><h3>{title}</h3><p>{copy}</p></article>)}</div>
          <div className="information-flow" aria-label="Information flow from source systems to learning">
            <div><small>Existing sources</small><strong>EHRs · labs · registries · payers</strong></div><i>→</i>
            <div><small>Trust layer</small><strong>Identity · consent · terminology</strong></div><i>→</i>
            <div><small>Clinical use</small><strong>Workspace · public health</strong></div><i>→</i>
            <div><small>Learning</small><strong>Evidence · correction · feedback</strong></div>
          </div>
          <div className="demonstrator-grid">
            <article><h3>AMR / BMR continuity</h3><p>Trace culture, susceptibility, antimicrobial decisions and feedback without detaching a laboratory result from its clinical context.</p></article>
            <article><h3>Payer interoperability</h3><p>Connect coverage and reimbursement processes to care without allowing administrative exchange to distort the clinical record.</p></article>
            <article><h3>Identity, consent &amp; access</h3><p>Use short-lived signed tokens for access workflows, while keeping sensitive health information out of clear-text carriers.</p></article>
          </div>
          <div className="clinical-action-row" id="methodology">
            <a className="text-link" href="/country-profiles">How IML evaluates evidence → Country Profiles</a>
          </div>
        </div>
      </section>
    </PageFrame>
  );
}

function CollaboratePage() {
  return (
    <PageFrame active="/collaborate">
      <PageMasthead title="Bring evidence, clinical reality or implementation experience." lede="IML is independent, non-commercial and open to rigorous contribution." mirroredLamp />
      <section className="section collaborate-section" aria-labelledby="collaborate-heading">
        <div className="shell collaborate-layout">
          <div><h2 id="collaborate-heading">A concrete contribution is better than a broad endorsement.</h2><p>Tell us what you know, what should be corrected and what you would be prepared to test.</p><a className="button amber-button" href="mailto:iml.health@pm.me?subject=IML%20collaboration">Write to iml.health@pm.me</a></div>
          <div className="audience-grid">
            <article><span>01</span><h3>Clinicians &amp; country reviewers</h3><p>Test whether profiles reflect real care and flag overstatement, omissions or outdated evidence.</p></article>
            <article><span>02</span><h3>Universities &amp; researchers</h3><p>Strengthen the method, validation design and scientific critique.</p></article>
            <article><span>03</span><h3>Institutions &amp; implementers</h3><p>Explore pragmatic pilots without creating another closed dependency.</p></article>
            <article><span>04</span><h3>Open-source developers</h3><p>Build small, reviewable modules and integration demonstrations.</p></article>
          </div>
        </div>
      </section>
    </PageFrame>
  );
}

function NotFoundPage() {
  return (
    <PageFrame active="/">
      <PageMasthead title="This page is not part of the current IML site." lede="Use the navigation or return to the project home." />
      <section className="section"><div className="shell"><a className="button primary" href="/">Return to IML Health</a></div></section>
    </PageFrame>
  );
}

export {
  HomePage,
  IdentityTrustPage,
  ClinicalWorkspacePage,
  InteroperabilityPage,
  CountryProfilesPage,
  ManuscriptsPage,
  CollaboratePage,
  NotFoundPage,
};
