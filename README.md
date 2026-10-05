<div align="center">

# 🐺 PackAI (`.packai`)
### Standards-First Bundle, Pre-Flight Provisioning & Cross-Client Distribution Layer

[![License: MIT](https://img.shields.io/badge/License-MIT-emerald.svg)](https://opensource.org/licenses/MIT)
[![Node Version](https://img.shields.io/badge/node-%3E%3D18.0.0-cyan.svg)](https://nodejs.org)
[![Next.js](https://img.shields.io/badge/Next.js-16.3-purple.svg)](https://nextjs.org)
[![Status](https://img.shields.io/badge/Status-Active%20Development-amber.svg)](#)

**A standards-first bundle, pre-flight provisioning engine, and cross-client distribution layer for AI agent systems.**  
*Packages Linux Foundation `AGENTS.md`, Anthropic `MCP`, and `SKILL.md` into turnkey verified bundles.*

[Quick Start](#-quick-start) • [The 1Password Model](#-the-1password-model) • [Dual-Layer Invariance](#-dual-layer-invariance-white-box-vs-black-box) • [Format Spec](#-format-specification) • [Monorepo Structure](#-repository-structure)

---

</div>

## ⚡ The Core Problem & Solution

### The Friction
Today, personal and professional AI configurations are tribal, manual, and fragile:
- Engineers spend weeks setting up multi-agent architectures (routers, specialist personas, auditors, MCP tools, and skills).
- Sharing this setup means copying and pasting 500 lines of `.cursorrules`, `CLAUDE.md`, or messy Python scripts across disparate tools.
- When an agent requires specific runtimes, binaries, or services, 95% of users fail at dependency setup.
- Bespoke swarms (CrewAI, LangGraph, AutoGen, custom Python) cannot be easily bundled and shared with guaranteed runtime execution.

### The Solution: Verified Cross-Client Bundles
```bash
npx packai apply @security/hermes-redteam-sandbox
```
**PackAI turns weeks of setup into a single verified turnkey command.**  
It automatically audits host OS requirements, verifies binaries and package managers (`brew`, `apt`, `npm`, `pip`, `uv`), securely resolves API keys into the OS Keychain, and injects clean, atomic configurations directly into Claude Code (`.claude/`), Cursor (`.cursor/`), Windsurf, Roo-Code, Copilot, and Zed.

---

## 🏛️ The 1Password Model (Standards-First Architecture)

We explicitly **do NOT** invent another redundant format or build another chat interface. We live on top of established open standards:

```
┌────────────────────────────────────────────────────────────────────────┐
│                          PACKAI BUNDLE                                 │
│      AGENTS.md (AAIF) + skills/ (Skills) + mcp.json (MCP)              │
│      + packai.yaml (Requirements, Secrets, Workflow & Execution)       │
│      + knowledge/ (Physical Context Bank)                              │
└──────────────┬──────────────────────────┬──────────────────────────────┘
               │                          │
      (Atomic Provisioning)      (Atomic Provisioning)
               ▼                          ▼
   ┌───────────────────────┐  ┌───────────────────────┐
   │      Claude Code      │  │     Cursor / IDE      │
   │  .claude/agents/*.md  │  │   .cursor/rules/*.mdc │
   │  CLAUDE.md            │  │   .cursor/mcp.json    │
   │  settings.json        │  │   .cursorrules        │
   │  skills/              │  │   AGENTS.md           │
   │  .packai/knowledge/   │  │   .roomodes (Roo)     │
   └───────────────────────┘  └───────────────────────┘
```

* **Living Above the Platforms:** We configure execution runtimes rather than competing with them.
* **Standards-First:** Native `AGENTS.md` and `SKILL.md` are packaged as-is.
* **Verified Installation:** Pre-flight audit guarantees "this pack will run on your machine".
* **No Platform Lock-in:** Move from Cursor to Claude, Windsurf, or Copilot in seconds without losing your agent workforce.

---

## 🧬 Dual-Layer Invariance (White-Box vs. Black-Box)

PackAI encapsulates any agent architecture regardless of framework complexity:

### 1. White-Box Layer (IDE & Agent Mesh)
For client-side prompt and tool-augmented agents (Claude Code, Cursor, Copilot, Windsurf, Roo-Code):
- Reverse engineers and injects rules, multi-agent subagent personas (`.claude/agents/`, `.cursor/rules/`), MCP tools, and skills (`skills/<name>/SKILL.md`).
- Large knowledge assets are physically delivered into `.packai/knowledge/` to prevent token bloat.

### 2. Black-Box Layer (Universal Execution Runtime)
For code-based autonomous swarms (CrewAI, LangGraph, AutoGen, custom Python/Node/Rust pipelines):
- Defined via `execution` in `packai.yaml`:
  ```yaml
  execution:
    command: python3 main.py
    entrypoint: main.py
    env:
      PYTHONUNBUFFERED: "1"
  ```
- PackAI checks dependencies, injects secrets directly from the OS Keychain into the process environment, and launches the swarm via:
  ```bash
  packai run ./my-pack
  ```

---

## 📦 The 3-Tier Pack Pyramid

```
my-pack.packai (ZIP Bundle)
├── AGENTS.md                 # Standard (Linux Foundation AAIF): Rules & personas
├── skills/<name>/SKILL.md    # Standard (Agent Skills): Reusable capabilities
├── mcp.json                  # Standard (Anthropic/AAIF): MCP server definitions
├── knowledge/                # Physical context documents & references
└── packai.yaml               # PackAI Manifest: Requirements, Workflow, Execution & Secrets
```

| Level | Name | Package Composition | Typical Use Case |
| :--- | :--- | :--- | :--- |
| **Level 1** | **Simple** | `AGENTS.md` (Persona + Directives) | Language style guides, coding conventions |
| **Level 2** | **Enhanced** | `AGENTS.md` + `skills/` + `mcp.json` + `packai.yaml` (Secrets/Binaries) | Tax advisor with legal PDF docs, Shopify automation bot |
| **Level 3** | **System** | **`AGENTS.md` + `skills/` + `mcp.json` + `packai.yaml` (Workflow + Sandbox + Execution)** | **Autonomous Security Red Team, 3-Agent Full-Stack Architect, Bespoke Swarms** |

---

## 🛠️ Quick Start

### 1. Installation
Run directly via `npx` or install globally:
```bash
npm install -g packai
```

### 2. Reverse Engineer from Existing Project
Turn your current workspace (`.claude/`, `.cursor/`, `AGENTS.md`, `mcp.json`, CrewAI `config/agents.yaml`, Roo `.roomodes`, `skills/`) into a shareable PackAI bundle:
```bash
packai init --from-existing
```

### 3. Scaffold a New Pack Skeleton
```bash
# Initialize a Level 3 Multi-Agent System
packai init my-security-team --level system --category security
```

### 4. Inspect Pack Dossier
```bash
packai info ./my-security-team
# Or directly inspect an archive:
packai info my-security-team.packai
```

### 5. Validate Format & Semantic Logic
```bash
packai validate ./my-security-team
```

### 6. Preview Changes Non-Destructively
```bash
packai diff ./my-security-team --cwd ./my-project
```

### 7. Turnkey Provisioning (Pre-Flight & Injection)
```bash
# Interactive secret prompt + auto-install dependencies
packai apply my-security-team.packai --cwd ./my-project -i --auto-install
```

### 8. Run Autonomous Swarms
Execute black-box swarms and custom codebases with securely injected secrets:
```bash
packai run ./my-security-team
```

### 9. Export IDE Plugin Manifests
Generate official plugin manifests for Claude Code, Cursor, and OpenAI Codex:
```bash
# Generate official plugin manifests for all major IDE stores
packai export ./my-security-team --target plugins
```

### 10. Safely Remove / De-Provision
```bash
packai clean ./my-security-team --cwd ./my-project
```

### 11. Compile into `.packai` Container
```bash
packai pack ./my-security-team
# Output: my-security-team-1.0.0.packai (ZIP container)
```

---

## 🛡️ Pre-Flight Engine & Zero-Friction Setup

When executing `packai apply`, the pre-flight daemon handles host prerequisites automatically:

```
$ packai apply @sec/hermes-sandbox

◇  PackAI Pre-Flight System Audit
│
▲  [1/3] Host OS: macOS Sonoma (arm64) detected
│  └─ Checking Python & uv: Missing uv. Triggering: "brew install uv"... [OK ✓]
│
▲  [2/3] Checking Container Daemon (Docker):
│  └─ Docker daemon running... [OK ✓]
│
◆  [3/3] Credentials & Secrets:
│  └─ ANTHROPIC_API_KEY required.
│  └─ Prompting with live API verification: [AUTHENTICATED ✓]
│  └─ Encrypted into macOS Keychain.
│
└  Atomic injection complete. Ajan workforce is ready in .claude/agents! 🐺
```

---

## 📂 Repository Structure

This monorepo contains the complete PackAI ecosystem:

```
aipack/
├── cli/                 # The Node.js command-line interface & compiler
│   ├── bin/             # CLI binary entry point (`packai`)
│   ├── src/commands/    # init, validate, export, pack, unpack, apply, clean, diff, info, run
│   ├── src/exporters/   # Transpilers for Cursor, Claude, ChatGPT, Plugins (Claude, Cursor, Codex)
│   ├── src/schema/      # Draft-07 JSON Schema validation
│   └── test/            # Comprehensive integration and battle verification test suites
│
├── marketplace/         # Next.js 16 Web Marketplace & Portal
│   ├── src/app/         # App Router: landing (/), browse (/browse), pack (/pack/[name])
│   ├── supabase/        # Production PostgreSQL schema, triggers & RLS policies
│   └── src/lib/         # Client SDKs, search & filters
│
└── docs/                # Comprehensive technical documentation
    ├── FORMAT_SPEC.md            # Format Specification v2.0 (PackAI Standards)
    ├── ARCHITECTURE_DECISIONS.md # Core architectural commitments & battle decisions
    └── MASTER_STRATEGY.md        # Complete operational handbook & strategy
```

---

## 🔒 IP Protection & Anti-Piracy Doctrine

PackAI employs a dual-layer defense against unauthorized redistribution:
1. **Zero-Width Unicode Traitor Tracing:** Every downloaded pack is deterministically watermarked with invisible binary markers (`U+200B`/`U+200C`) encoding the buyer's ID. Leakers can be forensically identified in seconds.
2. **Registry Live Updates (Bitrot Defense):** Modern LLM context windows and client configs update rapidly. A static leaked `.packai` rots quickly; users buy access to the continuous, live registry stream.

---

## 📜 License

PackAI format and CLI are open-source under the **MIT License**.  
Marketplace and hosted proxy services are proprietary.

---

<div align="center">
<b>"Chatbot yapanlar OpenAI'ın merhametine kalır. Platformların üstüne mimari kurup yolu tutanlar imparatorluk inşa eder."</b><br>
<sub>TÜRK MİLLETİ VAR OLSUN. 🐺</sub>
</div>