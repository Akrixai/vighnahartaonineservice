import type { Metadata } from "next";
import { Inter, Noto_Sans_Devanagari } from "next/font/google";
import "./globals.css";
import NextAuthSessionProvider from "@/components/providers/session-provider";
import { Toaster } from "react-hot-toast";
import WhatsAppNotificationProvider from "@/components/WhatsAppNotificationProvider";

import ErrorBoundary from "@/components/ErrorBoundary";

const inter = Inter({ subsets: ["latin"] });
const notoSansDevanagari = Noto_Sans_Devanagari({
  subsets: ["devanagari", "latin"],
  variable: '--font-devanagari'
});

export const metadata: Metadata = {
  metadataBase: new URL('http://localhost:3000'),
  title: {
    default: "विघ्नहर्ता जनसेवा - Government Service Portal | Digital India Initiative",
    template: "%s | विघ्नहर्ता जनसेवा"
  },
  description: "India's premier digital government service portal connecting citizens with essential services through our nationwide retailer network. Access Aadhaar, PAN, passport, certificates, and more with ease.",
  keywords: [
    "government services",
    "digital india",
    "online services",
    "aadhaar card",
    "pan card",
    "passport",
    "certificates",
    "retailer network",
    "vignaharta janseva",
    "विघ्नहर्ता जनसेवा",
    "government portal",
    "digital services",
    "online applications"
  ],
  authors: [{ name: "विघ्नहर्ता जनसेवा Team" }],
  creator: "Government of India",
  publisher: "विघ्नहर्ता जनसेवा",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    url: 'http://localhost:3000',
    siteName: 'विघ्नहर्ता जनसेवा',
    title: 'विघ्नहर्ता जनसेवा - Government Service Portal',
    description: 'Access essential government services digitally through our secure platform with real-time tracking and nationwide retailer support.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'विघ्नहर्ता जनसेवा - Government Service Portal',
    description: 'Access essential government services digitally through our secure platform.',
  },
  verification: {
    google: 'your-google-verification-code',
  },
  alternates: {
    canonical: 'http://localhost:3000',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preload" href="/vignaharta.jpg" as="image" />
        <link rel="preload" href="/vignaharta.svg" as="image" />
      </head>
      <body className={`${inter.className} ${notoSansDevanagari.variable} antialiased`}>
        <NextAuthSessionProvider>
          <WhatsAppNotificationProvider>
            <ErrorBoundary>
              {children}
            <Toaster
              position="top-right"
              toastOptions={{
                duration: 4000,
                style: {
                  background: '#363636',
                  color: '#fff',
                },
                success: {
                  duration: 3000,
                  style: {
                    background: '#10b981',
                  },
                },
                error: {
                  duration: 5000,
                  style: {
                    background: '#ef4444',
                  },
                },
              }}
            />
          </ErrorBoundary>
          </WhatsAppNotificationProvider>
        </NextAuthSessionProvider>
      </body>
    </html>
  );
}
