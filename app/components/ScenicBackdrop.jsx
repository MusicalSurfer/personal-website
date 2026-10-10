"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

export default function ScenicBackdrop() {
  const frame = useRef(null);
  const videoRef = useRef(null);
  const controls = useRef(null);
  const [paused, setPaused] = useState(false);
  const [mode, setMode] = useState("checking");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const saveData = navigator.connection?.saveData === true;
    let optedIn = !saveData;
    let userPaused = saveData;
    let visible = false;
    let failed = false;
    let disposed = false;
    const sync = () => {
      if (disposed) return;
      if (preference.matches) {
        video.pause();
        video.removeAttribute("src");
        video.load();
        setReady(false);
        setMode("reduced");
        return;
      }
      if (!optedIn) { setMode("manual"); setPaused(true); return; }
      if (failed) return;
      setMode("video");
      if (userPaused || !visible || document.hidden) { video.pause(); return; }
      if (!video.hasAttribute("src")) video.src = "/scenery/company-sequence-v3.mp4";
      video.play().catch(error => {
        if (disposed || preference.matches || failed || error.name === "AbortError") return;
        userPaused = true;
        setPaused(true);
        setMode("manual");
      });
    };
    const onReady = () => { if (!disposed && !preference.matches && !failed) setReady(true); };
    const onError = () => {
      if (disposed) return;
      failed = true;
      video.pause();
      video.removeAttribute("src");
      video.load();
      setReady(false);
      setMode("fallback");
    };
    const observer = new IntersectionObserver(entries => { visible = entries[0].isIntersecting; sync(); });
    observer.observe(frame.current);
    preference.addEventListener("change", sync);
    document.addEventListener("visibilitychange", sync);
    video.addEventListener("loadeddata", onReady);
    video.addEventListener("error", onError);
    controls.current = () => {
      if (!optedIn) { optedIn = true; userPaused = false; }
      else userPaused = !userPaused;
      setPaused(userPaused);
      sync();
    };
    sync();
    return () => {
      disposed = true;
      observer.disconnect();
      preference.removeEventListener("change", sync);
      document.removeEventListener("visibilitychange", sync);
      video.removeEventListener("loadeddata", onReady);
      video.removeEventListener("error", onError);
      video.pause();
      video.removeAttribute("src");
      video.load();
      controls.current = null;
    };
  }, []);

  const playLabel = mode === "manual" ? "Play scenery" : paused ? "Resume scenery" : "Pause scenery";
  return (
    <>
      <div className="scene-background" aria-hidden="true">
        <div ref={frame} className="scene-image-frame" data-scenery-mode={mode}>
          <Image className="scenic-backdrop" src="/scenic-alpine-v1.png" alt="" fill priority sizes="100vw" quality={80} />
          <video ref={videoRef} className={"scene-video" + (ready ? " is-active" : "")} muted playsInline loop preload="none" tabIndex={-1} />
          <div className="scene-shade" />
        </div>
      </div>
      <button className="scene-motion-toggle" type="button" hidden={mode === "checking" || mode === "reduced" || mode === "fallback"} onClick={() => controls.current?.()} aria-label={playLabel}>
        <span aria-hidden="true">{mode === "manual" || paused ? "▷" : "Ⅱ"}</span> {playLabel}
      </button>
    </>
  );
}
