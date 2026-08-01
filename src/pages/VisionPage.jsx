import PageMasthead from "../components/PageMasthead.jsx";
import PageFrame from "../components/SiteChrome.jsx";

export default function VisionPage() {
  return (
    <PageFrame active="/vision">
      <PageMasthead eyebrow="Vision" title="An open environment built around care, trust and learning." lede="IML combines a reference clinical workspace with an open integration layer. It is a shared direction for systems that must cooperate without surrendering clinical meaning or public accountability." />
      <section className="vision vision-page" aria-labelledby="vision-heading">
        <div className="shell vision-grid">
          <div><p className="section-kicker">One environment · two paths</p><h2 id="vision-heading">A reference workspace and an open way to connect what already exists.</h2></div>
          <div className="vision-prose"><p>IML does not impose an exclusive monolith. It brings together a modular clinical foundation and an integration approach for software, laboratories, registries, payers and national infrastructure.</p><p>The objective is practical continuity: trustworthy information that remains understandable, correctable and useful across the human journey of care.</p></div>
        </div>
      </section>
      <section className="current-state" aria-label="Current project state">
        <div className="shell state-grid">
          <div><span>01</span><p><strong>Active public foundation</strong>Core vision, technical manuscripts and country profiles are online.</p></div>
          <div><span>02</span><p><strong>Live evidence dataset</strong>Versioned profiles are served from PostgreSQL through a public API.</p></div>
          <div><span>03</span><p><strong>Reference prototype</strong>The clinical workspace is an evolving workstream, not a finished product.</p></div>
        </div>
      </section>
      <section className="section next-paths" id="identity-trust">
        <div className="shell next-paths-grid">
          <div><p className="section-kicker">Trust boundary</p><h2>Identity supports care; it does not become a new clinical silo.</h2></div>
          <div className="vision-prose"><p>IML complements national identity systems through purpose-limited access, traceable consent, provenance and correction. Sensitive health data should never be carried in clear text by a QR code or mobile token.</p><div className="hero-paths"><a className="path-card" href="/clinical-workspace"><span className="path-number">01</span><span><strong>Clinical Workspace</strong><small>Explore the modular clinical foundation.</small></span></a><a className="path-card" href="/interoperability"><span className="path-number">02</span><span><strong>Interoperability</strong><small>Explore the integration and evidence layer.</small></span></a></div></div>
        </div>
      </section>
    </PageFrame>
  );
}
