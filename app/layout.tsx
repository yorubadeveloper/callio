import type { Metadata, Viewport } from "next";
import { Figtree, Hanken_Grotesk, Instrument_Sans, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { SessionProvider } from "@/components/providers/session-provider";
import { Toaster } from "@/components/ui/sonner";

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
  "Callio agents call you with what matters, answer when you ring, and make the calls you keep putting off.";

export const metadata: Metadata = {
  metadataBase: new URL("https://callio.site"),
  title: {
    default: "Callio · Agents that pick up the phone",
    template: "%s · Callio",
  },
  description,
  applicationName: "Callio",
  openGraph: {
    type: "website",
    siteName: "Callio",
    title: "Callio · Agents that pick up the phone",
    description,
    url: "https://callio.site",
  },
  twitter: {
    card: "summary_large_image",
    title: "Callio · Agents that pick up the phone",
    description,
  },
};

export const viewport: Viewport = {
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
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            {children}
            <Toaster />
          </ThemeProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
