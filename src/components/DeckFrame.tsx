"use client";

import { useEffect, useRef } from "react";

const deckUrl = `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/deck/index.html`;

/** Full-screen host for the static Meera deck in /public/deck. */
export default function DeckFrame() {
  const frame = useRef<HTMLIFrameElement>(null);

  // Set src after mount so a deep link like …/cavinkare-meera_131026#5 opens that slide.
  useEffect(() => {
    if (frame.current) frame.current.src = deckUrl + window.location.hash;
  }, []);

  return (
    <>
      <iframe
        ref={frame}
        title="Meera — Social Media Pitch"
        allow="fullscreen; autoplay"
        allowFullScreen
        onLoad={() => frame.current?.contentWindow?.focus()}
        className="fixed inset-0 size-full border-0 bg-[#120203]"
      />
      <noscript>
        <a href={deckUrl}>Open the deck</a>
      </noscript>
    </>
  );
}
