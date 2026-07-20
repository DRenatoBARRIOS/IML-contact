import React, { useEffect, useMemo, useState } from "react";
import logoImage from "./assets/iml-logo.png";
import { loadGlobalMapProfiles } from "./services/countriesApi.js";
import WorldMap from "./components/WorldMap.jsx";
import CountryProfile from "./components/CountryProfile.jsx";
import {
  asArray,
  normalizeIso3,
} from "./utils/countryMapUtils.js";
import "./App.css";

const MANUSCRIPT_URL = `${import.meta.env.BASE_URL}IML_Founding_Manuscript.pdf`;
const TECHNICAL_MANUSCRIPT_URL = `${import.meta.env.BASE_URL}IML_Technical_Manuscript.pdf`;

const ROUTES = [
  ["home", "Home"],
  ["id4d", "Identity & Trust"],
  ["evaluation", "From assessment to action"],
  ["methodology", "Methodology"],
  ["world", "World Map"],
  ["contact", "Scientific Review"],
].map(([key, label]) => ({ key, label }));

const IML_DOMAINS = [
  {
    key: "governance",
    short: "GOV",
    axis: "Governance",
    title: "Governance and Standards",
    description: "Responsibilities, standards, legal clarity and accountable ecosystem governance.",
  },
  {
    key: "technical",
    short: "TEC",
    axis: "Technical",
    title: "Technical Interoperability",
    description: "Secure, reliable and maintainable exchange across heterogeneous systems.",
  },
  {
    key: "identity",
    short: "ID",
    axis: "Identity",
    title: "Identity, Consent and Trust",
    description: "Reliable identification, appropriate consent, provenance and confidence.",
  },
  {
    key: "adoption",
    short: "USE",
    axis: "Adoption",
    title: "Adoption and Use",
    description: "Integration into workflows, training, access rights and professional roles.",
  },
  {
    key: "security",
    short: "SEC",
    axis: "Security",
    title: "Security and Resilience",
    description: "Protection, availability, recovery, traceability and continuity.",
  },
  {
    key: "learning",
    short: "LRN",
    axis: "Learning",
    title: "Feedback, Correction and Learning",
    description: "Correction pathways, evaluation and institutional learning.",
  },
];

const cls = (...items) => items.filter(Boolean).join(" ");

function Card({ children, className = "" }) {
  return <div className={cls("card", className)}>{children}</div>;
}

function LogoMark() {
  return (
    <div className="logo-box">
      <img src={logoImage} className="logo-svg" alt="IML logo" />
    </div>
  );
}

function NavButton({ active, children, onClick }) {
  return (
    <button type="button" onClick={onClick} className={cls("nav-button", active && "nav-button-active")}>
      {children}
    </button>
  );
}

function SectionTitle({ badge, title, text }) {
  return (
    <div className="section-heading">
      {badge ? <div className="section-badge">{badge}</div> : null}
      <h2>{title}</h2>
      <p>{text}</p>
    </div>
  );
}

function MetricCard({ symbol, title, value, subtitle }) {
  return (
    <Card className="metric-card">
      <div className="metric-symbol">{symbol}</div>
      <div>
        <div className="metric-title">{title}</div>
        <div className="metric-value">{value}</div>
        <div className="metric-subtitle">{subtitle}</div>
      </div>
    </Card>
  );
}

function HomePage() {
  return (
    <>
      <section className="hero"><div className="container hero-grid">
        <div className="hero-copy">
          <div className="section-badge">Open for scientific review</div>
          <h1>A scientific framework for trusted Health Information Ecosystems.</h1>
          <div className="principle-stack">
            <div className="principle-line">Health is the objective.</div>
            <div className="principle-line">Trustworthy information is the foundation.</div>
            <div className="principle-line">Interoperability is the path.</div>
          </div>
          <p className="hero-text">IML helps researchers, clinicians, institutions, engineers, payers and public decision-makers assess how health information is generated, trusted, exchanged and used.</p>
          <p className="hero-text">The current website is a public review interface and PostgreSQL test environment. Country profiles remain documented working analyses pending institutional and local expert review. It creates multidimensional profiles, documents evidence and uncertainty, and identifies practical improvement pathways.</p>
          <Card className="note-box"><p>IML is designed as an orientation engine rather than a certification system. Its purpose is to illuminate fragmented health information environments, identify possible pathways into a health problem, reveal barriers and blind spots, and indicate where further investigation may be most useful. The engine continuously updates indicative information as new signals, sources and connections become available. Human validation is not required for every correction or recalculation. It becomes necessary only when an indicative result is promoted as formally validated evidence, used to support a decision, or incorporated into an authoritative country assessment.IML is therefore a lamp rather than a verdict: it helps make visible the information pathways surrounding disease.</p></Card>
          <div className="button-row">
            <a className="primary-button" href={MANUSCRIPT_URL} download>Download the Founding Manuscript</a>
            <a className="secondary-button" href="#methodology">Explore the methodology</a>
          </div>
          <div className="metric-grid two-up top-gap-small">
            <MetricCard symbol="5L" title="Interoperability" value="5 layers" subtitle="Technical, semantic, organisational, institutional, and clinical/public health." />
            <MetricCard symbol="6D" title="Assessment" value="6 domains" subtitle="A health-oriented maturity profile linked to documentary evidence." />
          </div>
        </div>
        <Card className="overview-card"><div className="overview-top"><LogoMark /><div><div className="eyebrow">Interoperability Maturity Lab</div><div className="overview-title">From information to better health</div></div></div>
          <div className="tile-grid three-up">{[
            ["Health Information Ecosystems", "The ecosystem, not an isolated application, is the principal unit of analysis."],
            ["AMR / BMR demonstrator", "UTI and multidrug-resistant E. coli provide the first operational thread."],
            ["Human validation", "Automated research support organises evidence; scientific interpretation remains human."],
          ].map(([title, text]) => <div key={title} className="mini-tile"><div className="mini-tile-title">{title}</div><div className="mini-tile-text">{text}</div></div>)}</div>
        </Card>
      </div></section>
      <section className="section"><div className="container"><Card className="soft-card"><div className="content-block"><div className="section-badge">Positioning</div><h3>Complementary to digital health maturity initiatives</h3><p>IML does not duplicate national digital health dashboards. It asks a narrower question: whether documented capacity preserves clinical meaning, context, trust, correction and usefulness across Health Information Ecosystems.</p></div></Card></div></section>
    </>
  );
}

function MethodologyPage() {
  return (
    <section className="section"><div className="container">
      <SectionTitle badge="IML Framework" title="Evidence-guided, human-validated country profiles" text="The PostgreSQL model records countries, profile versions, six domain scores, indicators, institutional sources, evidence links, limitations and review status." />
      <Card className="soft-card"><div className="content-block">
        <h3>What the country engine does</h3>
        <p>It provides a documented starting point for research, not an automatic verdict. Documentary discovery and link checks can be assisted by software, while source selection, interpretation, score attribution and publication remain human responsibilities.</p>
        <p>Each indicator should be linked to the most precise available institutional page: a programme, register, implementation guide, legal text, technical specification, audit or evaluation. A general homepage is insufficient when a specific source exists.</p>
        <p>The audit records whether a link is valid, redirected, dead, temporarily unavailable or technically blocked by Cloudflare, CloudFront, anti-bot protection or another access barrier. A technical block must not be misclassified as absence of evidence.</p>
        <p>Country performance and documentary confidence are separate. Strong evidence can support a low score, while a high-looking score may remain uncertain when implementation is poorly documented. Sources are linked to specific indicators, with limitations stated openly.</p>
        <div className="button-row"><a className="primary-button" href={TECHNICAL_MANUSCRIPT_URL} download>Download the Technical Manuscript</a><a className="secondary-button" href={MANUSCRIPT_URL} download>Download the Founding Manuscript</a></div>
      </div></Card>
      <div className="tile-grid three-up top-gap-small">
        {IML_DOMAINS.map((domain) => (
          <Card key={domain.key} className="value-card">
            <div className="metric-symbol">{domain.short}</div>
            <h3>{domain.title}</h3>
            <p>{domain.description}</p>
          </Card>
        ))}
      </div>
      <div className="split-grid top-gap">
        <Card className="soft-card"><div className="content-block"><h3>Five interacting layers</h3><ul className="compact-list"><li><strong>Technical:</strong> secure and reliable exchange.</li><li><strong>Semantic:</strong> preservation of meaning and context.</li><li><strong>Organisational:</strong> workflows and responsibilities.</li><li><strong>Institutional:</strong> readiness, responsiveness and collaboration.</li><li><strong>Clinical and public health:</strong> usefulness for care, prevention, surveillance and learning.</li></ul></div></Card>
        <Card className="soft-card"><div className="content-block"><h3>Cross-cutting dimensions</h3><ul className="compact-list"><li><strong>Institutional Engagement</strong></li><li><strong>Payer Interoperability</strong></li><li><strong>AI Readiness</strong></li><li><strong>Professional role alignment</strong></li></ul></div></Card>
      </div>
    </div></section>
  );
}
function Id4dPage() { return (<section className="section"><div className="container"><SectionTitle badge="Identity infrastructure" title="Identity, consent and trust across fragmented systems" text="Identity is an enabling layer for continuity and accountability, not the whole of interoperability." /><Card className="soft-card"><div className="content-block"><h3>From trusted identity to authorised health and research linkage</h3><p>IML does not propose replacing national identity systems. It explores how recognised national identifiers could contribute to a future universal health and research number for authorised multicentre, longitudinal and epidemiological studies. It complements the <a className="text-link" href="https://id4d.worldbank.org/" target="_blank" rel="noopener noreferrer">World Bank ID4D initiative ↗</a> and may build on trust infrastructures such as the <a className="text-link" href="https://www.who.int/initiatives/global-digital-health-certification-network" target="_blank" rel="noopener noreferrer">WHO Global Digital Health Certification Network ↗</a>.</p><p>National models already differ. A future IML model could combine the national identifier namespace, a governed geographic reference and a protected keyed hash. The resulting number would remain regulated personal data and would require legal, ethical, security and equity review before implementation.</p><p>Identity, identifier, access token and carrier mechanism must remain distinct. A QR code or mobile application should carry only a temporary signed token or a verifiable digital certificate, never sensitive identity or health information in clear text.</p><p>Country-level digital health information can be explored through the <a className="text-link" href="https://monitor.digitalhealthmonitor.org/map" target="_blank" rel="noopener noreferrer">Global Digital Health Monitor map ↗</a>. IML uses this comparative information as a starting point for structured country research, documentary verification and human validation.</p></div></Card></div></section>); }
function EvaluationPage() {
  return <section className="section"><div className="container"><SectionTitle badge="Operational pathway" title="From assessment to action" text="IML connects documented maturity profiles with practical improvement and concrete clinical or public-health pathways." />
    <div className="tile-grid three-up">
      <Card className="value-card"><div className="metric-symbol">AMR</div><h3>AMR / BMR demonstrator</h3><p>Links microbiology with symptoms, diagnosis, treatment, outcomes and public-health learning, beginning with UTI and multidrug-resistant <em>E. coli</em>.</p></Card>
      <Card className="value-card"><div className="metric-symbol">OCW</div><h3>Open Clinical Workspace</h3><p>An open-source, vendor-neutral and academically governed reference environment that can connect existing systems or provide a progressively deployable foundation where services are limited.</p></Card>
      <Card className="value-card"><div className="metric-symbol">Q</div><h3>Software quality</h3><p>Digital health quality is assessed through preservation of meaning, correction, auditability, security, resilience, portability, reversibility, accessibility and long-term maintainability.</p></Card>
    </div>
    <Card className="soft-card top-gap"><div className="content-block"><h3>First demonstrator pathway</h3><div className="stack-list">{["Symptoms, fever and clinical context.", "Urine testing, culture, bacterial count and antibiogram.", "Clinical interpretation and retained diagnosis.", "Treatment, evolution and outcome.", "Aggregated surveillance, correction and shared learning."].map((text, index) => <div className="list-box" key={text}><strong>{index + 1}.</strong> {text}</div>)}</div></div></Card>
  </div></section>;
}

function WorldPage() {
  const [profiles, setProfiles] = useState([]);
  const [selectedCountry, setSelectedCountry] = useState(null);
  const [warning, setWarning] = useState("");
  useEffect(() => {
    const controller = new AbortController();
    loadGlobalMapProfiles(controller.signal)
      .then((result) => { setProfiles(asArray(result.profiles)); setWarning(result.warning || ""); })
      .catch((error) => { if (error?.name !== "AbortError") { setProfiles([]); setWarning(error?.message || "Unable to load the Global Map API."); } });
    return () => controller.abort();
  }, []);
  const profileByIso3 = useMemo(
    () =>
      Object.fromEntries(
        profiles
          .map((profile) => [normalizeIso3(profile?.iso3), profile])
          .filter(([iso3]) => Boolean(iso3))
      ),
    [profiles]
  );
  const selectedProfile = selectedCountry
    ? profileByIso3[normalizeIso3(selectedCountry.iso3)]
    : null;
  return <section className="section"><div className="container"><SectionTitle badge="Global Map · PostgreSQL test" title="Maturity profiles, not country rankings" text="Country records use ISO alpha-3 codes and connect six domain scores to documented sources, evidence links, limitations and review status." />{warning ? <Card className="highlight-card"><div className="content-block"><h3>Country profiles temporarily unavailable</h3><p>{warning}</p></div></Card> : null}<div className="top-gap-small"><WorldMap profiles={profiles} selectedCountry={selectedCountry} onSelect={setSelectedCountry} /></div><div className="top-gap"><CountryProfile selectedCountry={selectedCountry} profile={selectedProfile} domains={IML_DOMAINS} /></div></div></section>;
}

function ContactPage() {
  const email = "iml.health@pm.me";
  const [copied, setCopied] = useState(false);
  const copyEmail = async () => {
    try { await navigator.clipboard.writeText(email); setCopied(true); window.setTimeout(() => setCopied(false), 1800); }
    catch { setCopied(false); }
  };
  return <section className="section"><div className="container"><SectionTitle badge="Open for scientific review" title="Scientific review and collaboration" text="IML welcomes methodological criticism, documentary review, local country expertise, clinical validation and proposals for institutional collaboration." /><div className="split-grid profile-grid"><Card><div className="content-block"><h3>Direct contact</h3><p>For scientific review, collaboration or questions about the framework, contact IML directly.</p><div className="mail-box"><a className="text-link" href={`mailto:${email}`}>{email}</a></div><div className="form-actions top-gap-small"><a className="primary-button" href={`mailto:${email}?subject=${encodeURIComponent("IML scientific review or collaboration")}`}>Send email</a><button type="button" className="secondary-button" onClick={copyEmail}>Copy email</button></div>{copied ? <p className="form-note top-gap-small">Email copied.</p> : null}</div></Card><Card className="soft-card"><div className="content-block"><h3>Country review</h3><p>Reviewers may propose a more precise institutional source, correct an interpretation, document implementation, identify a technical access block, or challenge a domain score. Every accepted change should remain traceable and versioned.</p></div></Card></div></div></section>;
}

function Footer() {
  return <footer className="footer"><div className="container footer-grid"><div><div className="footer-brand"><LogoMark /><div><div className="eyebrow">IML</div><div className="footer-title">Interoperability Maturity Lab</div></div></div><p className="footer-copy">Health is the objective. Trustworthy information is the foundation. Interoperability is the path.</p></div><div><div className="footer-label">Scientific status</div><p className="footer-copy">Independent, non-commercial and open for scientific review. The PostgreSQL map is a test environment for evidence-linked, versioned country profiles.</p></div></div></footer>;
}

export default function App() {
  const getHash = () => {
    if (typeof window === "undefined") return "home";
    const hash = window.location.hash.replace("#", "").trim();
    return ROUTES.some((route) => route.key === hash) ? hash : "home";
  };
  const [route, setRoute] = useState(getHash);
  useEffect(() => {
    const sync = () => setRoute(getHash());
    window.addEventListener("hashchange", sync);
    return () => window.removeEventListener("hashchange", sync);
  }, []);
  const goTo = (key) => {
    window.location.hash = key;
    window.scrollTo({ top: 0, behavior: "smooth" });
    setRoute(key);
  };
  return <div className="app-shell"><header className="topbar"><div className="container topbar-inner"><button type="button" className="brand-button" onClick={() => goTo("home")}><LogoMark /><div><div className="eyebrow">IML</div><div className="brand-title">Interoperability Maturity Lab</div></div></button><nav className="topnav desktop-nav">{ROUTES.map((item) => <NavButton key={item.key} active={route === item.key} onClick={() => goTo(item.key)}>{item.label}</NavButton>)}</nav></div><div className="container mobile-nav">{ROUTES.map((item) => <NavButton key={item.key} active={route === item.key} onClick={() => goTo(item.key)}>{item.label}</NavButton>)}</div></header><main>{route === "home" ? <HomePage /> : null}{route === "id4d" ? <Id4dPage /> : null}{route === "evaluation" ? <EvaluationPage /> : null}{route === "methodology" ? <MethodologyPage /> : null}{route === "world" ? <WorldPage /> : null}{route === "contact" ? <ContactPage /> : null}</main><Footer /></div>;
}
