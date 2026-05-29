import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Stepe Digital Screening",
  description: "Latvian transcription and diarization screening test",
  icons: {
    icon: [{ url: "/favicon.ico?v=sd-logo-20260530", type: "image/png" }],
    shortcut: [{ url: "/favicon.ico?v=sd-logo-20260530", type: "image/png" }]
  }
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="lv">
      <body>{children}</body>
    </html>
  );
}
