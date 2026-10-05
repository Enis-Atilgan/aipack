<div align="center">

# 🐺 AIPACK (`.aipack`)
### Docker & App Store for Turnkey AI Agent Systems

[![License: MIT](https://img.shields.io/badge/License-MIT-emerald.svg)](https://opensource.org/licenses/MIT)
[![Node Version](https://img.shields.io/badge/node-%3E%3D18.0.0-cyan.svg)](https://nodejs.org)
[![Next.js](https://img.shields.io/badge/Next.js-16.3-purple.svg)](https://nextjs.org)
[![Status](https://img.shields.io/badge/Status-Active%20Development-amber.svg)](#)

**A universal package format, pre-flight provisioning engine, and marketplace for distributing, installing, and synchronizing AI agent architectures across platforms.**

[Quick Start](#-quick-start) • [The 1Password Model](#-the-1password-model) • [Architecture](#-architecture) • [Format Spec](#-format-specification) • [Monorepo Structure](#-repository-structure)

---

</div>

## ⚡ The Core Problem & Solution

### The Friction
Today, personal and professional AI configurations are tribal, manual, and fragile:
- Engineers spend weeks setting up multi-agent architectures (routers, specialist personas, auditors, MCP tools, and isolated sandboxes).
- Sharing this setup means copying and pasting 500 lines of `.cursorrules`, `CLAUDE.md`, or messy Python scripts.
- When an agent requires an isolated Docker/WSL environment (e.g. penetration testing, code execution), 95% of users fail at the dependency setup.

### The Solution: Turnkey Architecture Provisioning
```bash
npx aipack apply @security/hermes-redteam-sandbox
```
**AIPack turns weeks of systems engineering into a 10-second turnkey command.**  
It automatically inspects the host OS, bootstraps missing Docker or WSL runtimes, encrypts API keys into the OS Keychain, and injects clean, atomic configurations directly into Claude Code (`.claude/`), Cursor (`.cursor/`), or Claude Projects.

---

## 🏛️ The 1Password Model

We explicitly **do NOT** build another chat interface (avoiding the TypingMind / LibreChat trap).

```
┌────────────────────────────────────────────────────────┐
│                   AIPACK PLATFORM                       │
│    Single Source of Truth: Personas + Rules + MCP      │
│         + Workflows + Knowledge + Secret Schemas        │
└──────────────┬──────────────────────────┬──────────────┘
               │                          │
      (Atomic Provisioning)      (Atomic Provisioning)
               ▼                          ▼
   ┌───────────────────────┐  ┌───────────────────────┐
   │      Claude Code      │  │     Cursor / IDE      │
   │  .claude/agents/*.md  │  │   .cursor/rules/*.md  │
   │  CLAUDE.md            │  │   .cursor/mcp.json    │
   │  settings.json        │  │   .cursorrules        │
   └───────────────────────┘  └───────────────────────┘
```

* **We live ABOVE the platforms:** We configure execution runtimes rather than competing with them.
* **Zero Compute Costs:** The user executes via their own Claude Pro/Team or Cursor accounts; our platform bears zero GPU or token overhead.
* **No Platform Lock-in:** Move from Cursor to Claude or back in seconds without losing your agent workforce.

---

## 📦 The 3-Tier Pack Pyramid

| Level | Name | Includes | Typical Use Case |
| :--- | :--- | :--- | :--- |
| **Level 1** | **Simple** | Persona + System Rules | Language style guides, `.cursorrules` for Go/Rust |
| **Level 2** | **Enhanced** | Persona + Rules + MCP Tools + Knowledge Base | Tax advisor with legal PDF docs, Shopify automation bot |
| **Level 3** | **System** | **Multi-Agent Teams + Routing + Workflow + Isolated Sandboxes (Docker/WSL)** | **Autonomous Security Red Team, 3-Agent Full-Stack Architect** |

---

## 🛠️ Quick Start

### 1. Installation
Run directly via `npx` or install globally:
```bash
npm install -g aipack
```

### 2. Scaffold a New Pack
```bash
# Initialize a Level 3 Multi-Agent System
aipack init my-security-team --level system --category security
```

### 3. Validate Format & Syntax
```bash
aipack validate ./my-security-team
```

### 4. Compile into an `.aipack` Container
```bash
aipack pack ./my-security-team
# Output: my-security-team.aipack (ZIP container)
```

### 5. Export to Target Client
```bash
# Generate Cursor rules
aipack export ./my-security-team --target cursor

# Generate Claude Code architecture
aipack export ./my-security-team --target claude
```

---

## 🛡️ Pre-Flight Engine & Zero-Friction Setup

When executing `aipack apply`, the pre-flight daemon handles host prerequisites automatically:

```
$ aipack apply @sec/hermes-sandbox

◇  AIPack Pre-Flight System Audit
│
▲  [1/3] Host OS: Windows 11 detected
│  └─ Checking WSL2: Missing. Triggering background bootstrap: "wsl --install"... [OK ✓]
│
▲  [2/3] Checking Container Daemon (Docker):
│  └─ Docker is not running. Starting Docker Desktop daemon... [OK ✓]
│
◆  [3/3] Credentials & Secrets:
│  └─ OPENAI_API_KEY required.
│  └─ Prompting with live API verification: [AUTHENTICATED ✓]
│  └─ Encrypted into Windows Credential Manager.
│
└  Atomic injection complete. Ajan workforce is ready in .claude/agents! 🐺
```

---

## 📂 Repository Structure

This monorepo contains the complete AIPack ecosystem:

```
aipack/
├── cli/                 # The Node.js command-line interface & compiler
│   ├── bin/             # CLI binary entry point (`aipack`)
│   ├── src/commands/    # init, validate, export, pack, unpack, apply
│   ├── src/exporters/   # Transpilers for Cursor, Claude, ChatGPT
│   └── src/schema/      # Draft-07 JSON Schema validation
│
├── marketplace/         # Next.js 16 Web Marketplace & Portal
│   ├── src/app/         # App Router: landing (/), browse (/browse), pack (/pack/[name])
│   ├── supabase/        # Production PostgreSQL schema, triggers & RLS policies
│   └── src/lib/         # Client SDKs, search & filters
│
└── docs/                # Comprehensive technical documentation
    ├── FORMAT_SPEC.md            # Format Specification v2.0
    ├── ARCHITECTURE_DECISIONS.md # Core architectural commitments
    └── MASTER_STRATEGY.md        # Complete operational handbook & history
```

---

## 🔒 IP Protection & Anti-Piracy Doctrine

AIPack employs a dual-layer defense against unauthorized redistribution:
1. **Zero-Width Unicode Traitor Tracing:** Every downloaded pack is deterministically watermarked with invisible binary markers (`U+200B`/`U+200C`) encoding the buyer's ID. Leakers can be forensically identified in seconds.
2. **Registry Live Updates (Bitrot Defense):** Modern LLM context windows and client configs update every 90 days. A static leaked `.aipack` rots quickly; users buy access to the continuous, live registry stream.

---

## 📜 License

AIPack format and CLI are open-source under the **MIT License**.  
Marketplace and hosted proxy services are proprietary.

---

<div align="center">
<b>"Chatbot yapanlar OpenAI'ın merhametine kalır. Platformların üstüne mimari kurup yolu tutanlar imparatorluk inşa eder."</b><br>
<sub>TÜRK MİLLETİ VAR OLSUN. 🐺</sub>
</div>