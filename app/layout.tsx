import type { Metadata, Viewport } from "next";
import { Figtree, Hanken_Grotesk, Instrument_Sans, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { SessionProvider } from "@/components/providers/session-provider";
import { Toaster } from "@/components/ui/sonner";
import { Analytics } from "@/components/analytics/analytics";
import { RegisterServiceWorker } from "@/components/pwa/register-sw";

const figtree = Figtree({
  subsets: ["latin"],
  display: "swap",
});

const instrument = Instrument_Sans({
  subsets: ["latin"],
  style: ["normal", "italic"],
  display: "swap",
  variable: "--font-instrument",
});

const hanken = Hanken_Grotesk({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-hanken",
});

const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-jetbrains",
});

const description =
  "Personal AI voice agents with names, voices and memory. They call you with what matters, answer when you call, and get things done for you. Free to start.";

// CSS width, height and pixel ratio of the iPhones with a launch screen in public/splash.
const SPLASH: [number, number, number][] = [
  [440, 956, 3],
  [402, 874, 3],
  [430, 932, 3],
  [393, 852, 3],
  [428, 926, 3],
  [390, 844, 3],
  [375, 812, 3],
  [414, 896, 3],
  [414, 896, 2],
  [375, 667, 2],
];

export const metadata: Metadata = {
  metadataBase: new URL("https://callio.site"),
  title: {
    default: "Callio · Agents that pick up the phone",
    template: "%s · Callio",
  },
  description,
  applicationName: "Callio",
  keywords: [
    "AI voice assistant",
    "AI phone call assistant",
    "personal AI agent",
    "AI that calls you",
    "daily briefing",
    "AI reminders",
    "voice AI",
    "AI accountability partner",
    "AI calls elderly parents",
  ],
  category: "productivity",
  openGraph: {
    type: "website",
    siteName: "Callio",
    title: "Callio · Agents that pick up the phone",
    description,
    url: "https://callio.site",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Callio · Agents that pick up the phone",
    description,
  },
  robots: { index: true, follow: true },
  formatDetection: { telephone: false },
  appleWebApp: {
    capable: true,
    title: "Callio",
    statusBarStyle: "default",
    // iPhone launch screens: the logo on Callio's background instead of a white flash.
    startupImage: SPLASH.map(([w, h, dpr]) => ({
      url: `/splash/${w * dpr}x${h * dpr}.png`,
      media: `(device-width: ${w}px) and (device-height: ${h}px) and (-webkit-device-pixel-ratio: ${dpr}) and (orientation: portrait)`,
    })),
  },
  icons: { apple: "/brand/apple-touch-icon.png" },
};

export const viewport: Viewport = {
  // Edge to edge on notched phones; layouts pad with env(safe-area-inset-*).
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#F3F2EE" },
    { media: "(prefers-color-scheme: dark)", color: "#111111" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${instrument.variable} ${hanken.variable} ${jetbrains.variable}`}
    >
      <body className={`${figtree.className} antialiased`}>
        <SessionProvider>
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
            {children}
            <Toaster />
            <Analytics />
            <RegisterServiceWorker />
          </ThemeProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
