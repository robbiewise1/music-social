import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Nav } from "./_components/nav";
import { MobileNav } from "./_components/mobile-nav";
import { ServiceWorkerRegister } from "./_components/service-worker-register";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  themeColor: "#6d28d9",
};

export const metadata: Metadata = {
  title: "Music Club",
  description: "Share songs with friends. Respond to daily music prompts.",
  robots: { index: false, follow: false },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Music Club",
  },
  icons: {
    apple: "/icons/apple-touch-icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased overflow-y-scroll`}
    >
      <body className="min-h-full flex flex-col pb-16 sm:pb-0">
        <Nav />
        <ServiceWorkerRegister />
        {children}
        <MobileNav />
      </body>
    </html>
  );
}
