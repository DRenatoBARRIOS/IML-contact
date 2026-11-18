import React from "react";
import { navigation } from "../siteConfig.js";
import "./PrimaryNavigation.css";

export default function PrimaryNavigation({ active }) {
  const isActive = (item) => item.href === active || item.children?.some(child => child.href === active);
  return <>
    <nav className="desktop-nav iml-unified-nav" aria-label="Primary navigation">
      {navigation.map(item => item.children ? (
        <details className="iml-nav-dropdown" key={item.label}>
          <summary aria-current={isActive(item) ? "page" : undefined}>{item.label}</summary>
          <div className="iml-nav-submenu">
            {item.children.map(child => <a href={child.href} key={child.href} aria-current={child.href === active ? "page" : undefined}>{child.label}</a>)}
          </div>
        </details>
      ) : <a href={item.href} key={item.href} aria-current={isActive(item) ? "page" : undefined}>{item.label}</a>)}
    </nav>
    <details className="mobile-menu iml-unified-mobile">
      <summary>Menu</summary>
      <nav aria-label="Mobile navigation">
        {navigation.map(item => item.children ? (
          <div className="iml-mobile-science" key={item.label}>
            <strong>{item.label}</strong>
            {item.children.map(child => <a href={child.href} key={child.href} aria-current={child.href === active ? "page" : undefined}>{child.label}</a>)}
          </div>
        ) : <a href={item.href} key={item.href} aria-current={isActive(item) ? "page" : undefined}>{item.label}</a>)}
      </nav>
    </details>
  </>;
}