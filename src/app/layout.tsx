import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { AppShell } from "@/components/layout/AppShell";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "NInsideN — See AI From The Inside",
    template: "%s | NInsideN",
  },
  description:
    "Type a prompt and watch the full observable AI pipeline: tokenisation, retrieval, context building, and streamed model response. Neural Inside Network.",
  keywords: [
    "AI visualization",
    "neural network",
    "RAG pipeline",
    "LLM trace",
    "token streaming",
    "AI education",
  ],
  openGraph: {
    title: "NInsideN — See AI From The Inside",
    description: "Watch your prompt become an answer. Visual AI trace lab.",
    url: "https://ninsiden.com",
    siteName: "NInsideN",
    locale: "en_US",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable}`}>
      <body>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
