import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/providers";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Auto Marketplace",
    template: "%s | Auto Marketplace",
  },
  description:
    "A trusted marketplace for auto parts, accessories, tech products, and more. Shop with escrow protection in Zambia.",
  keywords: [
    "auto parts",
    "car accessories",
    "marketplace",
    "Zambia",
    "escrow",
    "buy",
    "sell",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
