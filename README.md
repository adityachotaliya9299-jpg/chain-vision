<div align="center">

```
 ██████╗██╗  ██╗ █████╗ ██╗███╗   ██╗██╗   ██╗██╗███████╗██╗ ██████╗ ███╗   ██╗
██╔════╝██║  ██║██╔══██╗██║████╗  ██║██║   ██║██║██╔════╝██║██╔═══██╗████╗  ██║
██║     ███████║███████║██║██╔██╗ ██║██║   ██║██║███████╗██║██║   ██║██╔██╗ ██║
██║     ██╔══██║██╔══██║██║██║╚██╗██║╚██╗ ██╔╝██║╚════██║██║██║   ██║██║╚██╗██║
╚██████╗██║  ██║██║  ██║██║██║ ╚████║ ╚████╔╝ ██║███████║██║╚██████╔╝██║ ╚████║
 ╚═════╝╚═╝  ╚═╝╚═╝  ╚═╝╚═╝╚═╝  ╚═══╝  ╚═══╝  ╚═╝╚══════╝╚═╝ ╚═════╝ ╚═╝  ╚═══╝
```

# ⬡ ChainVision v2.0

### AI-Powered Multichain Wallet Intelligence Terminal

**Real-time blockchain data across 60+ EVM chains + Solana — with AI wallet scoring, live webhook streams, smart contract security scanning, and deep DeFi metrics.**

[![Live Demo](https://img.shields.io/badge/LIVE_DEMO-chainvision.vercel.app-00FF88?style=for-the-badge&labelColor=020502&color=00FF88)](https://chain-vision-mocha.vercel.app)
[![Dune SIM](https://img.shields.io/badge/DATA-Dune_SIM_API-00E5FF?style=for-the-badge&labelColor=020502)](https://sim.dune.com)
[![Next.js](https://img.shields.io/badge/Next.js-16-white?style=for-the-badge&labelColor=020502)](https://nextjs.org)
[![Groq LLaMA](https://img.shields.io/badge/AI-LLaMA_3.3_70B-A78BFA?style=for-the-badge&labelColor=020502)](https://groq.com)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?style=for-the-badge&labelColor=020502)](https://typescriptlang.org)
[![License](https://img.shields.io/badge/License-MIT-FFAA00?style=for-the-badge&labelColor=020502)](LICENSE)

---

```
CHAINVISION | MULTICHAIN_WALLET_INTELLIGENCE_TERMINAL     SIM_API: CONNECTED
══════════════════════════════════════════════════════════════════════════════

  SEE_EVERY█
  CHAIN.
  EVERY_MOVE.

  ROOT@CHAINVISION:~$ SCAN_WALLET
  ▶ [ 0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045        ] [ EXECUTE → ]

══════════════════════════════════════════════════════════════════════════════
```




---
## Demo Video
[Project Demo](https://www.loom.com/share/bd9b7c737a8e42c1b166ab8675ec116e)
</div>

---

## 📑 Table of Contents

- [Overview](#overview)
- [Key Features](#key-features)
- [Architecture](#architecture)
- [Dune SIM API Integration](#dune-sim-api-integration)
- [AI Intelligence Layer](#ai-intelligence-layer)
- [Security Scanner](#security-scanner)
- [Deep DeFi Metrics](#deep-defi-metrics)
- [Live Webhook Feed](#live-webhook-feed)
- [Wallet Comparison](#wallet-comparison)
- [Solana Support](#solana-support)
- [UI Design System](#ui-design-system)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [API Reference](#api-reference)
- [Deployment](#deployment)
- [Roadmap](#roadmap)
- [Built For](#built-for)

---

## Overview

ChainVision is a **Bloomberg Terminal-inspired wallet intelligence dashboard** built on top of [Dune SIM API](https://sim.dune.com) — the fastest real-time blockchain data API available, requiring zero indexer setup.

The core thesis is simple: **Dune SIM gives developers superpowers.** ChainVision proves it by wrapping SIM's data layer in a production-grade intelligence platform that rivals commercial tools like Debank and Zapper — while adding features they don't have: AI wallet scoring, live webhook streams, smart contract security scanning, and deep DeFi metrics.

### Why ChainVision?

| Problem | ChainVision Solution |
|---------|---------------------|
| Wallet data is fragmented across 60+ chains | Single dashboard via Dune SIM |
| Commercial tools are slow (own indexers) | SIM API: <100ms, no indexer needed |
| Raw data is hard to interpret | AI wallet scoring + narrative analysis |
| No real-time monitoring | SIM webhooks → live event feed |
| DeFi positions lack context | APY, health factors, IL risk |
| Smart contract risk is invisible | Security scan + allowance audit |

---

## Key Features

```
TOKENS          — ERC-20 + native assets, 60+ chains, live USD pricing
ACTIVITY        — Decoded on-chain events: swaps, transfers, approvals
NFTs            — ERC-721/1155 grid with images, metadata, collection info
TXN_HISTORY     — Full transaction log, method decoding, fail rate analysis
DEFI_POSITIONS  — Protocol positions with APY, health factor, IL risk
SECURITY_SCAN   — Smart contract allowance audit with risk classification
LIVE_FEED ◉     — Real-time SIM webhook stream via Server-Sent Events
AI_INSIGHTS ✦   — LLaMA 3.3-70B wallet score: whale, bot, risk, DeFi rating
COMPARE         — Side-by-side wallet comparison with delta metrics
SOLANA ◎        — Full SVM support: SPL tokens + transaction history
```

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                        CHAINVISION v2.0                             │
│                     Next.js 16 App Router                           │
└────────────────────────────┬────────────────────────────────────────┘
                             │
         ┌───────────────────┼───────────────────┐
         │                   │                   │
    ┌────▼────┐         ┌────▼────┐        ┌────▼────┐
    │  Pages  │         │   API   │         │Components│
    │         │         │ Routes  │         │         │
    │ /       │         │         │         │WalletScore│
    │ /wallet │         │/wallet  │         │LiveFeed  │
    │ /compare│         │/solana  │         │         │
    └────┬────┘         │/defi    │         └─────────┘
         │              │/ai-ins  │
         │              │/subscribe│
         │              │/webhook │
         │              │/live-feed│
         │              └────┬────┘
         │                   │
    ┌────▼───────────────────▼────────────────────────┐
    │                  DATA LAYER                      │
    │                                                  │
    │  ┌─────────────────┐    ┌──────────────────┐    │
    │  │  Dune SIM API   │    │   Groq API        │    │
    │  │                 │    │                   │    │
    │  │ EVM Endpoints:  │    │ LLaMA 3.3-70B    │    │
    │  │ • /balances     │    │                   │    │
    │  │ • /activity     │    │ Generates:        │    │
    │  │ • /collectibles │    │ • Wallet Score    │    │
    │  │ • /transactions │    │ • Risk Analysis   │    │
    │  │ • /defi/positions│   │ • Wallet Type     │    │
    │  │                 │    │ • Verdict         │    │
    │  │ SVM Endpoints:  │    └──────────────────┘    │
    │  │ • /svm/balances │                             │
    │  │ • /svm/txns     │                             │
    │  │                 │                             │
    │  │ Webhooks:       │                             │
    │  │ • POST /webhooks│                             │
    │  └─────────────────┘                             │
    └──────────────────────────────────────────────────┘
```

### Data Flow

```
User enters wallet address
         │
         ▼
Next.js page.tsx renders immediately (loading skeleton)
         │
         ▼
Client fetches → /api/wallet?type=balances (server-side proxy)
         │
         ▼
Server calls Dune SIM API (API key never exposed to browser)
         │
         ▼
SIM returns JSON → cached 30s via Next.js fetch cache
         │
         ▼
Client renders token list, stats header, tab content
         │
         ▼
Each tab lazily fetches its own data on first click
         │
         ▼
AI_INSIGHTS tab → /api/ai-insights → Groq LLaMA 3.3-70B
         │
         ▼
Structured JSON score + 6-section analysis rendered
```

### Real-Time Flow (Webhooks)

```
User clicks "START_LIVE_MONITOR"
         │
         ▼
POST /api/subscribe → creates 3 SIM webhook subscriptions
(transactions + activities + balances on ETH/Base/Polygon/Arbitrum/Optimism)
         │
         ▼
SIM sends POST events to /api/webhook-receiver
         │
         ▼
Events stored in-memory (Map<address, events[]>)
         │
         ▼
Browser polls GET /api/live-feed (SSE stream) every 2 seconds
         │
         ▼
New events pushed to client → rendered in live feed table
```

---

## Dune SIM API Integration

ChainVision uses **8 Dune SIM endpoints** spanning both EVM and SVM:

| Endpoint | Method | Tab | Description |
|----------|--------|-----|-------------|
| `/v1/evm/balances/{address}` | GET | TOKENS | Token portfolio with live USD values |
| `/v1/evm/activity/{address}` | GET | ACTIVITY | Decoded on-chain activity feed |
| `/v1/evm/collectibles/{address}` | GET | NFTs | NFT portfolio with metadata |
| `/v1/evm/transactions/{address}` | GET | TXN_HISTORY | Full transaction history |
| `/v1/evm/defi/positions/{address}` | GET | DEFI_POSITIONS | Protocol positions |
| `/beta/evm/subscriptions/webhooks` | POST | LIVE_FEED | Create real-time subscriptions |
| `/beta/svm/balances/{address}` | GET | SOL_TOKENS | Solana SPL token balances |
| `/beta/svm/transactions/{address}` | GET | SOL_HISTORY | Solana transaction history |

### Implementation Details

All SIM API calls are **proxied through Next.js API routes**, ensuring:
- API key is never exposed to the browser
- 30-second revalidation cache reduces API usage
- Consistent error handling across all endpoints
- Rate limiting protection

```typescript
// src/app/api/wallet/route.ts
const res = await fetch(
  `https://api.sim.dune.com/v1/evm/balances/${address}?limit=50`,
  {
    headers: { "X-Sim-Api-Key": process.env.SIM_API_KEY },
    next: { revalidate: 30 },
  }
);
```

---

## AI Intelligence Layer

The **AI_INSIGHTS ✦** tab is the flagship feature — it transforms raw SIM data into a structured intelligence report powered by **Groq's LLaMA 3.3-70B**.

### How It Works

1. Wallet data from SIM (balances, activity, NFTs, transactions) is aggregated
2. A structured prompt is sent to `/api/ai-insights`
3. LLaMA returns a JSON object with scores + analysis
4. UI renders animated SVG ring, score bars, flags, verdict, and collapsible sections

### Output Format

```
── WALLET_INTELLIGENCE_COMPLETE ── MODEL: LLAMA-3.3-70B ──────────────

         ╭──────────╮
         │    74    │    WALLET_CLASSIFICATION
         │  / 100   │    ┌─────────────┐
         ╰──────────╯    │    WHALE    │     ▲ STRONG PROFILE
                         └─────────────┘

VERDICT
"A sophisticated multi-chain operator with strong DeFi activity
 and minimal automated behavior patterns."

◆ MULTI_CHAIN  ◆ DEFI_ACTIVE  ◆ HIGH_VALUE  ◆ NFT_COLLECTOR

── INTELLIGENCE_SCORES ──────────────────────────────────────────────────

WHALE_PROBABILITY      high-value wallet likelihood          HIGH   82
▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓░░░░░░░░░

DEFI_SOPHISTICATION    DeFi protocol usage complexity         MED   61
▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓░░░░░░░░░░░░░░░░░

DIVERSIFICATION        cross-chain asset spread               MED   70
▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓░░░░░░░░░░░░░░

BOT_LIKELIHOOD         automated behavior probability         LOW   28
▓▓▓▓▓▓▓▓░░░░░░░░░░░░░░░░░░░░░░░░░░░░░

RISK_SCORE             risky asset exposure                   LOW   40
▓▓▓▓▓▓▓▓▓▓▓▓░░░░░░░░░░░░░░░░░░░░░░░░░

── DETAILED_ANALYSIS ─────────────────────────────────────────────────

[WALLET_PROFILE]     ▼ EXPAND
[CHAIN_BEHAVIOR]     ▼ EXPAND
[ASSET_STRATEGY]     ▼ EXPAND
[ACTIVITY_PATTERN]   ▼ EXPAND
[RISK_ASSESSMENT]    ▼ EXPAND
[KEY_FINDING]        ▼ EXPAND
```

### Score Dimensions

| Metric | Description | High = Good? |
|--------|-------------|--------------|
| `whale_probability` | Likelihood of being a high-value institutional wallet | ✅ Yes |
| `defi_sophistication` | Complexity and diversity of DeFi protocol usage | ✅ Yes |
| `diversification` | Asset spread across chains and token types | ✅ Yes |
| `bot_likelihood` | Probability of automated/scripted behavior | ❌ No |
| `risk_score` | Exposure to risky assets or suspicious patterns | ❌ No |

### Wallet Types

The AI classifies each wallet into one of 8 types:

```
WHALE         — Large holdings, minimal activity relative to size
DEFI_DEGEN    — Heavy DeFi protocol usage across multiple chains
NFT_COLLECTOR — NFT-heavy portfolio with collection focus
DORMANT       — Historically active but currently inactive
BOT           — High transaction frequency with automated patterns
RETAIL        — Standard individual user behavior
INSTITUTION   — Large, methodical movement patterns
DEVELOPER     — Contract deployments, testing patterns, multi-chain setup
```

---

## Security Scanner

The **SECURITY_SCAN** tab performs a smart contract allowance audit — identifying dangerous ERC-20 approvals that could put funds at risk.

### What It Checks

```
── SECURITY_SCAN_REPORT ── POWERED_BY_CHAINVISION ─────────────────────

TOKEN    SPENDER                    ALLOWANCE    RISK_LEVEL
──────────────────────────────────────────────────────────────────────
USDT     Uniswap V2 Router          INFINITE     ✕ CRITICAL
USDC     0x742d...9f1a (Unknown)    INFINITE     ✕ HIGH
WETH     Aave V3 Pool               INFINITE     ✓ LOW
DAI      Curve Finance              50,000       ✓ MEDIUM
SHIB     0x1337...dead (Unknown)    INFINITE     ✕ HIGH
```

### Risk Classification

| Level | Criteria |
|-------|----------|
| `CRITICAL` | Infinite allowance to unknown/unverified contract |
| `HIGH` | Infinite allowance to partially verified contract |
| `MEDIUM` | Large finite allowance (>10,000 tokens) |
| `LOW` | Allowance to known, audited protocol |

---

## Deep DeFi Metrics

The **DEFI_POSITIONS** tab goes beyond simple balance display to surface protocol-specific intelligence:

### Lending Protocols (Aave, Compound, Morpho)

```
PROTOCOL     CHAIN      TYPE       HEALTH_FACTOR   APY      VALUE
────────────────────────────────────────────────────────────────────
Aave V3      Ethereum   lending    2.4 ✓ SAFE       3.2%     $12,450
Compound     Polygon    lending    1.6 ⚠ WARN        4.8%     $3,200
Morpho       Base       lending    3.1 ✓ SAFE        5.1%     $8,900
```

**Health Factor Warnings:**
- `>2.0` — Safe ✓
- `1.2–2.0` — Warning ⚠ (approaching liquidation)
- `<1.2` — Danger ✕ (liquidation risk)

### Liquidity Positions (Uniswap, Curve, Balancer)

```
PROTOCOL     PAIR           IL_RISK     APY      VALUE
────────────────────────────────────────────────────────
Uniswap V3   ETH/USDC       LOW         18.4%    $24,100
Curve        3CRV Pool      MINIMAL     6.2%     $9,800
Balancer     ETH/wBTC/USDC  MEDIUM      12.1%    $5,400
```

**IL Risk Levels:**
- `MINIMAL` — Stablecoin pairs
- `LOW` — ETH/stablecoin pairs
- `MEDIUM` — ETH/BTC or correlated assets
- `HIGH` — Volatile/uncorrelated pairs

---

## Live Webhook Feed

The **LIVE_FEED ◉** tab creates a real-time Bloomberg-style event stream for any wallet using Dune SIM's webhook subscription API.

### Setup Flow

```
Click ▶ START_LIVE_MONITOR
         │
         ▼
POST /api/subscribe
{
  address: "0x...",
  chain_ids: [1, 8453, 137, 42161, 10],
  types: ["transactions", "activities", "balances"]
}
         │
         ▼
SIM creates 3 webhook subscriptions
Webhook URL: https://yourapp.vercel.app/api/webhook-receiver
         │
         ▼
Browser opens SSE connection → GET /api/live-feed?address=0x...
         │
         ▼
SIM events arrive → stored in memory → streamed to browser
```

### Live Feed Display

```
● STREAM_CONNECTED  │ WEBHOOK_ACTIVE: ETH · BASE · POLYGON · ARBITRUM · OPTIMISM

AGE    EVENT              DETAIL                              CHAIN      VALUE
──────────────────────────────────────────────────────────────────────────────
2m     ● + USDC received  Received from 0xf70d...ef22         ETHEREUM   $1,250
5m       ⇄ SWAP           ETH → PEPE on Uniswap V3            BASE       —
12m      ✦ MINT           NFT minted on 0x1234...abcd         ARBITRUM   —
18m      → TX_SENT        hash: 0xabc1...ef99 | status: OK    POLYGON    —
24m      ✓ APPROVE        USDC approved for Aave V3           OPTIMISM   —
```

> **Note:** Webhooks only work in production (Vercel). Demo mode with simulated events is shown on localhost.

---

## Wallet Comparison

The **COMPARE** page (`/compare`) allows side-by-side analysis of any two wallets.

```
ROOT@CHAINVISION:~$ COMPARE_WALLETS --a [WALLET_A] --b [WALLET_B]

┌─── WALLET_A ─────────────────────┬─── WALLET_B ─────────────────────┐
│ 0xd8dA...6045                     │ 0xBE0e...33E8                     │
│                                   │                                   │
│ TOTAL_VALUE     $2,450,000        │ TOTAL_VALUE     $180,000,000      │
│ TOKENS_HELD     32                │ TOKENS_HELD     18                │
│ CHAINS_ACTIVE   13                │ CHAINS_ACTIVE   9                 │
│ NFTs_OWNED      142               │ NFTs_OWNED      0                 │
│ RECENT_ACTIVITY 48 txns           │ RECENT_ACTIVITY 12 txns           │
│                                   │                                   │
│ CHAINS: ETH · BASE · ARBITRUM     │ CHAINS: ETH · BSC · POLYGON       │
│         ZORA · OPTIMISM...        │         ARBITRUM...               │
│                                   │                                   │
│ TOP: ETH($1.2M) USDC($400K)      │ TOP: BNB($85M) ETH($40M)         │
└───────────────────────────────────┴───────────────────────────────────┘

DELTA: VALUE: B+$177.5M  │  TOKENS: A+14  │  CHAINS: A+4  │  NFTs: A+142

                        [ ✦ AI_COMPARE ]
```

---

## Solana Support

ChainVision auto-detects Solana addresses (base58 format, 32-44 chars, no `0x` prefix) and routes to Dune SIM's SVM endpoints.

### Detection Logic

```typescript
function isSolanaAddress(addr: string): boolean {
  return !addr.startsWith("0x") &&
    /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(addr);
}
```

### Solana-Specific UI

- Purple `#9945FF` color scheme (Solana brand color)
- `◎ SOLANA` badge in navbar
- `SOL_TOKENS` and `SOL_HISTORY` tabs (replaces EVM tabs)
- Displays native SOL + all SPL tokens with USD values
- Compatible with LIVE_FEED and AI_INSIGHTS

### Test Addresses

```
GThUX1Atko4tqhN2NaiTazWSeFWMuiUvfFnyJyUghFMJ  — High activity wallet
9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM  — DeFi wallet
```

---

## UI Design System

ChainVision uses a hand-crafted **terminal aesthetic** with zero UI framework dependencies.

### Color Palette

```
Background:       #020502    — Deep terminal black
Primary Green:    #00FF88    — Neon accent, main text
Cyan:             #00E5FF    — Addresses, EVM data
Purple:           #A78BFA    — AI features
Solana Purple:    #9945FF    — Solana brand
Warning:          #FFAA00    — DeFi metrics, caution
Danger:           #FF4466    — Errors, high risk
Success:          #34D399    — Confirmations
Dim Text:         #4a7a4a    — Labels, secondary info
Very Dim:         #2a4a2a    — Timestamps, metadata
```

### Typography

```css
font-family: 'Courier New', Courier, monospace;
/* All text minimum 12px for readability */
/* Headers: 13-15px with letter-spacing 0.1-0.15em */
/* Data rows: 12-14px */
/* Labels: 11-12px, font-weight 600 */
```

### Animation System

```css
.page-enter     { animation: fadeIn 0.6s ease forwards; }
.slide-up       { animation: fadeUp 0.5s ease forwards; }
.slide-up-delay-1 through .slide-up-delay-5  /* staggered */
@keyframes shimmer  /* skeleton loading */
@keyframes pulse-dot  /* live indicator */
```

### Infinite Title Typing

The homepage title uses a custom infinite typing loop:

```
SEE_EVERY█        ← types at 52ms/char
CHAIN.█           ← starts after line 1
EVERY_MOVE.█      ← starts after line 2
                  ← pauses 3.5 seconds
EVERY_MOVE_       ← erases at 28ms/char
CHAIN_            ← erases line 2
SEE_EVERY_        ← erases line 1
                  ← restarts immediately
```

---

## Tech Stack

| Category | Technology | Version | Purpose |
|----------|-----------|---------|---------|
| Framework | Next.js | 16.x | App Router, API Routes, SSR |
| Language | TypeScript | 5.x | Type safety |
| Blockchain Data | Dune SIM API | v1 + beta | All on-chain data |
| AI Model | Groq (LLaMA 3.3-70B) | Latest | Wallet intelligence |
| Real-time | Server-Sent Events | Native | Live event streaming |
| Webhooks | Dune SIM Subscriptions | beta | Real-time monitoring |
| Styling | Inline CSS | — | Zero dependency terminal UI |
| Deploy | Vercel | — | Edge functions, global CDN |
| Fonts | Courier New | System | Monospace terminal aesthetic |

---

## Project Structure

```
chain-vision/
├── src/
│   ├── app/
│   │   ├── globals.css                 # Global styles, animations, text fixes
│   │   ├── layout.tsx                  # Root layout with Inter/Mono fonts
│   │   ├── page.tsx                    # Homepage (infinite typing, search)
│   │   │
│   │   ├── wallet/
│   │   │   └── [address]/
│   │   │       ├── page.tsx            # Main wallet dashboard (all 8 tabs)
│   │   │       └── loading.tsx         # Instant loading skeleton
│   │   │
│   │   ├── compare/
│   │   │   └── page.tsx                # Side-by-side wallet comparison
│   │   │
│   │   └── api/
│   │       ├── wallet/
│   │       │   └── route.ts            # EVM data proxy (balances/activity/nfts/txns)
│   │       ├── solana/
│   │       │   └── route.ts            # Solana SVM data proxy
│   │       ├── defi/
│   │       │   └── route.ts            # DeFi positions endpoint
│   │       ├── ai-insights/
│   │       │   └── route.ts            # Groq LLaMA scoring endpoint
│   │       ├── subscribe/
│   │       │   └── route.ts            # SIM webhook subscription creator
│   │       ├── webhook-receiver/
│   │       │   └── route.ts            # Incoming SIM webhook handler
│   │       └── live-feed/
│   │           └── route.ts            # SSE stream to browser
│   │
│   ├── components/
│   │   ├── WalletScore.tsx             # AI scoring UI (ring, bars, sections)
│   │   └── LiveFeed.tsx                # Real-time webhook event table
│   │
│   └── lib/
│       └── sim.ts                      # Dune SIM client + TypeScript types
│
├── .env.local                          # API keys (never committed)
├── next.config.ts                      # Next.js configuration
├── tailwind.config.ts                  # Tailwind config (content paths)
├── tsconfig.json                       # TypeScript config
└── README.md                           # This file
```

---

## Getting Started

### Prerequisites

- **Node.js** 18+ ([download](https://nodejs.org))
- **Dune SIM API key** — free tier at [sim.dune.com](https://sim.dune.com)
- **Groq API key** — free at [console.groq.com](https://console.groq.com) (500k tokens/day free)

### Installation

```bash
# Clone the repository
git clone https://github.com/adityachotaliya9299-jpg/chain-vision
cd chain-vision

# Install dependencies
npm install

# Create environment file
cp .env.example .env.local
# Add your API keys to .env.local
```

### Environment Variables

Create `.env.local` in the project root:

```env
# Dune SIM API — get free key at sim.dune.com
SIM_API_KEY=your_dune_sim_api_key_here

# Groq API — get free key at console.groq.com
GROQ_API_KEY=gsk_your_groq_api_key_here

# Your app URL (needed for webhook subscriptions)
NEXT_PUBLIC_APP_URL=https://your-project.vercel.app
```

> ⚠️ Never commit `.env.local` to git. It's already in `.gitignore`.

### Run Locally

```bash
npm run dev
# Open http://localhost:3000
```

### Build for Production

```bash
npm run build
npm start
```

---

## API Reference

All API routes are server-side proxies that keep API keys secure.

### `GET /api/wallet`

Fetches EVM wallet data from Dune SIM.

| Parameter | Type | Values |
|-----------|------|--------|
| `address` | string | EVM wallet address |
| `type` | string | `balances` \| `activity` \| `nfts` \| `transactions` |

```bash
curl "http://localhost:3000/api/wallet?address=0xd8dA...&type=balances"
```

### `GET /api/solana`

Fetches Solana wallet data from Dune SIM SVM endpoints.

| Parameter | Type | Values |
|-----------|------|--------|
| `address` | string | Solana wallet address (base58) |
| `type` | string | `balances` \| `transactions` |

### `GET /api/defi`

Fetches DeFi positions from Dune SIM.

| Parameter | Type | Description |
|-----------|------|-------------|
| `address` | string | EVM wallet address |

### `POST /api/ai-insights`

Generates AI wallet intelligence report.

```json
// Request body
{
  "walletData": {
    "address": "0x...",
    "totalUSD": "125000.00",
    "chains": ["ethereum", "base", "arbitrum"],
    "tokenCount": 32,
    "topTokens": "ETH($80000) USDC($20000)",
    "activityBreakdown": { "swap": 45, "receive": 12 },
    "nftCount": 8,
    "txCount": 20,
    "failRate": 5
  }
}

// Response
{
  "analysis": {
    "overall_score": 74,
    "scores": {
      "whale_probability": 82,
      "defi_sophistication": 61,
      "bot_likelihood": 28,
      "risk_score": 40,
      "diversification": 70
    },
    "wallet_type": "WHALE",
    "verdict": "A sophisticated multi-chain operator...",
    "sections": { "WALLET_PROFILE": "...", ... },
    "flags": ["MULTI_CHAIN", "DEFI_ACTIVE", "HIGH_VALUE"]
  }
}
```

### `POST /api/subscribe`

Creates SIM webhook subscriptions for real-time monitoring.

```json
// Request body
{ "address": "0x...", "appUrl": "https://yourapp.vercel.app" }

// Response
{
  "ok": true,
  "message": "Monitoring 0xd8dA... on ETH, Base, Polygon, Arbitrum, Optimism",
  "webhookUrl": "https://yourapp.vercel.app/api/webhook-receiver"
}
```

### `GET /api/live-feed`

Server-Sent Events stream for real-time wallet events.

```bash
# Connect to SSE stream
curl -N "http://localhost:3000/api/live-feed?address=0x..."
```

### `POST /api/webhook-receiver`

Receives incoming events from Dune SIM webhooks. Called by SIM automatically — not for manual use.

---

## Deployment

### Deploy to Vercel (Recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy (follow prompts)
vercel

# Add environment variables in Vercel Dashboard:
# Project → Settings → Environment Variables
# Add: SIM_API_KEY, GROQ_API_KEY, NEXT_PUBLIC_APP_URL

# Deploy to production
vercel --prod
```

### Post-Deploy Checklist

```
[ ] Visit your Vercel URL — homepage loads
[ ] Test with Vitalik: /wallet/0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045
[ ] Check TOKENS tab shows real data (not empty)
[ ] Test AI_INSIGHTS tab — score generates
[ ] Test LIVE_FEED — click START_LIVE_MONITOR
[ ] Test Solana: /wallet/GThUX1Atko4tqhN2NaiTazWSeFWMuiUvfFnyJyUghFMJ
[ ] Test /compare page
[ ] Verify NEXT_PUBLIC_APP_URL matches your Vercel URL
```

> **Webhook Note:** SIM webhooks require a public HTTPS URL. They will not work on localhost. Test the live feed on your Vercel deployment.

---

## Demo Wallets

| Wallet | Address | Best For |
|--------|---------|----------|
| Vitalik Buterin | `0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045` | Multi-chain, lots of tokens |
| Binance Hot Wallet | `0xBE0eB53F46cd790Cd13851d5EFf43D12404d33E8` | High transaction volume |
| Uniswap DAO | `0x1a9C8182C09F50C8318d769245beA52c32BE35BC` | DeFi positions |
| Solana DeFi | `GThUX1Atko4tqhN2NaiTazWSeFWMuiUvfFnyJyUghFMJ` | Solana SVM test |

---

## Roadmap

- [x] EVM wallet dashboard (tokens, activity, NFTs, transactions)
- [x] DeFi positions with APY + health factor + IL risk
- [x] Smart contract security scanner
- [x] AI wallet scoring (LLaMA 3.3-70B)
- [x] Live webhook feed (SIM subscriptions → SSE)
- [x] Solana SVM support
- [x] Wallet comparison
- [x] Infinite typing animation + slow-motion UI
- [ ] ENS name resolution
- [ ] Historical net worth chart (time series)
- [ ] Portfolio export to PDF
- [ ] Wallet "risk score" shareable badge
- [ ] Multi-wallet portfolio aggregation
- [ ] Push notifications (email/Telegram) on wallet events
- [ ] Copy trading signal detection

---

## Built For

This project was built for the **[Dune SIM × Frontier Hackathon](https://superteam.fun)** on Superteam Earn.

| Field | Details |
|-------|---------|
| Bounty | Incorporate Dune SIM data intelligence into a project |
| Prize | SIM Enterprise Plan ($6,000 USD value) |
| Track | Frontier Hackathon |
| Builder | Aditya Chotaliya |
| Academic | GATE CSE AIR 61 (2026), AIR 154 (2025) — Top 0.1% nationally |
| University | Marwadi University, CGPA 8.0 |
| Portfolio | [adityachotaliya.vercel.app](https://portfolio-one-bice-xqt0376aiu.vercel.app) |
| GitHub | [@adityachotaliya9299-jpg](https://github.com/adityachotaliya9299-jpg) |
| Live Demo | [Project Demo](https://www.loom.com/share/bd9b7c737a8e42c1b166ab8675ec116e) |

---

## License

MIT License — feel free to fork, extend, and build on top of ChainVision.

---

<div align="center">

```
── END_OF_README ── CHAINVISION_v2.0 ── DATA_BY_DUNE_SIM ──
```

**Built with ⬡ by Aditya Chotaliya**

*Data by [Dune SIM](https://sim.dune.com) · AI by [Groq](https://groq.com) · Deployed on [Vercel](https://vercel.com)*

</div>
