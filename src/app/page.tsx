"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const [address, setAddress] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSearch = () => {
    const trimmed = address.trim();
    if (!trimmed) return;
    setIsLoading(true);
    router.push(`/wallet/${trimmed}`);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSearch();
  };

  const DEMO_WALLETS = [
    { label: "Vitalik", address: "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045" },
    { label: "Binance Hot Wallet", address: "0xBE0eB53F46cd790Cd13851d5EFf43D12404d33E8" },
    { label: "Uniswap Foundation", address: "0x1a9C8182C09F50C8318d769245beA52c32BE35BC" },
  ];

  return (
    <main className="min-h-screen bg-[#080A0F] text-white overflow-hidden relative">
      {/* Grid background */}
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            "linear-gradient(#00E5FF 1px, transparent 1px), linear-gradient(90deg, #00E5FF 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />

      {/* Glow blobs */}
      <div className="absolute top-[-200px] left-[-200px] w-[600px] h-[600px] rounded-full bg-[#00E5FF] opacity-[0.06] blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-200px] right-[-100px] w-[500px] h-[500px] rounded-full bg-[#7B2FFF] opacity-[0.07] blur-[120px] pointer-events-none" />

      {/* Navbar */}
      <nav className="relative z-10 flex items-center justify-between px-8 py-6 border-b border-white/5">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-[#00E5FF] flex items-center justify-center">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <circle cx="9" cy="9" r="4" fill="#080A0F" />
              <circle cx="9" cy="9" r="8" stroke="#080A0F" strokeWidth="2" />
              <path d="M9 1v2M9 15v2M1 9h2M15 9h2" stroke="#080A0F" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </div>
          <span className="font-bold text-lg tracking-tight text-white">
            Chain<span className="text-[#00E5FF]">Vision</span>
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-white/40 font-mono">Powered by</span>
          <span className="text-xs font-bold text-white/70 border border-white/10 rounded-full px-3 py-1">
            Dune SIM API
          </span>
        </div>
      </nav>

      {/* Hero */}
      <div className="relative z-10 flex flex-col items-center justify-center px-4 pt-24 pb-16">
        {/* Badge */}
        <div className="mb-6 flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-4 py-1.5">
          <span className="w-2 h-2 rounded-full bg-[#00E5FF] animate-pulse" />
          <span className="text-xs text-white/60 font-mono">Real-time · 60+ EVM Chains · AI-Powered</span>
        </div>

        {/* Title */}
        <h1 className="text-center text-5xl sm:text-7xl font-black leading-none tracking-tight mb-4">
          <span className="block text-white">See Every</span>
          <span
            className="block"
            style={{
              background: "linear-gradient(135deg, #00E5FF 0%, #7B2FFF 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            Chain. Every Move.
          </span>
        </h1>

        <p className="text-center text-white/50 text-base sm:text-lg max-w-lg mb-12 leading-relaxed">
          Paste any wallet address and get instant multichain intelligence — balances, NFTs, DeFi positions, activity history, and an AI-generated on-chain story.
        </p>

        {/* Search bar */}
        <div className="w-full max-w-2xl">
          <div className="relative flex items-center gap-0 bg-white/5 border border-white/10 rounded-2xl p-2 focus-within:border-[#00E5FF]/50 transition-all duration-300">
            <div className="pl-3 pr-2 flex-shrink-0">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="text-white/30">
                <circle cx="9" cy="9" r="6" stroke="currentColor" strokeWidth="1.5" />
                <path d="M13.5 13.5L17 17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </div>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="0x... or ENS name"
              className="flex-1 bg-transparent text-white placeholder-white/20 text-sm font-mono outline-none py-3 px-2"
            />
            <button
              onClick={handleSearch}
              disabled={!address.trim() || isLoading}
              className="flex-shrink-0 bg-[#00E5FF] text-[#080A0F] font-bold text-sm px-6 py-3 rounded-xl hover:bg-white transition-colors duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isLoading ? "..." : "Analyze →"}
            </button>
          </div>

          {/* Demo wallets */}
          <div className="flex items-center gap-3 mt-4 flex-wrap justify-center">
            <span className="text-xs text-white/30">Try:</span>
            {DEMO_WALLETS.map((w) => (
              <button
                key={w.address}
                onClick={() => setAddress(w.address)}
                className="text-xs text-[#00E5FF]/70 hover:text-[#00E5FF] transition-colors font-mono border border-white/10 rounded-full px-3 py-1 hover:border-[#00E5FF]/40"
              >
                {w.label}
              </button>
            ))}
          </div>
        </div>

        {/* Feature cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-20 w-full max-w-3xl">
          {[
            { icon: "💰", title: "Token Balances", desc: "All ERC-20s + native assets with USD value" },
            { icon: "🖼️", title: "NFT Portfolio", desc: "Every ERC-721 & ERC-1155 collectible" },
            { icon: "⚡", title: "Live Activity", desc: "Swaps, transfers, approvals in real-time" },
            { icon: "🤖", title: "AI Insights", desc: "GPT-powered on-chain behavior summary" },
          ].map((f) => (
            <div
              key={f.title}
              className="bg-white/[0.03] border border-white/[0.07] rounded-2xl p-5 hover:border-[#00E5FF]/20 hover:bg-white/[0.05] transition-all duration-300 group"
            >
              <div className="text-2xl mb-3">{f.icon}</div>
              <div className="text-sm font-semibold text-white mb-1 group-hover:text-[#00E5FF] transition-colors">
                {f.title}
              </div>
              <div className="text-xs text-white/40 leading-relaxed">{f.desc}</div>
            </div>
          ))}
        </div>

        {/* Powered by section */}
        <div className="mt-16 flex items-center gap-6 opacity-30">
          <span className="text-xs uppercase tracking-widest text-white/50">Data by</span>
          <div className="h-px w-16 bg-white/20" />
          <span className="text-sm font-bold text-white">Dune SIM</span>
          <div className="h-px w-16 bg-white/20" />
          <span className="text-xs uppercase tracking-widest text-white/50">60+ Chains</span>
        </div>
      </div>
    </main>
  );
}