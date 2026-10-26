<div align="center">

# PackAI (`packai`)

**The Universal Package Manager & Cross-Client Distribution Layer for AI Agents**

[![CI](https://github.com/Enis-Atilgan/aipack/actions/workflows/ci.yml/badge.svg)](https://github.com/Enis-Atilgan/aipack/actions/workflows/ci.yml)
[![Test Suite](https://img.shields.io/badge/tests-41%20passing-10b981.svg?style=flat-square)](#-test-verification)
[![Node Runtime](https://img.shields.io/badge/node-%3E%3D18.0.0-06b6d4.svg?style=flat-square)](https://nodejs.org)
[![License](https://img.shields.io/badge/license-MIT-8b5cf6.svg?style=flat-square)](./LICENSE)
[![Specification](https://img.shields.io/badge/spec-AAIF%20%7C%20MCP%20%7C%20SKILLS-f59e0b.svg?style=flat-square)](#-open-standards-architecture)

<br>

```
  ┌────────────────────────────────────────────────────────────────────────┐
  │                           PACKAI BUNDLE                                │
  │    AGENTS.md (AAIF) + skills/ (Skills) + mcp.json (MCP Servers)        │
  │    + packai.yaml (Pre-flight, OS Requirements, Workflow & Secrets)     │
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

<br>

[The Problem](#-the-problem) • [How It Works](#-how-it-works) • [Quick Start](#-quick-start) • [Target Matrix](#-supported-targets) • [Security](#-security-shield) • [Comparison](#-comparison) • [CLI Reference](#-command-reference)

---

</div>

## 📌 The Problem

Modern AI setups have outgrown single-file prompt templates:

1. **Fragmented Configs:** A production-grade multi-agent setup coordinates project rules (`AGENTS.md`, `.cursorrules`), subagent personas (`.claude/agents/*.md`), MCP server definitions (`mcp.json`), and executable tools (`skills/`). Sharing this setup requires manual copy-pasting across dozens of dotfiles.
2. **Brittle Prerequisites:** If an agent relies on specific binaries (`uv`, `docker`, `python3`) or environment variables, teammates inevitably fail during manual setup.
3. **Platform Lock-In:** A workflow tailored for Cursor cannot be run in Claude Code, Windsurf, or GitHub Copilot without manually converting rules and re-wiring tool servers.

## 💡 How It Works

PackAI acts as **npm + Docker for AI agent systems**:

* **Universal Container:** Packages open standards—Linux Foundation `AGENTS.md`, Anthropic `mcp.json`, and `SKILL.md`—into a self-contained, validated `.packai` ZIP archive.
* **Pre-Flight System Audit:** Verifies host OS, available RAM, package managers (`brew`, `apt`, `npm`, `pip`, `uv`), and required binaries before writing files.
* **Turnkey Provisioning:** Atomically injects native config files into Claude Code, Cursor, Windsurf, Roo-Code, and Copilot.
* **Safe De-Provisioning:** Tracks every injected file in `.packai/lock.json`. Running `packai clean` removes provisioned files and prunes MCP servers without touching unrelated project files.

---

## ⚡ Quick Start

### 1. Installation

```bash
# Install globally via npm:
npm install -g packai

# Or run instantly with npx:
npx packai --help
```

### 2. Reverse-Engineer an Existing Project (2 Seconds)

Inspect your current repository (`.claude/`, `.cursor/`, `mcp.json`, `skills/`, `AGENTS.md`) and automatically synthesize a standard bundle:

```bash
$ packai init --from-existing

🐺 PackAI Ingestion Engine
  Source: /path/to/my-project
  Target: ./my-agent-squad

  Pack Level:        SYSTEM
  Base Rules:        AGENTS.md (AAIF Standard)
  Agents Discovered: architect, reviewer, sec-auditor
  MCP Servers:       postgres-mcp, github-mcp
  Binaries Needed:   node, python3
  Secrets Detected:  DATABASE_URL, GITHUB_TOKEN

✓ Pack successfully synthesized!
```

### 3. Compile into a Portable Container

```bash
$ packai pack ./my-agent-squad --output dist/my-squad-1.0.0.packai

Packing PackAI Bundle
  Pack:    my-agent-squad
  Version: 1.0.0
  Output:  dist/my-squad-1.0.0.packai (ZIP archive)
✓ Verification: SHA-256 integrity hash generated.
```

### 4. Non-Destructively Preview Changes (`diff`)

Inspect exact file additions, modifications, and IDE capability notes before touching disk:

```bash
$ packai diff dist/my-squad-1.0.0.packai --cwd ./target-project

🔍 PackAI Preview Diff: my-agent-squad (v1.0.0)
Target directory: /workspace/target-project

[CREATE] .claude/agents/architect.md (1,240 bytes)
[CREATE] .claude/agents/reviewer.md (890 bytes)
[CREATE] .cursor/rules/architect.mdc (1,310 bytes)
[MCP MERGE] .cursor/mcp.json (+2 servers)
[MCP MERGE] .mcp.json (+2 servers)

Run "packai apply" to write these changes to disk.
```

### 5. Provision Turnkey Agent System (`apply`)

```bash
$ packai apply dist/my-squad-1.0.0.packai --cwd ./target-project -i --auto-install

🐺 PackAI Universal Provisioning Engine
Applying: my-agent-squad (v1.0.0) [Level: SYSTEM]

Pre-Flight System Audit
  Host OS:          darwin (arm64)
  RAM Available:    16 GB
  Package Managers: brew, npm, pip, uv
  ✓ Platform compatibility verified
  ✓ Dependencies verified: node (v22.4.0), python3 (v3.12.1)

Provisioning AI Runtimes
  ✓ Injected master protocol: CLAUDE.md
  ✓ Injected subagent: .claude/agents/architect.md
  ✓ Injected subagent: .claude/agents/reviewer.md
  ✓ Wired 2 MCP servers into: .mcp.json
  ✓ Injected Cursor rules: .cursorrules
  ✓ Injected Cursor modular rules: .cursor/rules/*.mdc
  ✓ Wired 2 MCP servers into: .cursor/mcp.json
  ✓ Injected universal spec: AGENTS.md (Copilot/Zed/Aider)
  ✓ Injected Copilot instructions: .github/copilot-instructions.md
  ✓ Injected Windsurf rules: .windsurfrules
  ✓ Injected Roo/Cline modes: .roomodes

✓ Turnkey provisioning complete! 11 managed files recorded in .packai/lock.json.
```

### 6. Clean De-Provisioning (`clean`)

```bash
$ packai clean dist/my-squad-1.0.0.packai --cwd ./target-project

🧹 PackAI Safe De-Provisioner: my-agent-squad
  ✗ Removed: .claude/agents/architect.md
  ✗ Removed: .claude/agents/reviewer.md
  ✗ Pruned: 2 servers from .mcp.json
  ✗ Removed: .cursor/rules/architect.mdc
  ✗ Pruned: 2 servers from .cursor/mcp.json
  ✗ Removed: .github/copilot-instructions.md
  ✗ Removed: .windsurfrules
  ✗ Removed: .roomodes

✓ Cleaned 11 items cleanly without modifying unrelated project files.
```

---

## 🎯 Supported Targets

A single `.packai` bundle compiles and maps natively to the following developer environments:

| Client | Configuration Injected | MCP Tools Wired | Subagent Hierarchy |
| :--- | :--- | :---: | :---: |
| **Claude Code** | `CLAUDE.md`, `.claude/agents/*.md`, `skills/` | `.mcp.json` + `settings.json` | ✅ Native context isolation |
| **Cursor** | `.cursorrules`, `.cursor/rules/*.mdc` (glob-matched) | `.cursor/mcp.json` | Emulated via `.mdc` rules |
| **Windsurf** | `.windsurfrules` | Cascade MCP config | Flattened persona rules |
| **Roo-Code / Cline** | `.roomodes` (custom modes) | `.roo/mcp.json` | ✅ Custom mode isolation |
| **GitHub Copilot** | `.github/copilot-instructions.md` | VS Code workspace | Universal instructions |
| **OpenCode & Zed** | `AGENTS.md` (Linux Foundation AAIF standard) | `opencode.json` | Universal specification |

---

## 📊 Comparison

| Feature | Raw Dotfiles / Gists | Vendor Stores (Cursor, GPT Store) | PackAI |
| :--- | :---: | :---: | :---: |
| **Cross-Client Portability** | ❌ Manual | ❌ Vendor locked | ✅ **Universal translation** |
| **Pre-Flight Hardware / Runtime Audit** | ❌ None | ❌ None | ✅ **OS, RAM, binary audit** |
| **Automated Dependency Setup** | ❌ Manual | ❌ None | ✅ **`--auto-install` support** |
| **Multi-Agent & MCP Server Bundling** | ❌ Disconnected | ❌ Single-agent only | ✅ **Full squad packaging** |
| **Lockfile & Atomic Uninstall** | ❌ Messy dotfiles | ❌ N/A | ✅ **`.packai/lock.json`** |
| **Supply-Chain Security Defense** | ❌ None | ❌ Proprietary review | ✅ **Zip-Slip, MCP audit, Leaker tracing** |

---

## 🛡️ Security Shield

Because agent packages configure tools, shells, and APIs, PackAI integrates defense-in-depth:

```text
Incoming Pack (.packai)
       │
       ▼
[ 1. Safe Unpack ] ────► Intercepts Zip-Slip path traversal attempts (../../)
       │
       ▼
[ 2. MCP Audit ]   ────► Flags dangerous commands: reverse shells, curl|bash, sudo
       │
       ▼
[ 3. Prompt Guard ]────► Statically evaluates instruction overrides & jailbreak patterns
       │
       ▼
[ 4. Key Isolation]────► Resolves API keys from OS Keychain (never embeds plaintext in files)
       │
       ▼
[ 5. Watermarking ]────► Injects invisible zero-width unicode markers for leak forensics
```

- **Forensic Attribution:** Publishers can distribute marked bundles. If a private pack is leaked, running `packai trace <file>` recovers the cryptographic buyer ID.

---

## 💻 Command Reference

```text
Usage: packai [command] [options]

Commands:
  init [name]                      Scaffold a new pack, or reverse-engineer with --from-existing
  validate [path]                  Validate packai.yaml, AGENTS.md, mcp.json, and skills/
  diff [path]                      Visual preview of changes & client capability notices
  apply [path] (alias: install, i) Turnkey provision agent system into target project
  clean [path] (alias: uninstall)  Atomically remove provisioned files using lockfile
  pack [path]                      Compile directory into a .packai container
  unpack <file>                    Extract a .packai archive into a destination folder
  info [path]                      Inspect dossier, author metadata, requirements, and agents
  list [path] (alias: ls)          List all packs currently installed in the workspace
  export [path]                    Generate official plugin manifests for Claude, Cursor, Codex
  run [target]                     Execute standalone swarms with Keychain credential injection
  trace [path]                     Forensic analysis to extract zero-width leak tracking signatures

Options:
  -V, --version                    Output current PackAI version
  -h, --help                       Display help information
```

---

## 🧪 Test Verification

PackAI maintains a battle-tested integration suite using Node.js's native test runner (`node:test`):

```bash
# Run test suite from repository root:
npm test
```

```text
▶ End-to-End Pack Lifecycle (Init -> Apply -> Clean)
  ✔ packs into .packai archive and applies directly from the archive file (83ms)
✔ End-to-End Pack Lifecycle (Init -> Apply -> Clean) (216ms)

▶ PackAI Lockfile, List & GitHub Copilot Provisioning
  ✔ applies pack, creates .packai/lock.json, and provisions GitHub Copilot (157ms)
  ✔ cleans pack, removes GitHub Copilot instructions, and updates lockfile (6ms)
✔ PackAI Lockfile, List & GitHub Copilot Provisioning (168ms)

▶ PackAI Standards-First Engine & Ingestion
  ✔ packai init --from-existing reverse engineers workspace into skeleton (15ms)
  ✔ loadManifest parses packai.yaml and enriches companion AGENTS.md & mcp.json (1ms)
  ✔ pack into .packai bundle archive and apply turnkey onto target project (151ms)
  ✔ diff command executes cleanly and displays client capability audit notices (3ms)
✔ PackAI Standards-First Engine & Ingestion (183ms)

▶ Universal Pre-Flight & System Audit Engine
  ✔ detectHostEnvironment correctly returns OS, arch, and package managers (86ms)
  ✔ checkBinary identifies installed and missing binaries (131ms)
  ✔ runPreflight evaluates full manifest requirements (52ms)
✔ Universal Pre-Flight & System Audit Engine (270ms)

▶ PackAI Security Shield & Forensics
  ✔ auditMcpSecurity flags dangerous reverse shells and destructive commands (0.7ms)
  ✔ auditMcpSecurity passes clean MCP configurations (0.06ms)
  ✔ auditPromptInjection detects instruction override and DAN patterns (0.3ms)
  ✔ watermark engine invisibly encodes and accurately decodes buyer payload (0.2ms)
  ✔ safeExtractZip intercepts Zip-Slip path traversal attempts (7ms)
✔ PackAI Security Shield & Forensics (9ms)

▶ Manifest Validation & Semantic Checks
  ✔ validates a valid simple pack manifest (59ms)
  ✔ validates a valid system pack with universal requirements and workflow (25ms)
  ✔ rejects invalid pack names (uppercase, invalid symbols) (23ms)
  ✔ rejects invalid semantic version (22ms)
  ✔ detects level inconsistencies in semantic checks (0.2ms)
  ✔ detects missing execution entrypoint in semantic checks (0.1ms)
✔ Manifest Validation & Semantic Checks (132ms)

ℹ tests 41
ℹ suites 10
ℹ pass 41
ℹ fail 0
```

---

## 📂 Repository Layout

```text
aipack/
├── cli/                   # Node.js CLI & compiler engine (`packai`)
│   ├── bin/packai.js      # CLI entrypoint
│   ├── src/commands/      # init, validate, apply, clean, diff, pack, unpack, run, info
│   ├── src/exporters/     # Target translators (Claude, Cursor, Windsurf, Copilot, Roo)
│   ├── src/schema/        # JSON Schema for packai.yaml manifests
│   ├── src/utils/         # Pre-flight audit, credentials, lockfile, security shield
│   └── test/              # 41 integration & battle tests
│
├── marketplace/           # Next.js 16 Web Portal & Registry Explorer
│   ├── src/app/           # Next.js App Router (landing, browse, pack view)
│   └── supabase/          # Database schema & RLS policies
│
├── docs/                  # Technical specifications
│   ├── FORMAT_SPEC.md     # PackAI format specification v2.0
│   └── ARCHITECTURE_DECISIONS.md
│
└── .github/               # CI/CD and community templates
    ├── workflows/ci.yml   # Multi-Node & cross-platform testing matrix
    └── ISSUE_TEMPLATE/    # Bug report and feature request forms
```

---

## 📜 License

PackAI format and CLI are open-source software licensed under the **[MIT License](./LICENSE)**.

<div align="center">
<sub>TÜRK MİLLETİ VAR OLSUN. 🐺</sub>
</div>