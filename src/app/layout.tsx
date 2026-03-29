import type { Metadata } from "next";
import type { StorePublic } from "@/types/akkho";
import { Funnel_Sans, Space_Grotesk } from "next/font/google";
import { Suspense } from "react";
import "./globals.css";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { serverStoreApi } from "@/lib/api-server";
import { CartProvider } from "@/contexts/CartContext";
import { MobileNavigation } from "@/components/MobileNavigation";
import { LoadingScreen } from "@/components/LoadingScreen";
import { MetaPixel } from "@/components/MetaPixel";
import { PixelPageViewTracker } from "@/components/PixelPageViewTracker";
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
  let storePublic: StorePublic | null = null;
  try {
    storePublic = await serverStoreApi.getPublic();
  } catch {
    // Missing key / API down: footer omits contact rows from dashboard
  }

  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${funnelSans.variable} ${spaceGrotesk.variable} antialiased`}
        suppressHydrationWarning
      >
        <MetaPixel />
        <PixelPageViewTracker />
        <CartProvider>
          <Suspense fallback={null}>
            <LoadingScreen />
          </Suspense>
          <Navbar />
          <main className="min-h-screen">
            {children}
          </main>
          <Footer storePublic={storePublic} />
          <MobileNavigation />
        </CartProvider>
      </body>
    </html>
  );
}
