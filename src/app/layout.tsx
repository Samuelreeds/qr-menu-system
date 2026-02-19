import type { Metadata } from "next";
import { Poppins, Chenla, Noto_Sans_TC } from "next/font/google"; // 1. Added Noto_Sans_TC
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

// 2. Configure Noto Sans TC
const notoTc = Noto_Sans_TC({
  weight: ["400", "500", "700"],
  variable: "--font-noto-tc",
  preload: false, // Required for large Chinese fonts in Next.js
});

export const metadata: Metadata = {
  title: 'Menu',
  description: 'QR Menu System',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      {/* 3. Add the new variable to the className */}
      <body className={`${poppins.variable} ${chenla.variable} ${notoTc.variable} antialiased`}>
        <LanguageProvider>
          <CartProvider>
            {children}
          </CartProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}