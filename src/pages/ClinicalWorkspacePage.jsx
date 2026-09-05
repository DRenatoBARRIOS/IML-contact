import PageMasthead from "../components/PageMasthead.jsx";
import PageFrame from "../components/SiteChrome.jsx";

const clinicalModules = [
  ["Patient identity & trust", "Local and national identifiers, duplicate prevention, provenance, trusted access and patient-controlled correction pathways."],
  ["Consultation & terminology", "A coherent encounter record with KSH97-P for concise consultation reasons and ICD-10 for extended coding, supported by a terminology core and progressive mappings."],
  ["Laboratories & results", "Structured requests, traceable results and explicit provenance. In France, controlled HPRIM laboratory-result integration is the first country-specific implementation target."],
  ["Clinical history & correction", "Longitudinal information that remains attributable, versioned and correctable. Corrections must remain visible and safe to reuse."],
  ["Interoperability connectors", "A separate integration layer for registries, laboratories, imaging, identity, consent and national digital-health services without locking the clinical core to one vendor."],
  ["Regional packs", "A common core with country adaptations. France and Guatemala are the first reference packs, allowing language, terminology and national services to change without forking the clinical model."],
  ["Local and remote data", "PostgreSQL as the reference data layer, with local or remote API/database configurations and an offline-capable deployment strategy for constrained settings."],
  ["Auditability", "Every meaningful clinical or administrative action should be attributable, reviewable and compatible with IML correction, evidence and learning requirements."],
];

const franceItems = [
  "INS and trusted patient identity",
  "MSSanté and DMP / Mon espace santé connectivity",
  "CPS / e-CPS authentication",
  "Sesam-Vitale and SCOR workflows",
  "Ségur compatibility constraints",
  "LAP-related prescribing requirements",
  "NGAP, CCAM and CIM-10-FR support",
  "LOINC FR for laboratory information",
  "ALD, C2S, AME and AT/MP context",
  "Laboratory and imaging integration",
];

const deploymentItems = [
  ["macOS · Windows · Linux", "The workspace is designed as a multiplatform application rather than a browser-only national portal."],
  ["Debian reference · Ubuntu LTS secondary", "Linux deployment keeps a conservative server baseline while remaining approachable for university and low-resource environments."],
  ["Local or remote PostgreSQL", "A site can keep data locally, use a remote database, or combine local operation with controlled synchronisation and APIs."],
  ["Offline-capable operation", "Care should remain possible when connectivity is weak or intermittent, with synchronisation treated as an architectural concern rather than an afterthought."],
  ["Peripheral integration", "The deployment strategy anticipates health-card readers and other local peripherals rather than assuming a purely cloud workflow."],
];

function WorkCard({ title, copy, index }) {
  return (
    <article className="module-card">
      <span>{String(index + 1).padStart(2, "0")}</span>
      <div>
        <h3>{title}</h3>
        <p>{copy}</p>
        <small>Open Clinical Workspace workstream</small>
      </div>
    </article>
  );
}

export default function ClinicalWorkspacePage() {
  return (
    <PageFrame active="/clinical-workspace">
      <PageMasthead
        eyebrow="Path 01 · Open Clinical Workspace"
        title="A medical workspace built to be used, inspected, adapted and kept."
        lede="IML is not only an interoperability framework. It is also developing an open-source, vendor-neutral clinical workspace for primary care, with a common core, country packs and a deployable PostgreSQL architecture."
      />

      <section className="section clinical-section" aria-labelledby="clinical-heading">
        <div className="shell section-split">
          <div className="section-intro sticky-intro">
            <p className="section-kicker">Software workstream</p>
            <span className="status-chip amber">Active reference implementation</span>
            <h2 id="clinical-heading">From concept to an implementable clinical foundation.</h2>
            <p>
              The objective is a university-grade open clinical workspace that can begin with a useful primary-care core, connect progressively to existing systems and remain understandable, exportable and maintainable over time.
            </p>
            <p>
              OpenMRS O3 is an important open-source reference point, but IML is not limited to one upstream product. The architecture is deliberately vendor-neutral and designed to reuse mature open-source components where they fit.
            </p>
            <div className="design-note">
              <strong>Status matters</strong>
              <p>This page describes active design and implementation work. It does not present unfinished modules as deployed clinical services.</p>
            </div>
          </div>

          <div className="module-grid">
            {clinicalModules.map(([title, copy], index) => (
              <WorkCard title={title} copy={copy} index={index} key={title} />
            ))}
          </div>
        </div>
      </section>

      <section className="section" aria-labelledby="architecture-heading">
        <div className="shell">
          <div className="wide-heading">
            <p className="section-kicker">Reference architecture</p>
            <h2 id="architecture-heading">Clinical core, integration layer, regional packs.</h2>
          </div>
          <div className="module-grid" style={{ marginTop: "34px" }}>
            <WorkCard index={0} title="Clinical core" copy="Consultation, patient context, clinical history, terminology, results, audit and correction remain part of one coherent clinical workspace." />
            <WorkCard index={1} title="Open integration layer" copy="Existing software, registries, laboratories, imaging, identity and consent services connect through explicit interfaces instead of being rebuilt inside the core." />
            <WorkCard index={2} title="Country packs" copy="National terminology, identity, billing, messaging and regulatory services are separated from the common core so that adding a country does not require rewriting the application." />
            <WorkCard index={3} title="PostgreSQL data foundation" copy="The reference data model is designed for PostgreSQL, with local and remote deployment patterns and API access that can evolve without tying clinical data to a proprietary platform." />
          </div>
        </div>
      </section>

      <section className="section clinical-section" aria-labelledby="france-heading">
        <div className="shell section-split">
          <div className="section-intro sticky-intro">
            <p className="section-kicker">IML France</p>
            <h2 id="france-heading">A real country adaptation, not a translation.</h2>
            <p>
              The French pack is defined around the services and constraints a primary-care application actually encounters. The first controlled integration target is HPRIM laboratory results, followed progressively by the surrounding national ecosystem.
            </p>
          </div>
          <div className="design-note" style={{ alignSelf: "start" }}>
            <strong>France pack scope</strong>
            <ul>
              {franceItems.map((item) => <li key={item}>{item}</li>)}
            </ul>
          </div>
        </div>
      </section>

      <section className="section" aria-labelledby="guatemala-heading">
        <div className="shell section-split">
          <div className="section-intro sticky-intro">
            <p className="section-kicker">IML Guatemala</p>
            <h2 id="guatemala-heading">The same core under different constraints.</h2>
            <p>
              Guatemala is the second reference adaptation. The first software task is a Spanish-language version of the current workspace, while preserving the same common clinical model and making low-resource, intermittent-connectivity deployment a first-class requirement.
            </p>
            <p>
              The country-pack strategy is intended to make later expansion additive: local terminology, services and workflows can be introduced without fragmenting the common software base.
            </p>
          </div>
          <div className="design-note" style={{ alignSelf: "start" }}>
            <strong>Country-pack principle</strong>
            <p>One clinical core. Different national connectors, terminology, language and deployment constraints.</p>
          </div>
        </div>
      </section>

      <section className="section clinical-section" aria-labelledby="deployment-heading">
        <div className="shell">
          <div className="wide-heading">
            <p className="section-kicker">Deployment strategy</p>
            <h2 id="deployment-heading">The software must survive outside the ideal network.</h2>
          </div>
          <div className="module-grid" style={{ marginTop: "34px" }}>
            {deploymentItems.map(([title, copy], index) => (
              <WorkCard title={title} copy={copy} index={index} key={title} />
            ))}
          </div>
          <div className="design-note" style={{ marginTop: "30px" }}>
            <strong>Open-source toolchain</strong>
            <p>
              IML treats the workspace as an academic and public-interest software stack: inspectable code, open data structures, open interfaces, explicit provenance and replaceable components. The goal is not to create another closed national platform, but a clinical foundation that institutions and care teams can understand and keep.
            </p>
          </div>
        </div>
      </section>

      <section className="section" aria-labelledby="next-heading">
        <div className="shell section-split">
          <div className="section-intro">
            <p className="section-kicker">Current priorities</p>
            <h2 id="next-heading">What is being pushed forward now.</h2>
          </div>
          <div className="design-note">
            <strong>Near-term software priorities</strong>
            <p>
              Consolidate the PostgreSQL clinical model, advance the terminology core and KSH97-P → ICD-10 mapping, implement the France HPRIM laboratory-result pathway, preserve traceable correction and provenance, and keep the common core ready for the Guatemala Spanish adaptation.
            </p>
            <a className="text-link" href="/collaborate">Join the Open Clinical Workspace workstream →</a>
          </div>
        </div>
      </section>
    </PageFrame>
  );
}
