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

test("Footer exposes one textual email on the left and no duplicate right-hand email", () => {
  assert.match(page, /className="footer-brand"[\s\S]*className="footer-email"[\s\S]*iml\.health@pm\.me/);
  assert.doesNotMatch(page, /<strong>IML Health<\/strong>/);
  assert.doesNotMatch(page, /footer-mail-icon/);
});

test("Contact styles are isolated from footer styles", () => {
  assert.match(css, /\.contact-form-section/);
  assert.match(css, /\.contact-submit/);
  assert.match(css, /\.footer-email/);
});


test("Contact status reflects the real Formspree HTTP response", () => {
  assert.match(page, /onSubmit=\{handleContactSubmit\}/);
  assert.match(page, /fetch\(form\.action/);
  assert.match(page, /Accept: "application\/json"/);
  assert.match(page, /if \(!response\.ok\)/);
  assert.match(page, /Message received by the contact service/);
  assert.match(page, /The message could not be sent\./);
  assert.match(page, /disabled=\{contactStatus\.state === "sending"\}/);
  assert.match(page, /Email IML Health directly\./);
});

test("Contact feedback has visible success and error states", () => {
  assert.match(css, /\.contact-status\.is-success/);
  assert.match(css, /\.contact-status\.is-error/);
  assert.match(css, /\.contact-submit:disabled/);
});


test("Collaborate intro does not duplicate the email address", () => {
  const collaborateStart = page.indexOf("function CollaboratePage()");
  const formStart = page.indexOf("<form", collaborateStart);
  const intro = page.slice(collaborateStart, formStart);
  assert.doesNotMatch(intro, /mailto:iml\.health@pm\.me/);
});
