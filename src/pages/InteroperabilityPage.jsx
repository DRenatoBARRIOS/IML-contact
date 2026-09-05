import PageMasthead from "../components/PageMasthead.jsx";
import PageFrame from "../components/SiteChrome.jsx";

const layers = [
  ["01", "Technical", "Can systems exchange data reliably?"],
  ["02", "Semantic", "Is clinical meaning preserved?"],
  ["03", "Organisational", "Do workflows and responsibilities align?"],
  ["04", "Institutional", "Are governance, law and accountability credible?"],
  ["05", "Clinical & public health", "Does information improve decisions, safety and learning?"],
];

const domains = [
  ["GOV", "Governance", "Stewardship, accountability and policy direction"],
  ["TEC", "Technical", "Standards, architecture and reliable exchange"],
  ["IDT", "Identity", "People, professionals, organisations and consent"],
  ["ADP", "Adoption", "Real use in care and public-health workflows"],
  ["SEC", "Security", "Protection, access control and resilience"],
  ["LRN", "Learning", "Feedback, correction, answerability and system improvement"],
];

const learningIndicators = [
  ["LRN-1", "Correction mechanisms", "Can erroneous information be corrected across systems rather than only inside one application?"],
  ["LRN-2", "Continuous improvement", "Are interoperability, quality and outcome indicators used to support learning and improvement?"],
  ["LRN-3", "Traceable correction and reuse", "Are corrections, versions and later reuse of database-held information traceable?"],
  ["LRN-4", "Institutional documentary reliability and integrity", "Do institutions maintain evidence that remains accessible, stable, precise, attributable, current and correctable over time?"],
  ["LRN-5", "Institutional responsiveness and answerability", "Can responsible institutions receive, examine and substantively answer documented inquiries, and act on authoritative findings, warnings and recommendations?"],
];

export default function InteroperabilityPage() {
  return (
    <PageFrame active="/interoperability">
      <PageMasthead eyebrow="Path 02 · Integration & evidence" title="Interoperability is a clinical capability, not a cable between databases." lede="A connection becomes useful only when technical exchange, shared meaning, workflow, governance and clinical purpose hold together." />
      <section className="section interoperability-section" aria-labelledby="layers-heading">
        <div className="shell">
          <div className="wide-heading"><div><p className="section-kicker light-kicker">Five interacting layers</p><h2 id="layers-heading">Exchange must preserve meaning and responsibility.</h2></div><p>IML treats interoperability as an end-to-end clinical and institutional capability rather than a narrow interface project.</p></div>
          <div className="layer-grid">{layers.map(([number, title, copy]) => <article key={title}><span>{number}</span><h3>{title}</h3><p>{copy}</p></article>)}</div>
          <div className="information-flow" aria-label="Information flow from source systems to learning">
            <div><small>Existing sources</small><strong>EHRs · labs · registries · payers</strong></div><i>→</i>
            <div><small>Trust layer</small><strong>Identity · consent · terminology</strong></div><i>→</i>
            <div><small>Clinical use</small><strong>Workspace · public health</strong></div><i>→</i>
            <div><small>Learning</small><strong>Evidence · correction · feedback</strong></div>
          </div>
          <div className="demonstrator-grid">
            <article><span className="status-chip outline">Research demonstrator</span><h3>AMR / BMR continuity</h3><p>Trace culture, susceptibility, antimicrobial decisions and feedback without detaching a laboratory result from its clinical context.</p></article>
            <article><span className="status-chip outline">Exploration</span><h3>Payer interoperability</h3><p>Connect coverage and reimbursement processes to care without allowing administrative exchange to distort the clinical record.</p></article>
            <article><span className="status-chip outline">Trust boundary</span><h3>Identity, consent &amp; access</h3><p>QR or mobile workflows should carry only short-lived signed tokens—never sensitive health data in clear text. IML complements national identity systems; it does not replace them.</p></article>
          </div>
        </div>
      </section>
      <section className="section methodology-section" id="methodology" aria-labelledby="methodology-heading">
        <div className="shell methodology-layout">
          <div className="section-intro"><p className="section-kicker">Method · inspectable by design</p><h2 id="methodology-heading">Six domains, explicit evidence and versioned judgments.</h2><p>Country profiles are structured orientation tools, not league tables. A policy, platform or contact channel does not earn credit merely because it formally exists: implementation, correction, answerability and institutional follow-through also matter. Each claim should point to documentary support, declare its limitation and remain open to correction by informed reviewers.</p></div>
          <div className="domain-grid">{domains.map(([code, title, copy]) => <article key={code}><span>{code}</span><h3>{title}</h3><p>{copy}</p></article>)}</div>

          <div style={{ gridColumn: "1 / -1", marginTop: "18px" }}>
            <div className="section-intro" style={{ maxWidth: "940px" }}>
              <p className="section-kicker">Domain 06 · Feedback, correction &amp; learning</p>
              <h3 style={{ margin: 0, fontFamily: "var(--font-source-serif), Georgia, serif", fontSize: "clamp(2rem, 3vw, 3.2rem)", fontWeight: 600, letterSpacing: "-.035em", lineHeight: 1.05 }}>A learning ecosystem must be able to correct itself and answer for what happens next.</h3>
              <p>Learning is broader than collecting feedback. IML asks whether errors can be corrected, whether corrections remain traceable when information is reused, whether institutions maintain reliable documentary evidence, and whether responsible bodies substantively respond to documented problems and authoritative findings.</p>
            </div>
            <div className="domain-grid" style={{ marginTop: "30px" }}>{learningIndicators.map(([code, title, copy]) => <article key={code}><span>{code}</span><h3>{title}</h3><p>{copy}</p></article>)}</div>
            <div className="section-intro" style={{ maxWidth: "1040px", marginTop: "34px" }}>
              <h3 style={{ margin: 0, fontFamily: "var(--font-source-serif), Georgia, serif", fontSize: "1.6rem", fontWeight: 650 }}>How LRN-5 is interpreted</h3>
              <p>For institutional responsiveness, IML distinguishes substantive and traceable follow-through from mere formal availability. The reference scale is 100 for a substantive response or corrective action within 30 days, 75 within 31–60 days, 50 for delayed or incomplete but usable action, 25 for acknowledgement or formal process without a substantive answer, and 0 for persistent non-response, non-enforcement or failure to act after a reasonable opportunity to correct the problem. An automated acknowledgement is not considered a substantive institutional response.</p>
              <p>Authoritative findings from courts of audit, parliamentary bodies, regulators, ombuds institutions or equivalent independent control bodies may directly inform LRN-5 when they document repeated unresolved failures of evaluation, enforcement, correction or follow-through. IML describes the functional effect of persistent institutional silence or inaction as <strong>passive institutional obstruction</strong>, without inferring the private intention of individual officials.</p>
            </div>
          </div>

          <ol className="evidence-pipeline" aria-label="Evidence workflow">
            <li><span>1</span><strong>Source</strong><small>Prefer authoritative public documentation</small></li>
            <li><span>2</span><strong>Claim</strong><small>Link evidence to a precise indicator</small></li>
            <li><span>3</span><strong>Limit</strong><small>State what the source cannot prove</small></li>
            <li><span>4</span><strong>Review</strong><small>Version, challenge and correct</small></li>
          </ol>
        </div>
      </section>
    </PageFrame>
  );
}
