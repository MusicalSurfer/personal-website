"use client";

import { useEffect, useRef, useState } from "react";
import { fieldErrors, limits, services } from "../lib/contact-fields.mjs";

const emptyFields = { name: "", email: "", message: "", service: "not-sure" };

async function requestToken(signal) {
  const response = await fetch("/api/contact", { signal, cache: "no-store", credentials: "same-origin" });
  const data = await response.json();
  if (!response.ok || !data.token) throw new Error(data.message || "The contact form is temporarily unavailable. Please try again later.");
  return data.token;
}

export default function ContactForm() {
  const [values, setValues] = useState(emptyFields);
  const [errors, setErrors] = useState({});
  const [notice, setNotice] = useState({ kind: "", message: "" });
  const [pending, setPending] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const token = useRef(null);
  const formRef = useRef(null);
  const statusRef = useRef(null);

  useEffect(() => {
    setHydrated(true);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10_000);
    requestToken(controller.signal).then(value => { token.current = value; }).catch(error => {
      if (!controller.signal.aborted) setNotice({ kind: "error", message: error.message });
    }).finally(() => clearTimeout(timeout));
    function selectService(event) {
      if (services.some(service => service.value === event.detail)) setValues(current => ({ ...current, service: event.detail }));
    }
    window.addEventListener("grady:service", selectService);
    return () => { controller.abort(); clearTimeout(timeout); window.removeEventListener("grady:service", selectService); };
  }, []);

  function updateField(event) {
    const { name, value } = event.target;
    setValues(current => ({ ...current, [name]: value }));
    setErrors(current => ({ ...current, [name]: undefined }));
  }

  function showErrors(nextErrors) {
    setErrors(nextErrors);
    setNotice({ kind: "error", message: "Please check the highlighted fields." });
    requestAnimationFrame(() => formRef.current?.elements.namedItem(Object.keys(nextErrors)[0])?.focus());
  }

  async function submit(event) {
    event.preventDefault();
    if (pending) return;
    const nextErrors = fieldErrors(values);
    if (Object.keys(nextErrors).length) { showErrors(nextErrors); return; }
    setPending(true);
    setNotice({ kind: "", message: "Submitting your message…" });
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 45_000);
    try {
      if (!token.current) token.current = await requestToken(controller.signal);
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        signal: controller.signal,
        body: JSON.stringify({ ...values, website: formRef.current.elements.namedItem("website").value, token: token.current }),
      });
      const data = await response.json();
      if (data.errors) { showErrors(data.errors); return; }
      if (!response.ok) {
        if (["challenge_invalid", "challenge_expired", "challenge_reused"].includes(data.code)) token.current = null;
        throw new Error(data.message || "Your submission wasn’t confirmed. Please try again later.");
      }
      token.current = null;
      setValues(emptyFields);
      setErrors({});
      formRef.current.elements.namedItem("website").value = "";
      setNotice({ kind: "success", message: data.message });
      requestAnimationFrame(() => statusRef.current?.focus());
    } catch (error) {
      setNotice({ kind: "error", message: error.name === "AbortError" ? "Your submission wasn’t confirmed. Please wait before trying again; your message is still here." : error.message || "The contact form is temporarily unavailable. Please try again later." });
    } finally { clearTimeout(timeout); setPending(false); }
  }

  return (
    <div id="contact-form" className="contact-form-panel" tabIndex={-1} aria-labelledby="contact-form-title">
      <h3 id="contact-form-title">Tell me about your project.</h3>
      <p className="form-intro">Share the essentials. I’ll use these details to discuss your enquiry with you.</p>
      <noscript><p>Please enable JavaScript to use this contact form.</p></noscript>
      <form ref={formRef} onSubmit={submit} method="post" action="/api/contact" noValidate aria-busy={pending}>
        <fieldset disabled={!hydrated || pending}>
          <legend className="visually-hidden">Project enquiry details</legend>
          <div className="form-row">
            <div className="form-field"><label htmlFor="contact-name">Your name <span>(required)</span></label><input id="contact-name" name="name" autoComplete="name" required maxLength={limits.name} value={values.name} onChange={updateField} aria-invalid={Boolean(errors.name)} aria-describedby={errors.name ? "name-error" : undefined} />{errors.name && <p className="field-error" id="name-error">{errors.name}</p>}</div>
            <div className="form-field"><label htmlFor="contact-email">Your email <span>(required)</span></label><input id="contact-email" name="email" type="email" autoComplete="email" required maxLength={limits.email} value={values.email} onChange={updateField} aria-invalid={Boolean(errors.email)} aria-describedby={errors.email ? "email-error" : undefined} />{errors.email && <p className="field-error" id="email-error">{errors.email}</p>}</div>
          </div>
          <div className="form-field"><label htmlFor="contact-service">What can I help with?</label><select id="contact-service" name="service" value={values.service} onChange={updateField} aria-invalid={Boolean(errors.service)} aria-describedby={errors.service ? "service-error" : undefined}>{services.map(service => <option key={service.value} value={service.value}>{service.label}</option>)}</select>{errors.service && <p className="field-error" id="service-error">{errors.service}</p>}</div>
          <div className="form-field"><label htmlFor="contact-message">Your project <span>(required)</span></label><textarea id="contact-message" name="message" required minLength={20} maxLength={limits.message} rows={6} value={values.message} onChange={updateField} aria-invalid={Boolean(errors.message)} aria-describedby={errors.message ? "message-error message-hint" : "message-hint"} /><div className="message-helper"><p id="message-hint">A little context, what you need, and where you’d like to start.</p><span>{values.message.length.toLocaleString()} / 5,000</span></div>{errors.message && <p className="field-error" id="message-error">{errors.message}</p>}</div>
          <div className="form-honeypot" aria-hidden="true"><label htmlFor="contact-website">Leave this field empty</label><input id="contact-website" name="website" tabIndex={-1} autoComplete="off" /></div>
          <button className="button button-dark form-submit" type="submit" disabled={!hydrated || pending}>{pending ? "Submitting…" : "Send project enquiry"}<span aria-hidden="true">↗</span></button>
        </fieldset>
        <p ref={statusRef} className={"form-status " + notice.kind} tabIndex={-1} role={notice.kind === "error" ? "alert" : "status"} aria-live={notice.kind === "error" ? "assertive" : "polite"} aria-atomic="true">{notice.message}</p>
      </form>
    </div>
  );
}
