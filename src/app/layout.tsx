import type { Metadata } from "next";
import { Poppins, Chenla, Noto_Sans_TC } from "next/font/google";
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

const notoTc = Noto_Sans_TC({
  weight: ["400", "500", "700"],
  variable: "--font-noto-tc",
  preload: false,
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
    <html lang="en" suppressHydrationWarning>
      <body className={`${poppins.variable} ${chenla.variable} ${notoTc.variable} antialiased`} suppressHydrationWarning>
        <LanguageProvider>
          <CartProvider>
            {children}
          </CartProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}