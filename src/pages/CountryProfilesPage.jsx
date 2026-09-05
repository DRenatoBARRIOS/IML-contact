import CountryExplorer from "../components/CountryExplorer.jsx";
import PageMasthead from "../components/PageMasthead.jsx";
import PageFrame from "../components/SiteChrome.jsx";

export default function CountryProfilesPage() {
  return (
    <PageFrame active="/country-profiles">
      <PageMasthead compact eyebrow="Country evidence" title="Country profiles" lede="Explore evidence, sources and limitations across six domains. Profiles support inquiry; they are evidence profiles, not rankings. Formal availability alone is not enough: implementation, correction, answerability and institutional follow-through also matter." />
      <section className="section profiles-section" aria-labelledby="profiles-heading">
        <div className="shell">
          <div className="profiles-heading"><p className="section-kicker">Live explorer</p><p id="profiles-heading">Select any country on the map. Neutral means not yet examined, never low maturity. The Learning domain covers correction, continuous improvement, traceable reuse, institutional documentary reliability and institutional responsiveness.</p></div>
          <CountryExplorer />
        </div>
      </section>
    </PageFrame>
  );
}
