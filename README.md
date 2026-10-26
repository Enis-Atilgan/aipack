<div align="center">

# 🐺 PackAI

### The Package Manager & Cross-Client Distribution Layer for AI Agent Systems

[![CI](https://github.com/Enis-Atilgan/aipack/actions/workflows/ci.yml/badge.svg)](https://github.com/Enis-Atilgan/aipack/actions/workflows/ci.yml)
[![Tests](https://img.shields.io/badge/tests-41%20passing-emerald.svg)](#-verification--tests)
[![Node Version](https://img.shields.io/badge/node-%3E%3D18.0.0-cyan.svg)](https://nodejs.org)
[![License: MIT](https://img.shields.io/badge/License-MIT-purple.svg)](./LICENSE)
[![Standards: AAIF & MCP](https://img.shields.io/badge/standards-AAIF%20%7C%20MCP%20%7C%20SKILLS-amber.svg)](#-open-standards-architecture)

**Pack, verify, and provision complete AI agent workforces across any IDE in a single command.**  
*Native support for Linux Foundation `AGENTS.md`, Anthropic `MCP`, and `SKILL.md`.*

[Quick Start](#-quick-start) • [Supported Clients](#-supported-clients--target-matrix) • [Architecture](#-open-standards-architecture) • [Security & Audit](#-security-shield--audit) • [CLI Reference](#-cli-command-reference)

---

</div>

## ⚡ Why PackAI?

Sharing and deploying AI agent setups today is completely fragmented:

* **Tribal Configuration:** A production-grade setup requires coordinating project rules (`AGENTS.md`, `.cursorrules`), subagent personas (`.claude/agents/*.md`), tool definitions (`mcp.json`), and executable skills. Sharing it means manually copy-pasting hundreds of lines across disconnected dotfiles.
* **Brittle Runtime Setup:** When an agent relies on specific binaries (`uv`, `docker`, `python3`) or local services, team members fail at prerequisite installation.
* **Client Lock-In:** Moving from Cursor to Claude Code, Windsurf, or Copilot requires manually re-architecting your agent configurations from scratch.

### The PackAI Solution

PackAI bundles rules, multi-agent hierarchies, tools, and dependencies into verified `.packai` archives:

```bash
# 1. Reverse-engineer your existing setup into a standard bundle in 2 seconds:
packai init --from-existing

# 2. Compile into a verified, standalone container:
packai pack . --output my-team.packai

# 3. Provision atomically onto any target project or client:
packai apply my-team.packai --cwd /path/to/target-project
```

PackAI audits host requirements (OS, RAM, package managers, binaries), safely resolves credentials into the host Keychain, and injects native, atomic configuration files tailored to each target environment.

---

## 🎯 Supported Clients & Target Matrix

PackAI is client-agnostic. A single `.packai` bundle automatically translates into native configurations for your team's tools:

| Target Client | Native Configuration Injected | MCP Tools Wired | Subagent Isolation |
| :--- | :--- | :---: | :---: |
| **Claude Code** | `CLAUDE.md`, `.claude/agents/*.md`, `skills/` | `.mcp.json` + `settings.json` | ✅ Native subagents |
| **Cursor** | `.cursorrules`, `.cursor/rules/*.mdc` (glob-filtered) | `.cursor/mcp.json` | Emulated via `.mdc` |
| **Windsurf** | `.windsurfrules` | Cascade MCP config | Flattened rules |
| **Roo-Code / Cline** | `.roomodes` (custom modes) | `.roo/mcp.json` | ✅ Mode-isolated |
| **GitHub Copilot** | `.github/copilot-instructions.md` | Via VS Code workspace | Context rules |
| **OpenCode & Zed** | `AGENTS.md` (AAIF standard) | `opencode.json` | Universal spec |

---

## 🏛️ Open Standards Architecture

PackAI does not invent proprietary prompt formats. It sits directly on top of established open standards:

```text
my-pack.packai (ZIP Archive)
├── packai.yaml               # Manifest: metadata, requirements, workflow & secrets
├── AGENTS.md                 # Linux Foundation AAIF specification
├── mcp.json                  # Model Context Protocol tool configurations
├── skills/                   # Agent Skills specification (SKILL.md)
│   └── code-auditor/
│       └── SKILL.md
└── knowledge/                # Physical context documents & references
```

```
┌────────────────────────────────────────────────────────────────────────┐
│                          PACKAI BUNDLE                                 │
│      AGENTS.md (AAIF) + skills/ (Skills) + mcp.json (MCP)              │
│      + packai.yaml (Requirements, Secrets, Workflow)                   │
└──────────────┬──────────────────────────┬──────────────────────────────┘
               │                          │
      (Atomic Provisioning)      (Atomic Provisioning)
               ▼                          ▼
   ┌───────────────────────┐  ┌───────────────────────┐
   │      Claude Code      │  │        Cursor         │
   │  .claude/agents/*.md  │  │  .cursor/rules/*.mdc  │
   │  CLAUDE.md            │  │  .cursor/mcp.json     │
   │  .mcp.json            │  │  .cursorrules         │
   │  skills/              │  │  AGENTS.md            │
   └───────────────────────┘  └───────────────────────┘
```

* **Living Above the Platforms:** PackAI configures runtimes rather than competing with them.
* **Atomic De-Provisioning:** PackAI records every injected file in `.packai/lock.json`. Running `packai clean` removes provisioned files and prunes MCP servers cleanly without touching unrelated project code.

---

## 🛠️ Quick Start

### 1. Installation

Install globally via npm or run directly with `npx`:

```bash
npm install -g packai
```

### 2. Package an Existing Workspace

Turn your current developer setup (`.claude/`, `.cursor/`, `mcp.json`, `skills/`, `AGENTS.md`) into a shareable bundle:

```bash
packai init --from-existing
```

### 3. Validate Format & Semantic Logic

```bash
packai validate ./my-pack
```

### 4. Preview Changes Non-Destructively

Preview exact file additions, modifications, and client capability trade-offs before touching disk:

```bash
packai diff ./my-pack --cwd ./my-project
```

### 5. Provision Turnkey Workforce

```bash
# Apply with interactive credential prompts and automatic dependency resolution:
packai apply ./my-pack --cwd ./my-project -i --auto-install
```

### 6. Inspect Installed Packs

```bash
packai list --cwd ./my-project
```

### 7. Cleanly De-Provision

```bash
packai clean ./my-pack --cwd ./my-project
```

---

## 🛡️ Security Shield & Audit

Because AI agent packages interact with shell tools, local filesystems, and APIs, PackAI enforces defense-in-depth:

1. **Zip-Slip Protection:** Archives are extracted using path traversal validation (`safeExtractZip`). Any archive containing relative directory escapes (`../../`) is rejected immediately.
2. **Pre-Flight MCP Audit:** Analyzes MCP tool definitions for destructive shell commands, unverified remote scripts (`curl | bash`), and reverse shells before writing configs.
3. **Prompt Injection Guard:** Statically scans instructions for jailbreaks, DAN patterns, and instruction override delimiters.
4. **Credential Isolation:** API keys are never written to source control or pack archives. Secrets are securely stored in the host OS Keychain and injected into runtime environments as needed.
5. **Traitor-Tracing Watermark:** Distributed packages can be tagged with zero-width steganographic markers (`U+200B` / `U+200C`). Run `packai trace <file>` to extract source attribution from leaked documents.

---

## 📋 CLI Command Reference

| Command | Alias | Description |
| :--- | :--- | :--- |
| `packai init [name]` | — | Scaffold a new pack skeleton, or reverse-engineer with `--from-existing` |
| `packai validate [path]` | — | Validate manifest schema and companion files (`AGENTS.md`, `mcp.json`) |
| `packai diff [path]` | — | Visual preview of file changes and client capability notices |
| `packai apply [path]` | `install`, `i` | Provision agent system into target project (`--auto-install`, `-i`) |
| `packai clean [path]` | `uninstall` | Safely remove provisioned files and prune MCP servers using lockfile |
| `packai pack [path]` | — | Compile directory into a `.packai` ZIP container |
| `packai unpack <file>` | — | Extract `.packai` container into a target directory |
| `packai info [path]` | — | Display dossier, author metadata, requirements, and discovered agents |
| `packai list [path]` | `ls` | List all PackAI packs currently installed in the workspace |
| `packai export [path]` | — | Export official plugin manifests for Claude, Cursor, and Codex stores |
| `packai run [target]` | — | Launch standalone black-box swarms with Keychain credential injection |
| `packai trace [path]` | — | Forensically extract invisible zero-width leak tracking signatures |

---

## 🧪 Verification & Tests

PackAI maintains a rigorous integration test suite using Node.js native test runner:

```bash
# Run the complete test suite:
npm test
```

```text
✔ End-to-End Pack Lifecycle (Init -> Apply -> Clean) (263ms)
✔ PackAI Lockfile, List & GitHub Copilot Provisioning (146ms)
✔ PackAI Standards-First Engine & Ingestion (198ms)
✔ Universal Pre-Flight & System Audit Engine (261ms)
✔ PackAI Security Shield & Forensics (10ms)
✔ Manifest Validation & Semantic Checks (136ms)
ℹ tests 41
ℹ suites 10
ℹ pass 41
ℹ fail 0
```

---

## 📂 Monorepo Structure

```text
aipack/
├── cli/                 # The Node.js command-line interface & compiler engine
│   ├── bin/             # CLI binary entry point (`packai`)
│   ├── src/commands/    # init, validate, apply, clean, diff, pack, unpack, run, info, list, trace
│   ├── src/exporters/   # Transpilers for Claude, Cursor, Windsurf, Copilot, Roo, Plugins
│   ├── src/schema/      # Draft-07 JSON Schema validation
│   └── test/            # Integration & battle test suites
│
├── marketplace/         # Next.js 16 Web Portal & Registry Explorer
│   ├── src/app/         # App Router: landing, browse, pack details
│   └── supabase/        # Database schema, triggers & RLS policies
│
└── docs/                # Specifications and architectural decision records
    ├── FORMAT_SPEC.md
    └── ARCHITECTURE_DECISIONS.md
```

---

## 📜 License

PackAI format and CLI are open-source software licensed under the **[MIT License](./LICENSE)**.

<div align="center">
<sub>"Platformların üstüne mimari kurup yolu tutanlar standartları belirler."</sub><br>
<sub>TÜRK MİLLETİ VAR OLSUN. 🐺</sub>
</div>