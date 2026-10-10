import Image from "next/image";
import CompanyHeader from "./components/CompanyHeader";
import ServiceShowcase from "./components/ServiceShowcase";
import ContactForm from "./components/ContactForm";
import ScenicBackdrop from "./components/ScenicBackdrop";

const contactHref = "#contact-form";

function Arrow({ diagonal = false }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" className="arrow-icon">
      <path d={diagonal ? "M6 18 18 6M6 6h12v12" : "M4 12h16m-6-6 6 6-6 6"} stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

const steps = [
  { title: "Start with a conversation.", description: "Tell me what you’re building, who it’s for, and what needs to work better. We’ll define the scope and a practical next step." },
  { title: "Give the idea a shape.", description: "Map the essential experience and design a clear direction. You’ll have something concrete to review before we go further." },
  { title: "Build, review, refine.", description: "Develop in focused stages, review the real experience together, and work through the details before handover." },
  { title: "Keep it moving.", description: "Plan the handover and any ongoing care you need, with room for your website or software to grow over time." },
];

export default function Home() {
  return (
    <>
      <a className="skip-link" href="#main-content">Skip to content</a>
      <CompanyHeader />
      <main id="main-content" tabIndex={-1}>
        <section id="services" className="showcase-scene" aria-labelledby="hero-title">
          <ScenicBackdrop />
          <div className="section-shell showcase-layout">
            <div className="showcase-intro">
              <p className="eyebrow">Services / Independent software studio</p>
              <div className="showcase-heading">
                <h1 id="hero-title">A place for<br /><em>your next idea.</em></h1>
                <div>
                  <p>Websites and software, built around your business. Explore a service, then let’s shape the right way forward.</p>
                  <a className="text-link" href="#service-options">Find your starting point <span aria-hidden="true">↓</span></a>
                </div>
              </div>
            </div>
            <ServiceShowcase />
            <div className="showcase-footnote"><span>GRADY SOFTWARE SOLUTIONS</span><a href={contactHref}>Have something in mind? <Arrow diagonal /></a></div>
          </div>
        </section>

        <section id="approach" className="approach-section section-shell" aria-labelledby="approach-title">
          <div className="approach-intro">
            <p className="eyebrow">02 / How we’ll work</p>
            <h2 id="approach-title">A considered process.<br /><em>A shared direction.</em></h2>
            <p>Good work starts with understanding the problem. We’ll keep the scope clear, the conversation open, and the next step visible.</p>
            <a className="text-link" href={contactHref}>Start the conversation <Arrow diagonal /></a>
          </div>
          <ol className="process-list">
            {steps.map((step, index) => (
              <li key={step.title}><span className="step-number">0{index + 1}</span><div><h3>{step.title}</h3><p>{step.description}</p></div></li>
            ))}
          </ol>
        </section>

        <section id="about" className="about-section" aria-labelledby="about-title">
          <div className="section-shell about-grid">
            <div className="founder-portrait">
              <div className="portrait-ring" />
              <Image src="/5702.png" alt="Daniel Grady, founder of Grady Software Solutions" width={720} height={720} sizes="(max-width: 640px) 75vw, (max-width: 1100px) 32vw, 350px" />
              <span className="portrait-caption">DANIEL GRADY / SOFTWARE ENGINEER</span>
            </div>
            <div className="about-copy">
              <p className="eyebrow">03 / The person behind the work</p>
              <h2 id="about-title">Hello, I’m Daniel.<br /><em>Let’s build something useful.</em></h2>
              <p>I’m a software engineer and the founder of Grady Software Solutions. I create and manage websites and software for businesses, working remotely with clients.</p>
              <p>My focus is on the whole experience: understanding what you need, shaping how it works, and caring for the details that make it useful day to day.</p>
              <a className="text-link" href={contactHref}>Work with me <Arrow diagonal /></a>
            </div>
          </div>
        </section>

        <section id="contact" className="contact-section section-shell" aria-labelledby="contact-title">
          <p className="eyebrow">04 / Let’s make a start</p>
          <div className="contact-heading">
            <h2 id="contact-title">What are you<br /><em>thinking of building?</em></h2>
            <a className="contact-arrow" href={contactHref} aria-label="Go to the project enquiry form"><Arrow diagonal /></a>
          </div>
          <div className="contact-details">
            <p>A new website, a custom tool, or a better way to manage what you have. Share a little about your project and we’ll take it from there.</p>
            <p className="contact-note">Start with the form below. A clear brief is a good beginning.</p>
          </div>
          <ContactForm />
        </section>
      </main>
      <footer className="site-footer section-shell">
        <a href="#top" className="footer-brand">Grady Software Solutions</a>
        <p>© 2026 Grady Software Solutions LLC</p>
        <a className="back-to-top" href="#top">Back to top <span aria-hidden="true">↑</span></a>
      </footer>
    </>
  );
}
