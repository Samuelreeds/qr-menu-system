import type { Metadata, Viewport } from "next";
import { Poppins, Chenla } from "next/font/google";
import "./globals.css";
import { CartProvider } from "@/context/CartContext";
import { LanguageProvider } from "@/context/LanguageContext";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-poppins",
});

const chenla = Chenla({
  subsets: ["khmer"],
  weight: ["400"],
  variable: "--font-chenla",
});

// Noto_Sans_TC removed from next/font/google to prevent Turbopack CJK crash

export const metadata: Metadata = {
  title: 'Menu',
  description: 'QR Menu System',
};

// ADDED: Viewport configuration to prevent mobile auto-zoom
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Load massive CJK font directly from Google CDN to bypass local build limits */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+TC:wght@400;500;700&display=swap" rel="stylesheet" />
      </head>
      <body 
        className={`${poppins.variable} ${chenla.variable} antialiased`} 
        style={{ '--font-noto-tc': '"Noto Sans TC", sans-serif' } as React.CSSProperties}
        suppressHydrationWarning
      >
        <LanguageProvider>
          <CartProvider>
            {children}
          </CartProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}