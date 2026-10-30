import type { Metadata } from "next";
import { JetBrains_Mono, Sarabun } from "next/font/google";
import "./globals.css";

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-jetbrains-mono",
  display: "swap",
});

const sarabun = Sarabun({
  subsets: ["thai", "latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-sarabun",
  display: "swap",
});

export const metadata: Metadata = {
  title: "TypeSpeak — ระบบฝึกพิมพ์และฝึกอ่านออกเสียง (TTS)",
  description:
    "เว็บฝึกพิมพ์ดีดสไตล์ Monkeytype พร้อมระบบอ่านออกเสียง (Text-to-Speech) รองรับภาษาไทยและภาษาอังกฤษ",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="th"
      className={`${jetbrainsMono.variable} ${sarabun.variable}`}
    >
      <body className="bg-mt-bg font-sans text-mt-text selection:bg-mt-accent selection:text-mt-bg">
        {children}
      </body>
    </html>
  );
}

