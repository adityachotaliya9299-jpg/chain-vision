import type { Metadata } from "next";
import { Space_Grotesk, Space_Mono } from "next/font/google";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-sans",
  weight: ["300", "400", "500", "600", "700"],
});

const spaceMono = Space_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  weight: ["400", "700"],
});

export const metadata: Metadata = {
  title: "ChainVision — Multichain Wallet Intelligence",
  description:
    "Real-time multichain wallet analytics powered by Dune SIM API. Explore balances, NFTs, DeFi positions, and AI-powered on-chain insights across 60+ EVM chains.",
  keywords: ["blockchain", "wallet", "analytics", "DeFi", "NFT", "multichain", "Dune SIM"],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${spaceGrotesk.variable} ${spaceMono.variable}`}>
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}