import type { Metadata } from "next";
import { Funnel_Sans, Space_Grotesk } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { CartProvider } from "@/contexts/CartContext";
import { CsrfInitializer } from "@/components/CsrfInitializer";
import { FloatingPhoneButton } from "@/components/FloatingPhoneButton";

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
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${funnelSans.variable} ${spaceGrotesk.variable} antialiased`}
      >
        <CsrfInitializer />
        <CartProvider>
          <Navbar />
          <main className="min-h-screen">
            {children}
          </main>
          <Footer />
          <FloatingPhoneButton />
        </CartProvider>
      </body>
    </html>
  );
}
