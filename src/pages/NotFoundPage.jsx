import PageMasthead from "../components/PageMasthead.jsx";
import PageFrame from "../components/SiteChrome.jsx";

export default function NotFoundPage() {
  return (
    <PageFrame active="/">
      <PageMasthead eyebrow="404" title="This page is not part of the current IML site." lede="The site is now organised into distinct pages. Use the navigation or return to the project home." />
      <section className="section"><div className="shell"><a className="button primary" href="/">Return to IML Health</a></div></section>
    </PageFrame>
  );
}
