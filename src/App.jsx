import React from "react";

export default function App() {
  const contactEmail = "contact@imlhealth.org";

  return (
    <div className="app">
      <style>{`
        :root {
          --ink: #10243f;
          --ink-soft: #40516a;
          --blue: #164f8b;
          --blue-soft: #e9f2fb;
          --green: #1b7c6b;
          --gold: #b88a2b;
          --line: #d9e3ef;
          --paper: #ffffff;
          --mist: #f6f9fc;
        }

        * {
          box-sizing: border-box;
        }

        html {
          scroll-behavior: smooth;
        }

        body {
          margin: 0;
          font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
          background: var(--paper);
          color: var(--ink);
        }

        a {
          color: inherit;
          text-decoration: none;
        }

        .app {
          min-height: 100vh;
          background:
            radial-gradient(circle at top left, rgba(22, 79, 139, 0.10), transparent 34rem),
            linear-gradient(180deg, #ffffff 0%, #f7fafc 100%);
        }

        .nav {
          position: sticky;
          top: 0;
          z-index: 20;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 1rem 5vw;
          background: rgba(255, 255, 255, 0.88);
          backdrop-filter: blur(14px);
          border-bottom: 1px solid var(--line);
        }

        .brand {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          font-weight: 800;
          letter-spacing: 0.04em;
        }

        .brand-mark {
          width: 2.4rem;
          height: 2.4rem;
          border-radius: 0.8rem;
          display: grid;
          place-items: center;
          color: white;
          background: linear-gradient(135deg, var(--blue), var(--green));
          font-weight: 800;
        }

        .nav-links {
          display: flex;
          align-items: center;
          gap: 1.2rem;
          font-size: 0.94rem;
          color: var(--ink-soft);
        }

        .nav-links a:hover {
          color: var(--blue);
        }

        .hero {
          padding: 6rem 5vw 4.5rem;
          max-width: 1220px;
          margin: 0 auto;
          display: grid;
          grid-template-columns: minmax(0, 1.15fr) minmax(280px, 0.85fr);
          gap: 4rem;
          align-items: center;
        }

        .eyebrow {
          margin: 0 0 1rem;
          color: var(--green);
          font-size: 0.82rem;
          font-weight: 800;
          letter-spacing: 0.14em;
          text-transform: uppercase;
        }

        h1 {
          margin: 0;
          font-size: clamp(2.55rem, 6vw, 5.2rem);
          line-height: 0.95;
          letter-spacing: -0.055em;
        }

        .hero-lead {
          margin: 1.5rem 0 0;
          max-width: 760px;
          font-size: clamp(1.08rem, 2vw, 1.35rem);
          line-height: 1.65;
          color: var(--ink-soft);
        }

        .hero-actions {
          margin-top: 2rem;
          display: flex;
          flex-wrap: wrap;
          gap: 0.9rem;
        }

        .btn-primary,
        .btn-secondary {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-height: 2.95rem;
          padding: 0.85rem 1.2rem;
          border-radius: 999px;
          font-weight: 750;
          border: 1px solid transparent;
          transition: transform 0.18s ease, box-shadow 0.18s ease, background 0.18s ease;
        }

        .btn-primary {
          color: white;
          background: var(--blue);
          box-shadow: 0 14px 28px rgba(22, 79, 139, 0.20);
        }

        .btn-primary:hover,
        .btn-secondary:hover {
          transform: translateY(-1px);
        }

        .btn-secondary {
          color: var(--blue);
          background: white;
          border-color: var(--line);
        }

        .hero-card {
          background: rgba(255, 255, 255, 0.78);
          border: 1px solid var(--line);
          border-radius: 2rem;
          padding: 2rem;
          box-shadow: 0 24px 70px rgba(16, 36, 63, 0.09);
        }

        .principles {
          display: grid;
          gap: 1rem;
        }

        .principle {
          padding: 1.15rem;
          border-radius: 1.2rem;
          background: var(--mist);
          border: 1px solid var(--line);
        }

        .principle strong {
          display: block;
          margin-bottom: 0.35rem;
          font-size: 1rem;
        }

        .principle span {
          color: var(--ink-soft);
          line-height: 1.55;
        }

        .section {
          padding: 4.5rem 5vw;
          max-width: 1220px;
          margin: 0 auto;
        }

        .section-header {
          max-width: 820px;
          margin-bottom: 2rem;
        }

        .section h2 {
          margin: 0;
          font-size: clamp(2rem, 4vw, 3.2rem);
          line-height: 1.05;
          letter-spacing: -0.04em;
        }

        .section-header p:not(.eyebrow) {
          margin: 1rem 0 0;
          color: var(--ink-soft);
          font-size: 1.08rem;
          line-height: 1.7;
        }

        .grid-3 {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 1.1rem;
        }

        .grid-2 {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 1.1rem;
        }

        .card {
          background: white;
          border: 1px solid var(--line);
          border-radius: 1.4rem;
          padding: 1.45rem;
          box-shadow: 0 14px 38px rgba(16, 36, 63, 0.06);
        }

        .card h3 {
          margin: 0 0 0.65rem;
          font-size: 1.18rem;
        }

        .card p {
          margin: 0;
          color: var(--ink-soft);
          line-height: 1.65;
        }

        .number {
          width: 2.2rem;
          height: 2.2rem;
          border-radius: 999px;
          display: grid;
          place-items: center;
          margin-bottom: 1rem;
          background: var(--blue-soft);
          color: var(--blue);
          font-weight: 800;
        }

        .framework-panel {
          background: linear-gradient(135deg, #ffffff 0%, #f4f8fc 100%);
          border: 1px solid var(--line);
          border-radius: 2rem;
          padding: 2rem;
          box-shadow: 0 24px 70px rgba(16, 36, 63, 0.08);
        }

        .domain-list {
          display: flex;
          flex-wrap: wrap;
          gap: 0.7rem;
          margin-top: 1.2rem;
        }

        .pill {
          display: inline-flex;
          padding: 0.62rem 0.88rem;
          border-radius: 999px;
          background: white;
          border: 1px solid var(--line);
          color: var(--ink-soft);
          font-weight: 650;
          font-size: 0.94rem;
        }

        .highlight {
          border-left: 4px solid var(--green);
          background: #f1faf7;
        }

        .gold {
          border-left: 4px solid var(--gold);
          background: #fff9ec;
        }

        .blue {
          border-left: 4px solid var(--blue);
          background: #f3f8ff;
        }

        .contact-section {
          padding-bottom: 6rem;
        }

        .contact-card {
          max-width: 760px;
          background: white;
          border: 1px solid var(--line);
          border-radius: 1.6rem;
          padding: 1.6rem;
          box-shadow: 0 18px 44px rgba(16, 36, 63, 0.08);
        }

        .contact-card p {
          margin: 0 0 1.2rem;
          color: var(--ink-soft);
          line-height: 1.7;
        }

        .contact-email {
          margin-top: 1rem !important;
          font-weight: 750;
          color: var(--blue) !important;
        }

        .footer {
          border-top: 1px solid var(--line);
          padding: 2rem 5vw;
          color: var(--ink-soft);
          background: white;
        }

        .footer-inner {
          max-width: 1220px;
          margin: 0 auto;
          display: flex;
          justify-content: space-between;
          gap: 1rem;
          flex-wrap: wrap;
          font-size: 0.92rem;
        }

        @media (max-width: 900px) {
          .hero {
            grid-template-columns: 1fr;
            padding-top: 4rem;
          }

          .grid-3,
          .grid-2 {
            grid-template-columns: 1fr;
          }

          .nav {
            align-items: flex-start;
            gap: 1rem;
            flex-direction: column;
          }

          .nav-links {
            flex-wrap: wrap;
          }
        }
      `}</style>

      <header className="nav">
        <a className="brand" href="#home" aria-label="IML home">
          <span className="brand-mark">IML</span>
          <span>Interoperability Maturity Lab</span>
        </a>

        <nav className="nav-links" aria-label="Main navigation">
          <a href="#about">About</a>
          <a href="#framework">Framework</a>
          <a href="#amr">AMR/BMR</a>
          <a href="#workspace">Workspace</a>
          <a href="#ai">AI</a>
          <a href="#contact">Contact</a>
        </nav>
      </header>

      <main>
        <section id="home" className="hero">
          <div>
            <p className="eyebrow">Founding scientific initiative</p>
            <h1>Trusted Health Information Ecosystems</h1>
            <p className="hero-lead">
              IML proposes a scientific framework to understand, assess and improve
              interoperability in health. Its purpose is not to rank countries or promote
              a commercial platform. Its purpose is to help health information become
              trustworthy knowledge that protects health.
            </p>

            <div className="hero-actions">
              <a href="#framework" className="btn-primary">
                Explore the framework
              </a>
              <a href="#contact" className="btn-secondary">
                Scientific review
              </a>
            </div>
          </div>

          <aside className="hero-card" aria-label="IML principles">
            <div className="principles">
              <div className="principle">
                <strong>Health is the objective</strong>
                <span>
                  Technology has value only when it improves prevention, care,
                  public health, research and equity.
                </span>
              </div>

              <div className="principle">
                <strong>Trustworthy information is the foundation</strong>
                <span>
                  Data become useful when they remain accurate, contextualised,
                  governed, auditable and clinically meaningful.
                </span>
              </div>

              <div className="principle">
                <strong>Interoperability is the path</strong>
                <span>
                  Interoperability should preserve meaning, trust, clinical context
                  and responsibility across boundaries.
                </span>
              </div>
            </div>
          </aside>
        </section>

        <section id="about" className="section">
          <div className="section-header">
            <p className="eyebrow">About IML</p>
            <h2>A framework for health information that can be trusted, used and improved.</h2>
            <p>
              The Interoperability Maturity Lab studies health information ecosystems as
              networks of patients, clinicians, laboratories, hospitals, payers, public
              health authorities, researchers, industry, infrastructure and governance.
              The ecosystem, not the isolated application, becomes the unit of analysis.
            </p>
          </div>

          <div className="grid-3">
            <article className="card">
              <div className="number">01</div>
              <h3>Not another ranking</h3>
              <p>
                IML does not classify countries as winners or losers. It creates maturity
                profiles and improvement pathways adapted to each context.
              </p>
            </article>

            <article className="card">
              <div className="number">02</div>
              <h3>Not another platform</h3>
              <p>
                IML is not a vendor proposition. It is a scientific and practical framework
                that can guide assessment, review, pilots and implementation.
              </p>
            </article>

            <article className="card">
              <div className="number">03</div>
              <h3>Not technology first</h3>
              <p>
                Operating systems, databases, standards and AI are evaluated according to
                their ability to support health, trust, continuity and responsibility.
              </p>
            </article>
          </div>
        </section>

        <section id="framework" className="section">
          <div className="section-header">
            <p className="eyebrow">Framework</p>
            <h2>From technical exchange to meaningful health use.</h2>
            <p>
              IML understands interoperability as a multidimensional capability. It includes
              technical exchange, semantic meaning, organisational workflows, institutional
              cooperation, clinical usefulness and public health learning.
            </p>
          </div>

          <div className="framework-panel">
            <h3>Six IML assessment domains</h3>
            <div className="domain-list">
              <span className="pill">Governance and Standards</span>
              <span className="pill">Technical Interoperability</span>
              <span className="pill">Identity, Consent and Trust</span>
              <span className="pill">Adoption and Use</span>
              <span className="pill">Security and Resilience</span>
              <span className="pill">Feedback, Correction and Learning</span>
            </div>

            <h3 style={{ marginTop: "1.8rem" }}>Cross-cutting dimensions</h3>
            <div className="domain-list">
              <span className="pill">Institutional Engagement</span>
              <span className="pill">Payer Interoperability</span>
              <span className="pill">AI Readiness</span>
              <span className="pill">Operating System Quality</span>
              <span className="pill">Database Quality</span>
            </div>
          </div>
        </section>

        <section id="ecosystems" className="section">
          <div className="section-header">
            <p className="eyebrow">Health Information Ecosystems</p>
            <h2>Information acquires value when it moves with context.</h2>
            <p>
              A laboratory result, a prescription, a diagnosis or a reimbursement event
              rarely has full meaning alone. Meaning emerges when information remains
              connected to symptoms, clinical interpretation, treatment, outcome,
              governance and authorised reuse.
            </p>
          </div>

          <div className="grid-2">
            <article className="card highlight">
              <h3>Continuity of Health Information</h3>
              <p>
                Information should accompany the patient and the health system across time,
                settings and authorised actors without losing integrity or clinical relevance.
              </p>
            </article>

            <article className="card blue">
              <h3>Knowledge Continuity</h3>
              <p>
                Each encounter, dataset and project should enrich future decisions rather
                than repeatedly restarting from fragmented information.
              </p>
            </article>
          </div>
        </section>

        <section id="amr" className="section">
          <div className="section-header">
            <p className="eyebrow">First operational thread</p>
            <h2>AMR/BMR as a demonstrator.</h2>
            <p>
              Antimicrobial resistance exposes the limits of fragmented information. A
              resistant isolate is not automatically a clinically meaningful infection.
              The first IML demonstrator focuses on urinary tract infections caused by
              multidrug-resistant E. coli.
            </p>
          </div>

          <div className="grid-3">
            <article className="card">
              <h3>Clinical context</h3>
              <p>
                Symptoms, fever, urinary signs, risk context, diagnosis and outcome are
                needed to distinguish infection, colonisation, contamination and
                asymptomatic bacteriuria.
              </p>
            </article>

            <article className="card">
              <h3>Microbiology</h3>
              <p>
                Culture, bacterial count, species identification and antibiogram become
                more useful when linked to the patient story and the clinical decision.
              </p>
            </article>

            <article className="card">
              <h3>Learning</h3>
              <p>
                Connected information can support antimicrobial stewardship, public health
                surveillance, payer analysis, research and responsible AI.
              </p>
            </article>
          </div>
        </section>

        <section id="workspace" className="section">
          <div className="section-header">
            <p className="eyebrow">Implementation bridge</p>
            <h2>Open Clinical Workspace.</h2>
            <p>
              The Open Clinical Workspace is proposed as a vendor-neutral, open-source-oriented
              environment that interacts with existing systems. It is not another EHR. It is
              an interoperability and clinical context layer designed to import information
              on demand and support responsible use.
            </p>
          </div>

          <div className="grid-2">
            <article className="card gold">
              <h3>Import on demand</h3>
              <p>
                Information should not circulate permanently or indiscriminately. It should
                be accessed for a defined clinical, public health or research purpose under
                transparent governance.
              </p>
            </article>

            <article className="card highlight">
              <h3>Clinical context layer</h3>
              <p>
                The workspace should preserve the relationship between observations and the
                circumstances that give them meaning, including indication, interpretation,
                treatment and evolution.
              </p>
            </article>

            <article className="card blue">
              <h3>Operating system quality</h3>
              <p>
                Windows, legacy DOS environments, macOS, UNIX, GNU/Linux, BSD and FreeBSD
                should be compared by supportability, security, maintainability, portability,
                auditability and resilience in health use.
              </p>
            </article>

            <article className="card">
              <h3>Database quality</h3>
              <p>
                Database technologies should be evaluated through integrity, traceability,
                auditability, reversibility, security, portability, backup, recovery,
                correction, migration and preservation of clinical context.
              </p>
            </article>
          </div>
        </section>

        <section id="ai" className="section">
          <div className="section-header">
            <p className="eyebrow">Responsible AI</p>
            <h2>AI assistance under human responsibility.</h2>
            <p>
              IML treats AI as an ecosystem actor, not as an autonomous clinical or moral
              authority. AI may assist summarisation, pattern recognition, missing context
              detection, research extraction and decision support, but judgement and
              accountability remain human.
            </p>
          </div>

          <div className="grid-3">
            <article className="card">
              <h3>Transparency</h3>
              <p>
                Meaningful AI-assisted writing, analysis or interpretation should be disclosed
                and documented.
              </p>
            </article>

            <article className="card">
              <h3>Equity</h3>
              <p>
                AI readiness requires attention to bias, representativeness, vulnerable
                populations and fragmented information.
              </p>
            </article>

            <article className="card">
              <h3>Limits</h3>
              <p>
                Mature ecosystems must be able to define when AI should not be used. The
                capacity to limit automation is part of responsibility.
              </p>
            </article>
          </div>
        </section>

        <section id="publications" className="section">
          <div className="section-header">
            <p className="eyebrow">Publications</p>
            <h2>Founding Manuscript.</h2>
            <p>
              The IML Founding Manuscript is open for scientific review. It defines the
              conceptual, methodological and operational foundations of the project and
              will evolve through versioned review.
            </p>
          </div>

          <div className="contact-card">
            <p>
              The manuscript can be shared with reviewers, collaborators and institutions
              on request.
            </p>

            <a
              href={`mailto:${contactEmail}?subject=${encodeURIComponent(
                "Request for the IML Founding Manuscript"
              )}`}
              className="btn-primary"
            >
              Download the Founding Manuscript
            </a>

            <p className="contact-email">{contactEmail}</p>
          </div>
        </section>

        <section id="contact" className="section contact-section">
          <div className="section-header">
            <p className="eyebrow">Contact</p>
            <h2>Scientific review and collaboration.</h2>
            <p>
              IML is open to methodological discussion and collaboration with clinicians,
              researchers, institutions, payers, public health teams, engineers and
              open-source contributors.
            </p>
          </div>

          <div className="contact-card">
            <p>
              To discuss the IML framework, the AMR/BMR demonstrator, the Open Clinical
              Workspace or a scientific review, please contact:
            </p>

            <a
              href={`mailto:${contactEmail}?subject=${encodeURIComponent(
                "Scientific review - IML"
              )}`}
              className="btn-primary"
            >
              Contact IML
            </a>

            <p className="contact-email">{contactEmail}</p>
          </div>
        </section>
      </main>

      <footer className="footer">
        <div className="footer-inner">
          <span>© Interoperability Maturity Lab</span>
          <span>Health first. Trustworthy information. Interoperability as path.</span>
        </div>
      </footer>
    </div>
  );
}
