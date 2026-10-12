import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://pitch.alttrednexxus.com"),
  title: "Meera — Social Media Pitch",
  description: "Social media pitch for Cavinkare Meera. Alttred Nexxus, October 2026.",
  // Client pitch: keep it out of search results.
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
