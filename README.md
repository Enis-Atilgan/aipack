<div align="center">

# 🐺 AIPACK (`.aipack`)
### Standards-First Bundle, Pre-Flight Provisioning & Cross-Client Distribution Layer

[![License: MIT](https://img.shields.io/badge/License-MIT-emerald.svg)](https://opensource.org/licenses/MIT)
[![Node Version](https://img.shields.io/badge/node-%3E%3D18.0.0-cyan.svg)](https://nodejs.org)
[![Next.js](https://img.shields.io/badge/Next.js-16.3-purple.svg)](https://nextjs.org)
[![Status](https://img.shields.io/badge/Status-Active%20Development-amber.svg)](#)

**A standards-first bundle, pre-flight provisioning engine, and cross-client distribution layer for AI agent systems.**  
*Packages Linux Foundation `AGENTS.md`, Anthropic `MCP`, and `SKILL.md` into turnkey verified bundles.*

[Quick Start](#-quick-start) • [The 1Password Model](#-the-1password-model) • [Architecture](#-architecture) • [Format Spec](#-format-specification) • [Monorepo Structure](#-repository-structure)

---

</div>

## ⚡ The Core Problem & Solution

### The Friction
Today, personal and professional AI configurations are tribal, manual, and fragile:
- Engineers spend weeks setting up multi-agent architectures (routers, specialist personas, auditors, MCP tools, and skills).
- Sharing this setup means copying and pasting 500 lines of `.cursorrules`, `CLAUDE.md`, or messy Python scripts across disparate tools.
- When an agent requires specific runtimes, binaries, or services, 95% of users fail at dependency setup.

### The Solution: Verified Cross-Client Bundles
```bash
npx aipack apply @security/hermes-redteam-sandbox
```
**AIPack turns weeks of setup into a verified turnkey command.**  
It automatically audits host OS requirements, verifies binaries and package managers (`brew`, `apt`, `npm`, `pip`, `uv`), securely resolves API keys into the OS Keychain, and injects clean, atomic configurations directly into Claude Code (`.claude/`), Cursor (`.cursor/`), Windsurf, Roo-Code, Copilot, and Zed.

---

## 🏛️ The 1Password Model (Standards-First Architecture)

We explicitly **do NOT** invent another redundant format or build another chat interface. We live on top of established open standards:

```
┌────────────────────────────────────────────────────────┐
│                   AIPACK BUNDLE                        │
│   AGENTS.md (AAIF) + skills/ (Skills) + mcp.json (MCP) │
│       + aipack.yaml (Requirements, Secrets & Routing)  │
└──────────────┬──────────────────────────┬──────────────┘
               │                          │
      (Atomic Provisioning)      (Atomic Provisioning)
               ▼                          ▼
   ┌───────────────────────┐  ┌───────────────────────┐
   │      Claude Code      │  │     Cursor / IDE      │
   │  .claude/agents/*.md  │  │   .cursor/rules/*.mdc │
   │  CLAUDE.md            │  │   .cursor/mcp.json    │
   │  settings.json        │  │   .cursorrules        │
   └───────────────────────┘  └───────────────────────┘
```

* **Living Above the Platforms:** We configure execution runtimes rather than competing with them.
* **Standards-First:** Native `AGENTS.md` and `SKILL.md` are packaged as-is.
* **Verified Installation:** Pre-flight audit guarantees "this pack will run on your machine".
* **No Platform Lock-in:** Move from Cursor to Claude, Windsurf, or Copilot in seconds without losing your agent workforce.

---

## 📦 The 3-Tier Pack Pyramid

```
my-pack.aipack (ZIP Bundle)
├── AGENTS.md                 # Standard (Linux Foundation AAIF): Rules & personas
├── skills/<name>/SKILL.md    # Standard (Agent Skills): Reusable capabilities
├── mcp.json                  # Standard (Anthropic/AAIF): MCP server definitions
└── aipack.yaml               # AIPack Layer: Requirements, Level 3 workflow & sandbox label
```

| Level | Name | Package Composition | Typical Use Case |
| :--- | :--- | :--- | :--- |
| **Level 1** | **Simple** | `AGENTS.md` (Persona + Directives) | Language style guides, coding conventions |
| **Level 2** | **Enhanced** | `AGENTS.md` + `skills/` + `mcp.json` + `aipack.yaml` (Secrets/Binaries) | Tax advisor with legal PDF docs, Shopify automation bot |
| **Level 3** | **System** | **`AGENTS.md` + `skills/` + `mcp.json` + `aipack.yaml` (Multi-Agent Mesh + Workflow + Sandbox)** | **Autonomous Security Red Team, 3-Agent Full-Stack Architect** |

---

## 🛠️ Quick Start

### 1. Installation
Run directly via `npx` or install globally:
```bash
npm install -g aipack
```

### 2. Create from Existing Project (Supply Generator)
Turn your current project setup (`.claude/`, `.cursor/rules/`, `AGENTS.md`, `mcp.json`) into a shareable bundle with auto-detected requirements:
```bash
aipack init --from-existing
```

### 3. Or Scaffold a New Pack Skeleton
```bash
# Initialize a Level 3 Multi-Agent System
aipack init my-security-team --level system --category security
```

### 3. Inspect Pack Dossier
```bash
aipack info ./my-security-team
# Or directly inspect an archive:
aipack info my-security-team.aipack
```

### 4. Validate Format & Semantic Logic
```bash
aipack validate ./my-security-team
```

### 5. Preview Changes Non-Destructively
```bash
aipack diff ./my-security-team --cwd ./my-project
```

### 6. Turnkey Provisioning (Pre-Flight & Injection)
```bash
# Interactive secret prompt + auto-install dependencies
aipack apply my-security-team.aipack --cwd ./my-project -i --auto-install
```

### 7. Safely Remove / De-Provision
```bash
aipack clean ./my-security-team --cwd ./my-project
```

### 8. Compile into `.aipack` Container
```bash
aipack pack ./my-security-team
# Output: my-security-team-1.0.0.aipack (ZIP container)
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