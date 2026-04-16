import type { Metadata } from "next";
import { Inter, Fraunces } from "next/font/google";
import "./globals.css";
import { agent, branding, business } from "@/lib/config";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  axes: ["SOFT", "WONK", "opsz"],
  display: "swap",
});

export const metadata: Metadata = {
  title: `${branding.dashboardTitle} — ${agent.name}`,
  description: `Panel de control para ${business.name}. Alta estética, odontología reconstructiva y cirugía maxilofacial.`,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${inter.variable} ${fraunces.variable} h-full antialiased`}
    >
      <body
        className="min-h-full flex flex-col font-sans bg-background text-foreground"
        style={{ "--brand-color": branding.primaryColor } as React.CSSProperties}
      >
        {children}
      </body>
    </html>
  );
}
