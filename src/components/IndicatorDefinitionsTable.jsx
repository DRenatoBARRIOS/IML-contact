import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

const INDICATORS = [
  ["Governance & Standards", "Institutional ownership, legal frameworks, standards governance, accountability and national steering capacity."],
  ["Technical Interoperability", "Exchange models, APIs, semantics, technical integration quality, service continuity and architecture coherence."],
  ["Identity & Trust", "Identity matching, authentication, consent, provider and patient identification, and trust services."],
  ["Security", "Privacy safeguards, access control, traceability, cyber readiness and defensible trust practices."],
  ["Adoption", "Operational rollout, user uptake, field deployment, integration into workflows and implementation depth."],
  ["Correction & Feedback", "Redress, correction, complaint handling, recourse pathways and institutional learning from failures."],
];

export default function IndicatorDefinitionsTable() {
  const [target, setTarget] = useState(null);

  useEffect(() => {
    setTarget(document.querySelector(".profiles-section .shell"));
  }, []);

  if (!target) return null;

  return createPortal(
    <section aria-labelledby="iml-indicator-definitions" style={{ marginTop: "48px" }}>
      <h2 id="iml-indicator-definitions">IML indicator definitions</h2>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", marginTop: "18px" }}>
          <tbody>
            {INDICATORS.map(([title, description]) => (
              <tr key={title}>
                <th scope="row" style={{ width: "28%", padding: "14px 16px", borderBottom: "1px solid #d8cdbb", textAlign: "left", verticalAlign: "top" }}>{title}</th>
                <td style={{ padding: "14px 16px", borderBottom: "1px solid #d8cdbb", verticalAlign: "top" }}>{description}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>,
    target,
  );
}
