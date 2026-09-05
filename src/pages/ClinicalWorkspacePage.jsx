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

const aiItems = [
  ["Clinical evidence retrieval", "An auditable evidence-retrieval foundation is already defined in PostgreSQL for PubMed, Europe PMC, ClinicalTrials.gov, Crossref and Cochrane public metadata. Connectors remain disabled until application-side validation."],
  ["Evidence provenance", "Each AI-assisted search can retain the question fingerprint, search expression, source execution, result count, source rank, identifiers and failures so that a clinician can reconstruct how evidence was obtained."],
  ["Privacy by design", "Patient-identifying clinical questions are not intended to be copied into the evidence layer. Search expressions are designed to be de-identified and linked back to the encounter through controlled identifiers."],
  ["Terminology assistance", "AI may assist with terminology search, coding suggestions and mapping review, but canonical terminology remains versioned and deterministic. KSH97-P → ICD-10 mappings must remain inspectable rather than being hidden inside a model."],
  ["Human clinical control", "AI output is assistance, not an autonomous medical decision. Suggestions must remain reviewable by the professional and distinguishable from recorded clinical facts, validated results and signed decisions."],
  ["Traceable model use", "AI-assisted functions should record enough context to identify the function, model or service used, the input/output event and the professional action that followed, without turning the clinical record into an opaque model log."],
  ["Replaceable models", "The clinical architecture should not depend on a single AI vendor. Local models, university-hosted services or controlled external providers should be replaceable behind explicit interfaces."],
  ["Responsible AI & regulation", "Transparency, proportionality, professional oversight and traceability are treated as design requirements. AI-assisted clinical functions must be clearly identified and remain compatible with applicable European transparency obligations."],
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

function WorkCard({ title, copy, index, label = "Open Clinical Workspace workstream" }) {
  return (
    <article className="module-card">
      <span>{String(index + 1).padStart(2, "0")}</span>
      <div>
        <h3>{title}</h3>
        <p>{copy}</p>
        <small>{label}</small>
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
        lede="IML is not only an interoperability framework. It is developing an open-source, vendor-neutral clinical workspace for primary care, with a common core, country packs, a deployable PostgreSQL architecture and a traceable clinical-AI layer."
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
              <p>This page describes active design and implementation work. It does not present unfinished modules or AI functions as deployed clinical services.</p>
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
            <h2 id="architecture-heading">Clinical core, integration layer, regional packs and AI services.</h2>
          </div>
          <div className="module-grid" style={{ marginTop: "34px" }}>
            <WorkCard index={0} title="Clinical core" copy="Consultation, patient context, clinical history, terminology, results, audit and correction remain part of one coherent clinical workspace." />
            <WorkCard index={1} title="Open integration layer" copy="Existing software, registries, laboratories, imaging, identity and consent services connect through explicit interfaces instead of being rebuilt inside the core." />
            <WorkCard index={2} title="Country packs" copy="National terminology, identity, billing, messaging and regulatory services are separated from the common core so that adding a country does not require rewriting the application." />
            <WorkCard index={3} title="PostgreSQL data foundation" copy="The reference data model is designed for PostgreSQL, with local and remote deployment patterns and API access that can evolve without tying clinical data to a proprietary platform." />
            <WorkCard index={4} title="AI service layer" copy="AI functions sit beside the clinical core rather than becoming the source of truth. Evidence retrieval, terminology assistance and later decision-support functions use explicit, auditable interfaces." label="Responsible clinical AI architecture" />
          </div>
        </div>
      </section>

      <section className="section clinical-section" aria-labelledby="ai-heading">
        <div className="shell section-split">
          <div className="section-intro sticky-intro">
            <p className="section-kicker">Clinical AI</p>
            <span className="status-chip amber">Architecture + scaffold</span>
            <h2 id="ai-heading">AI should illuminate the consultation, not become an invisible authority.</h2>
            <p>
              IML treats artificial intelligence as a clinical assistance layer whose inputs, evidence and consequences must remain inspectable. The first concrete AI foundation is not diagnosis generation: it is traceable retrieval of scientific evidence linked to the clinical context.
            </p>
            <p>
              The database already contains an additive <code>iml_ai</code> architecture for evidence sources, de-identified queries, source runs, canonical bibliographic records, identifiers and query results. The registered module is currently a scaffold, with external connectors intentionally disabled until validation.
            </p>
            <div className="design-note">
              <strong>First principle</strong>
              <p>The patient record remains the clinical source of truth. AI can retrieve, organise, suggest or explain; it must not silently rewrite facts, diagnoses, results or professional decisions.</p>
            </div>
          </div>

          <div className="module-grid">
            {aiItems.map(([title, copy], index) => (
              <WorkCard title={title} copy={copy} index={index} key={title} label="Responsible clinical AI workstream" />
            ))}
          </div>
        </div>
      </section>

      <section className="section" aria-labelledby="ai-flow-heading">
        <div className="shell">
          <div className="wide-heading">
            <p className="section-kicker">AI-EVIDENCE-01</p>
            <h2 id="ai-flow-heading">From a clinical question to evidence with a visible trail.</h2>
          </div>
          <div className="module-grid" style={{ marginTop: "34px" }}>
            <WorkCard index={0} title="1 · Clinical context" copy="An encounter or diagnostic assessment can initiate an evidence question without copying patient-identifying free text into the retrieval layer." label="AI evidence pipeline" />
            <WorkCard index={1} title="2 · De-identified query" copy="The search expression and its fingerprint are retained so the question can be reproduced and audited." label="AI evidence pipeline" />
            <WorkCard index={2} title="3 · Source-by-source execution" copy="Each external source run has its own status, timing, request/response fingerprints, result count and error state. Zero results and failures are part of the audit trail." label="AI evidence pipeline" />
            <WorkCard index={3} title="4 · Canonical evidence records" copy="Retrieved papers, reviews, guidelines or trial registrations are represented as canonical metadata with PMID, PMCID, DOI, NCT or other source identifiers where available." label="AI evidence pipeline" />
            <WorkCard index={4} title="5 · Clinician review" copy="Relevance and inclusion remain reviewable. The aim is to support professional judgement with traceable evidence rather than produce an unexplained answer." label="AI evidence pipeline" />
          </div>
          <div className="design-note" style={{ marginTop: "30px" }}>
            <strong>Initial evidence sources</strong>
            <p>PubMed / NCBI · Europe PMC · ClinicalTrials.gov · Crossref · Cochrane public metadata. Full publisher text is not stored by default, and institutional credentials are explicitly kept outside the evidence registry.</p>
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
              Consolidate the PostgreSQL clinical model, advance the terminology core and KSH97-P → ICD-10 mapping, implement the France HPRIM laboratory-result pathway, validate AI-EVIDENCE-01 connectors and provenance, preserve traceable correction, and keep the common core ready for the Guatemala Spanish adaptation.
            </p>
            <a className="text-link" href="/collaborate">Join the Open Clinical Workspace workstream →</a>
          </div>
        </div>
      </section>
    </PageFrame>
  );
}
