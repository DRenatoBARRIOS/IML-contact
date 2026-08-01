import CountryExplorer from "../components/CountryExplorer.jsx";
import PageMasthead from "../components/PageMasthead.jsx";
import PageFrame from "../components/SiteChrome.jsx";

export default function CountryProfilesPage() {
  return (
    <PageFrame active="/country-profiles">
      <PageMasthead eyebrow="Country evidence" title="Maturity profiles, never rankings." lede="Select a country to inspect its six-domain orientation, documentary sources and known limits. Geographic coverage describes the dataset, not country performance." />
      <section className="section profiles-section" aria-labelledby="profiles-heading">
        <div className="shell">
          <div className="wide-heading profiles-heading"><div><p className="section-kicker">Live explorer</p><h2 id="profiles-heading">Evidence and limitations remain visible together.</h2></div><p>The explorer reads the live PostgreSQL-backed API. Scores structure inquiry; they are provisional, evidence-dependent and unsuitable for league tables.</p></div>
          <CountryExplorer />
        </div>
      </section>
    </PageFrame>
  );
}
