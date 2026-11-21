import PageFrame from "../components/SiteChrome.jsx";

export default function HomePage() {
  return (
    <PageFrame active="/" home>
      <section className="hero" id="top">
        <div className="shell hero-grid">
          <div className="hero-copy">
            <p className="eyebrow">Independent research · open science · health information</p>
            <h1>Studying health information systems to improve care.</h1>
            <p className="hero-lede">IML is an independent, open and interdisciplinary research initiative examining how health information systems affect clinical continuity, interoperability, institutional accountability and public health. Its work connects scientific evaluation with open technical experimentation.</p>
            <div className="hero-actions">
              <a className="button primary" href="/research">Explore research themes</a>
              <a className="button secondary" href="/methodology">Examine the methodology</a>
            </div>
            <div className="hero-paths" aria-label="Two complementary paths">
              <a className="path-card" href="/clinical-workspace"><span className="path-number">01</span><span><strong>Open Clinical Workspace</strong><small>An open research and prototyping environment for clinical workflows.</small></span></a>
              <a className="path-card" href="/interoperability"><span className="path-number">02</span><span><strong>Integration &amp; evidence layer</strong><small>Investigate and test information continuity across existing systems.</small></span></a>
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
          <div><p className="section-kicker">Research infrastructure · two complementary paths</p><h2 id="home-intro-heading">Scientific questions, reproducible methods and open research tools.</h2></div>
          <p>IML investigates measurable gaps between policy, technical capabilities and the reality of care. Its open clinical workspace and integration layer provide experimental tools, while documented case studies and comparative methods support independent academic evaluation. Master’s dissertations, medical theses and doctoral research may build on these themes under appropriate university supervision.</p>
        </div>
      </section>
    </PageFrame>
  );
}
