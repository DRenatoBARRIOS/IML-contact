import PageFrame from "../components/SiteChrome.jsx";

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
    </PageFrame>
  );
}
