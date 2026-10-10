"use client";

import { useEffect, useRef, useState } from "react";

export default function CompanyHeader() {
  const [isOpen, setIsOpen] = useState(false);
  const menuButton = useRef(null);

  useEffect(() => {
    if (!isOpen) return;
    const closeOnEscape = (event) => {
      if (event.key === "Escape") {
        setIsOpen(false);
        menuButton.current?.focus();
      }
    };
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [isOpen]);

  return (
    <header id="top" className="site-header section-shell">
      <a className="brand" href="#top" aria-label="Grady Software Solutions home" onClick={() => setIsOpen(false)}>
        <svg className="brand-mark" aria-hidden="true" viewBox="0 48 123 82" fill="currentColor"><path d="M41.7 61H61v-6.3H41.7q-14.4 0-24.4 10.2Q7.2 75.2 7.2 90.6q0 14.3 10.1 24.4t24.4 10.1H61V86.7H39.2v6.4h15.3v25.6H41.7q-11.4 0-19.7-8.3t-8.3-19.8q0-12.5 8.3-21.1Q30.2 61 41.7 61z" /><path d="M75 62.3h37.7v-7.6H75q-7.4 0-12.4 5.8-5.1 5.9-5.1 14.3 0 7.6 5.1 13.2 5 5.7 12.4 5.7h20.2q4.5 0 8 3.8 3.3 4 3.3 8.7 0 5.6-3.25 9.1t-8.05 3.5H57.5v6.2h37.7q7.5 0 12.5-5.2t5-13.6q0-7.6-5-13.2-5.1-5.6-12.5-5.6H75q-4.6 0-7.9-4-3.4-3.7-3.4-8.6 0-5.6 3.25-9.05T75 62.3z" /></svg>
        <span>Grady<span className="brand-subtitle">Software Solutions</span></span>
      </a>
      <button ref={menuButton} className="menu-toggle" type="button" aria-expanded={isOpen} aria-controls="primary-navigation" onClick={() => setIsOpen(!isOpen)}><span>{isOpen ? "Close" : "Menu"}</span><svg aria-hidden="true" viewBox="0 0 24 24" fill="none"><path d={isOpen ? "m6 6 12 12M6 18 18 6" : "M4 8h16M4 16h16"} stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg></button>
      <nav id="primary-navigation" className={"primary-navigation" + (isOpen ? " is-open" : "")} aria-label="Main navigation">
        <a href="#services" onClick={() => setIsOpen(false)}>Services</a>
        <a href="#approach" onClick={() => setIsOpen(false)}>Approach</a>
        <a href="#about" onClick={() => setIsOpen(false)}>About</a>
        <a className="nav-contact" href="#contact" onClick={() => setIsOpen(false)}>Let’s talk <span aria-hidden="true">↗</span></a>
      </nav>
    </header>
  );
}
