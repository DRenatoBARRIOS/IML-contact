import PageMasthead from "../components/PageMasthead.jsx";
import PageFrame from "../components/SiteChrome.jsx";

const BASE_URL = import.meta.env.BASE_URL || "/";

export default function ManuscriptsPage() {
  return (
    <PageFrame active="/manuscripts">
      <PageMasthead eyebrow="Scientific foundations" title="The argument and the architecture, open to review." lede="The manuscripts define the present conceptual alignment of IML. They are working foundations for critique, extension and validation—not a claim of completed implementation." />
      <section className="section manuscripts-section" aria-labelledby="manuscripts-heading">
        <div className="shell manuscript-layout">
          <div className="section-intro"><p className="section-kicker">Read the foundations</p><h2 id="manuscripts-heading">Two documents, one evolving project.</h2><p>Each manuscript separates established evidence, project choices and future work so that the proposal can be examined and corrected.</p></div>
          <div className="manuscript-cards">
            <article><span>Manuscript 01</span><h3>Founding vision</h3><p>Why fragmented information harms care, and why a health information environment must be open, accountable and clinically grounded.</p><a className="button primary" href={`${BASE_URL}IML_Founding_Manuscript.pdf`} target="_blank" rel="noreferrer">Read founding manuscript ↗</a></article>
            <article><span>Manuscript 02</span><h3>Technical architecture</h3><p>How modular software, interoperability layers, evidence and correction can form a coherent implementation path.</p><a className="button secondary" href={`${BASE_URL}IML_Technical_Manuscript.pdf`} target="_blank" rel="noreferrer">Read technical manuscript ↗</a></article>
          </div>
        </div>
      </section>
    </PageFrame>
  );
}
