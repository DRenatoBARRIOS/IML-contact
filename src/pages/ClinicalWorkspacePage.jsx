import PageMasthead from "../components/PageMasthead.jsx";
import PageFrame from "../components/SiteChrome.jsx";

const clinicalModules = [
  ["Patient identity", "Local and national identifiers, duplicate prevention and patient-controlled correction pathways."],
  ["Consultation & terminology", "A coherent encounter record using shared concepts while leaving room for local clinical language."],
  ["Laboratories & results", "Structured requests, traceable results and explicit provenance across organisational boundaries."],
  ["Audit & correction", "Every meaningful action is attributable; corrections remain visible and can propagate safely."],
];

export default function ClinicalWorkspacePage() {
  return (
    <PageFrame active="/clinical-workspace">
      <PageMasthead eyebrow="Path 01 · Clinical foundation" title="A modular workspace that can start small and grow with care." lede="A coherent clinical foundation for settings that need deployable, inspectable software—especially where resources, infrastructure or vendor choice are constrained." />
      <section className="section clinical-section" aria-labelledby="clinical-heading">
        <div className="shell section-split">
          <div className="section-intro sticky-intro">
            <p className="section-kicker">Current workstream</p>
            <span className="status-chip amber">Reference prototype</span>
            <h2 id="clinical-heading">Open source, regionally adaptable and progressively deployable.</h2>
            <p>OpenMRS O3 provides an important reference point. IML explores a vendor-neutral configuration with regional packs, initially framed around France and Guatemala, without presenting unfinished modules as deployed services.</p>
            <a className="text-link" href="/collaborate">Join the clinical workstream →</a>
          </div>
          <div className="module-grid">
            {clinicalModules.map(([title, copy], index) => (
              <article className="module-card" key={title}><span>{String(index + 1).padStart(2, "0")}</span><div><h3>{title}</h3><p>{copy}</p><small>Current workstream</small></div></article>
            ))}
            <div className="design-note"><strong>Progressive deployment</strong><p>A useful first installation should not depend on buying an entire national architecture. Modules can be adopted, integrated and governed in stages.</p></div>
          </div>
        </div>
      </section>
    </PageFrame>
  );
}
