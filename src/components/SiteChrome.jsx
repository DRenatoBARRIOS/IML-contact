
import logoImage from "../assets/iml-logo.png";

export const navigation = [
  { href: "/vision", label: "Vision" },
  { href: "/identity-trust", label: "Identity & Trust" },
  { href: "/clinical-workspace", label: "Clinical Workspace" },
  { href: "/interoperability", label: "Interoperability" },
  { href: "/country-profiles", label: "Country Profiles" },
  { href: "/manuscripts", label: "Manuscripts" },
  { href: "/collaborate", label: "Collaborate" },
];

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

        <nav className="desktop-nav" aria-label="Primary navigation">
          {navigation.map((item) => (
            <a href={item.href} key={item.href} aria-current={active === item.href ? "page" : undefined}>
              {item.label}
            </a>
          ))}
        </nav>

        <details className="mobile-menu">
          <summary>Menu</summary>
          <nav aria-label="Mobile navigation">
            <a href="/" aria-current={active === "/" ? "page" : undefined}>Home</a>
            {navigation.map((item) => (
              <a href={item.href} key={item.href} aria-current={active === item.href ? "page" : undefined}>
                {item.label}
              </a>
            ))}
          </nav>
        </details>
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
          <a href="/manuscripts">Manuscripts</a>
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
