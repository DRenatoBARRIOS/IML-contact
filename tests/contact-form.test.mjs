import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const page = fs.readFileSync(new URL("../src/pages/SitePages.jsx", import.meta.url), "utf8");
const css = fs.readFileSync(new URL("../src/App.css", import.meta.url), "utf8");

test("Collaborate page exposes the configured contact form", () => {
  assert.match(page, /Write to IML Health/);
  assert.match(page, /https:\/\/formspree\.io\/f\/mjykrewj/);
  assert.match(page, /name="message"/);
  assert.match(page, /iml\.health@pm\.me/);
});

test("Current footer email remains textual and clickable", () => {
  assert.match(page, /className="footer-email"/);
  assert.match(page, />\s*iml\.health@pm\.me\s*</);
  assert.doesNotMatch(page, /footer-mail-icon/);
});

test("Contact styles are isolated from footer styles", () => {
  assert.match(css, /\.contact-form-section/);
  assert.match(css, /\.contact-submit/);
  assert.match(css, /\.footer-email/);
});
