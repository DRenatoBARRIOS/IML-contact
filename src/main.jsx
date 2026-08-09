import { StrictMode, useEffect } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import "./App.css";
import "./visual-system.css";

function MainTestApp() {
  useEffect(() => {
    const streamlineHomeAndNavigation = () => {
      document.querySelectorAll(".desktop-nav, .mobile-menu nav").forEach((nav) => {
        const interoperability = nav.querySelector('a[href="/interoperability"]');
        const identity = nav.querySelector('a[href="/identity-trust"]');
        if (interoperability && identity) nav.insertBefore(interoperability, identity);
      });

      document.querySelector(".hero-actions")?.remove();

      const interoperabilityTitle = document.querySelector(
        '.path-card[href="/interoperability"] strong'
      );
      if (interoperabilityTitle) interoperabilityTitle.textContent = "Interoperability";

      const footerInteroperability = document.querySelector(
        '.site-footer a[href="/interoperability"]'
      );
      if (footerInteroperability) footerInteroperability.textContent = "Interoperability";
    };

    streamlineHomeAndNavigation();
    const frame = window.requestAnimationFrame(streamlineHomeAndNavigation);
    return () => window.cancelAnimationFrame(frame);
  }, []);

  return <App />;
}

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <MainTestApp />
  </StrictMode>
);
