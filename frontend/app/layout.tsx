import type { Metadata } from "next";
import { Geist_Mono, Space_Grotesk } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import AudioUnlocker from "../components/AudioUnlocker";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Mathphic",
  description: "Mathphic - Visual Math Learning",
  icons: {
    icon: "/logo.webp",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${spaceGrotesk.variable} ${geistMono.variable} antialiased`}
      >
        <Script src="https://www.desmos.com/api/v1.9/calculator.js?apiKey=dcb31709b452b1cf9dc26972add0fda6" strategy="beforeInteractive" />
        <Script
          id="MathJax-config"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              window.MathJax = {
                svg: { fontCache: 'local' }
              };
            `,
          }}
        />
        <Script
          src="https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-svg.js"
          strategy="beforeInteractive"
        />
        <AudioUnlocker />
        {children}
      </body>
    </html>
  );
}
