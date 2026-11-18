
import logoImage from "../assets/iml-logo.png";
import PrimaryNavigation from "./PrimaryNavigation.jsx";

function SiteHeader({ active, home }) {
  return (
    <header className="site-header">
      <div className="shell header-inner">
        <a className={`brand${home ? " brand-home" : ""}`} href="/" aria-label="IML Health home">
          {!home ? (
            <span className="brand-mark" aria-hidden="true">
              <img src={logoImage} alt="" width="54" height="64" />
            </span>
          ) : null}
          <span className="brand-copy">
            <strong>IML Health</strong>
            <span>Open Health Information Environment</span>
          </span>
        </a>

        <PrimaryNavigation active={active} />
      </div>
    </header>
  );
}

function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="shell footer-grid">
        <div className="footer-brand">
          <div>
            <strong>IML Health</strong>
            <p>Independent, non-commercial and open for scientific review.</p>
          </div>
        </div>
        <div>
          <h3>Explore</h3>
          <a href="/clinical-workspace">Clinical workspace</a>
          <a href="/interoperability">Integration layer</a>
          <a href="/country-profiles">Country profiles</a>
        </div>
        <div>
          <h3>Project</h3>
          <a href="/vision">Vision</a>
          <a href="/identity-trust">Identity &amp; Trust</a>
          <a href="/collaborate">Collaborate</a>
        </div>
      </div>
      <div className="shell footer-bottom">
        <span>© {new Date().getFullYear()} IML Health</span>
        <span>Country geometry: Natural Earth public-domain data.</span>
      </div>
    </footer>
  );
}

export default function PageFrame({ active, home = false, children }) {
  return (
    <>
      <a className="skip-link" href="#page-content">Skip to the content</a>
      <SiteHeader active={active} home={home} />
      <main id="page-content">{children}</main>
      <SiteFooter />
    </>
  );
}
