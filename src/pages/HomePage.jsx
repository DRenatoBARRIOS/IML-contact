import PageFrame from "../components/SiteChrome.jsx";

const routes = [
  ["01", "Vision", "Why an open health information environment is needed.", "/vision"],
  ["02", "Clinical Workspace", "A modular, inspectable clinical foundation.", "/clinical-workspace"],
  ["03", "Interoperability", "An integration and evidence layer for existing systems.", "/interoperability"],
  ["04", "Country Profiles", "Evidence-oriented maturity profiles, never rankings.", "/country-profiles"],
  ["05", "Manuscripts", "The scientific argument and technical architecture.", "/manuscripts"],
  ["06", "Collaborate", "Ways to contribute evidence, critique and implementation experience.", "/collaborate"],
];

export default function HomePage() {
  return (
    <PageFrame active="/" home>
      <section className="hero" id="top">
        <div className="shell hero-grid">
          <div className="hero-copy">
            <p className="eyebrow">Open · vendor-neutral · academic</p>
            <h1>Health information should illuminate care — not fragment it.</h1>
            <p className="hero-lede">IML unites two complementary paths: an open-source clinical workspace and an open integration layer for existing systems.</p>
            <div className="hero-actions">
              <a className="button primary" href="/vision">Explore the project</a>
              <a className="button secondary" href="/country-profiles">View country profiles</a>
            </div>
            <div className="hero-paths" aria-label="Two complementary paths">
              <a className="path-card" href="/clinical-workspace"><span className="path-number">01</span><span><strong>Open Clinical Workspace</strong><small>A progressively deployable clinical foundation.</small></span></a>
              <a className="path-card" href="/interoperability"><span className="path-number">02</span><span><strong>Integration &amp; evidence layer</strong><small>Connect systems, preserve meaning, document evidence.</small></span></a>
            </div>
          </div>
          <div className="hero-art">
            <div className="hero-art-frame"><img src="/hero-lamp-editorial.png" alt="Hand-drawn IML lamp illuminating connected evidence paths" /></div>
          </div>
        </div>
        <div className="shell principle"><span /><p>Health is the objective. Trustworthy information is the foundation. Interoperability is the path.</p><span /></div>
      </section>

      <section className="vision home-intro" aria-labelledby="home-intro-heading">
        <div className="shell vision-grid">
          <div><p className="section-kicker">One environment · two paths</p><h2 id="home-intro-heading">A reference workspace and an open way to connect what already exists.</h2></div>
          <p>IML does not impose an exclusive monolith. It brings together a modular clinical foundation and an integration approach for software, laboratories, registries, payers and national infrastructure.</p>
        </div>
      </section>

      <section className="section route-overview" aria-labelledby="explore-heading">
        <div className="shell">
          <div className="route-overview-heading"><p className="section-kicker">Explore IML</p><h2 id="explore-heading">Six pages, one coherent project.</h2></div>
          <div className="route-grid">
            {routes.map(([number, title, copy, href]) => (
              <a className="route-card" href={href} key={href}>
                <span>{number}</span><h3>{title}</h3><p>{copy}</p><small>Open page →</small>
              </a>
            ))}
          </div>
        </div>
      </section>
    </PageFrame>
  );
}
