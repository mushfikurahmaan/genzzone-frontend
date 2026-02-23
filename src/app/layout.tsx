import type { Metadata } from "next";
import { Funnel_Sans, Space_Grotesk } from "next/font/google";
import { Suspense } from "react";
import "./globals.css";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { CartProvider } from "@/contexts/CartContext";
import { CsrfInitializer } from "@/components/CsrfInitializer";
import { MobileNavigation } from "@/components/MobileNavigation";
import { LoadingScreen } from "@/components/LoadingScreen";
import { MetaPixelScripts } from "@/components/TrackingScripts";
import { PixelPageViewTracker } from "@/components/PixelPageViewTracker";
import { serverTrackingApi } from "@/lib/api-server";

const funnelSans = Funnel_Sans({
  variable: "--font-funnel-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  style: ["normal", "italic"],
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "GEN-Z ZONE",
  description: "Your premium shopping destination",
  icons: {
    icon: "/media/genzzone.jpg",
    shortcut: "/media/genzzone.jpg",
    apple: "/media/genzzone.jpg",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const trackingCodes = await serverTrackingApi.getActive();
  const pixelIds = trackingCodes.map((c) => c.pixel_id).filter(Boolean);

  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${funnelSans.variable} ${spaceGrotesk.variable} antialiased`}
        suppressHydrationWarning
      >
        <MetaPixelScripts pixelIds={pixelIds} />
        <PixelPageViewTracker />
        <CsrfInitializer />
        <CartProvider>
          <Suspense fallback={null}>
            <LoadingScreen />
          </Suspense>
          <Navbar />
          <main className="min-h-screen">
            {children}
          </main>
          <Footer />
          <MobileNavigation />
        </CartProvider>
      </body>
    </html>
  );
}
