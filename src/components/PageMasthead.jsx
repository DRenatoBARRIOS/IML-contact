export default function PageMasthead({ eyebrow, title, lede }) {
  return (
    <section className="page-masthead">
      <div className="shell page-masthead-grid">
        <div>
          <a className="back-home" href="/">← IML Health home</a>
          <p className="eyebrow">{eyebrow}</p>
          <h1>{title}</h1>
        </div>
        <p>{lede}</p>
      </div>
    </section>
  );
}
