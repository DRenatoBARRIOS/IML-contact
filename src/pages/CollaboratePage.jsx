import PageMasthead from "../components/PageMasthead.jsx";
import PageFrame from "../components/SiteChrome.jsx";

export default function CollaboratePage() {
  return (
    <PageFrame active="/collaborate">
      <PageMasthead eyebrow="Open invitation" title="Bring evidence, clinical reality or implementation experience." lede="IML is independent, non-commercial and open to rigorous contribution. The next useful step may be a corrected source, a workflow review, a local deployment hypothesis or a research partnership." />
      <section className="section collaborate-section" aria-labelledby="collaborate-heading">
        <div className="shell collaborate-layout">
          <div><p className="section-kicker light-kicker">Contribute</p><h2 id="collaborate-heading">A concrete contribution is better than a broad endorsement.</h2><p>Tell us what you know, what should be corrected and what you would be prepared to test.</p><a className="button amber-button" href="mailto:iml.health@pm.me?subject=IML%20collaboration">Write to iml.health@pm.me</a></div>
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
