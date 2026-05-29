import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Stepe Digital Screening",
  description: "Latvian transcription and diarization screening test"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="lv">
      <body>{children}</body>
    </html>
  );
}
