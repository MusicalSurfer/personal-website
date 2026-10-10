"use client";

import { useState } from "react";

const offerings = [
  { id: "website-management", label: "Website management", tag: "ONGOING CARE", headline: "Keep your website\nin good hands.", description: "Keep your content current and your website moving with your business.", details: ["Content updates and site changes", "Maintenance and improvements", "A clear plan for ongoing care"], art: "care", offset: "58px" },
  { id: "website-creation", label: "Website creation", tag: "A NEW FOUNDATION", headline: "A home for\nyour business.", description: "A custom website that gives your services a clear, considered presence.", details: ["Website design and development", "Responsive phone and desktop layouts", "Thoughtful navigation and contact flow"], art: "web", offset: "0px" },
  { id: "custom-application", label: "Custom application", tag: "BUILT AROUND YOU", headline: "Your idea.\nWorking software.", description: "Turn an idea or a business workflow into a useful, purposeful application.", details: ["Custom web applications", "Business tools and workflows", "Full-stack software development"], art: "app", offset: "32px" },
];

function Arrow() {
  return <svg className="arrow-icon" aria-hidden="true" viewBox="0 0 24 24" fill="none"><path d="M6 18 18 6M6 6h12v12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}

export default function ServiceShowcase() {
  const [expanded, setExpanded] = useState(null);
  function chooseService(id) {
    window.dispatchEvent(new CustomEvent("grady:service", { detail: id }));
  }

  return (
    <div id="service-options" className="service-showcase">
      {offerings.map((offering, index) => (
        <article key={offering.id} className={"floating-service floating-" + offering.art + (expanded === offering.id ? " is-expanded" : "")} style={{ "--card-offset": offering.offset }}>
          <div className="floating-topline"><span>0{index + 1} / {offering.tag}</span><Arrow /></div>
          <div className={"service-art service-art-" + offering.art} aria-hidden="true"><div className="art-window"><span className="art-toolbar"><i /><i /><i /></span><span className="art-layout"><i /><i /><i /><i /></span></div><span className="art-orbit" /></div>
          <div className="floating-copy">
            <p className="floating-label">{offering.label}</p>
            <h2>{offering.headline.split("\n").map((line, lineIndex) => <span key={line}>{lineIndex === 1 ? <em>{line}</em> : line}</span>)}</h2>
            <p className="floating-description">{offering.description}</p>
            <button className="service-details-toggle" type="button" aria-expanded={expanded === offering.id} aria-controls={"details-" + offering.id} onClick={() => setExpanded(expanded === offering.id ? null : offering.id)}>{expanded === offering.id ? "Close details" : "Explore this service"}<span aria-hidden="true">{expanded === offering.id ? "−" : "+"}</span></button>
            <div id={"details-" + offering.id} className="service-expanded-details" hidden={expanded !== offering.id}>
              <ul>{offering.details.map(detail => <li key={detail}>{detail}</li>)}</ul>
              <p>Scope and ongoing support are discussed around your needs.</p>
              <a href="#contact-form" className="choose-service" onClick={() => chooseService(offering.id)}>Choose this service <Arrow /></a>
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}
