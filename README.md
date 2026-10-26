# PackAI

[![CI](https://github.com/Enis-Atilgan/aipack/actions/workflows/ci.yml/badge.svg)](https://github.com/Enis-Atilgan/aipack/actions/workflows/ci.yml)
[![Tests](https://img.shields.io/badge/tests-41%20passed-10b981)](https://github.com/Enis-Atilgan/aipack)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](./LICENSE)
[![Node Runtime](https://img.shields.io/badge/node-%3E%3D18.0.0-06b6d4.svg)](https://nodejs.org)

A fast, cross-client package manager and distribution engine for AI agent systems.

PackAI packages multi-agent hierarchies, rules (`AGENTS.md`), skills (`SKILL.md`), and tool servers (`mcp.json`) into portable, verifiable bundles and provisions them natively into Claude Code, Cursor, Windsurf, Roo-Code, and GitHub Copilot.

## Highlights

- **Universal packaging**: Bundle `AGENTS.md`, `mcp.json`, and subagent configs into a single `.packai` archive.
- **Reverse engineering**: Run `packai init --from-existing` to discover and convert existing `.claude/`, `.cursor/`, and MCP configurations in seconds.
- **Cross-client provisioning**: One command (`packai apply`) writes native configurations tailored to each editor (Claude Code, Cursor, Windsurf, Roo-Code, Copilot).
- **Pre-flight host audits**: Automatically verifies operating system, architecture, memory, package managers, and required runtime binaries before touching files.
- **Deterministic lockfile**: Tracks every provisioned file in `.packai/lock.json` for safe, atomic uninstalls via `packai clean`.
- **Built-in supply chain security**: Path traversal defense (Zip-Slip prevention), static MCP command sanitization, and prompt injection screening.
- **Traitor tracing**: Zero-width steganographic watermarking for tracking leaked packages.
- **Zero proprietary lock-in**: Built entirely on open specifications (Linux Foundation AAIF `AGENTS.md`, Anthropic `mcp.json`, and Agent Skills).

## Installation

Install globally via npm:

```bash
npm install -g packai
```

Or run directly with `npx`:

```bash
npx packai --help
```

## Quickstart

### 1. Package an existing workspace

Turn your current developer setup into a reusable pack:

```console
$ packai init --from-existing
Scanned: .claude/agents/architect.md, .cursor/rules/*.mdc, mcp.json
Created pack skeleton: ./my-agent-squad (Level: system)
```

### 2. Build a distributable archive

```console
$ packai pack ./my-agent-squad --output my-squad-1.0.0.packai
Packaged my-agent-squad (v1.0.0) -> my-squad-1.0.0.packai
```

### 3. Preview changes before applying

```console
$ packai diff my-squad-1.0.0.packai --cwd ./target-project
Targets detected: Cursor, Claude Code, GitHub Copilot

[create] .claude/agents/architect.md
[create] .cursor/rules/architect.mdc
[merge]  .cursor/mcp.json (+1 server)
[merge]  .mcp.json (+1 server)
```

### 4. Deploy to a project

```console
$ packai apply my-squad-1.0.0.packai --cwd ./target-project --auto-install
Pre-flight check passed: darwin arm64, node >= 18
Provisioned 11 items across Claude Code, Cursor, and Copilot.
Wrote lockfile: .packai/lock.json
```

### 5. Remove cleanly

```console
$ packai clean my-squad-1.0.0.packai --cwd ./target-project
Removed 11 items and pruned 2 MCP servers.
```

## Supported Targets

PackAI translates a single bundle into native configuration files for each client:

| Editor / Client | Injected Configurations | MCP Integration | Subagent Support |
| :--- | :--- | :--- | :--- |
| **Claude Code** | `CLAUDE.md`, `.claude/agents/*.md`, `skills/` | `.mcp.json`, `.claude/settings.json` | Native context isolation |
| **Cursor** | `.cursorrules`, `.cursor/rules/*.mdc` | `.cursor/mcp.json` | Rule glob matching |
| **Windsurf** | `.windsurfrules` | Cascade MCP config | Flattened instructions |
| **Roo-Code / Cline** | `.roomodes` | `.roo/mcp.json` | Custom modes |
| **GitHub Copilot** | `.github/copilot-instructions.md` | VS Code workspace | Universal context |
| **OpenCode & Zed** | `AGENTS.md` (AAIF standard) | `opencode.json` | Universal specification |

## Pack Structure

A PackAI package uses standard open formats:

```text
my-pack/
├── packai.yaml          # Manifest: metadata, requirements, and execution config
├── AGENTS.md            # Universal rules (Linux Foundation AAIF)
├── mcp.json             # Tool definitions (Model Context Protocol)
├── skills/              # Agent skills (SKILL.md)
│   └── code-review/
│       └── SKILL.md
└── knowledge/           # Context documents and reference files
```

### Manifest Example (`packai.yaml`)

```yaml
spec_version: "2.0"
name: fullstack-squad
version: "1.0.0"
description: Architecture, review, and database agent team
level: system
category: coding

requirements:
  platform:
    os: [darwin, linux]
    min_ram_gb: 8
  binaries:
    - name: node
      min_version: "18.0.0"
  secrets:
    - id: DATABASE_URL
      required: true

agents:
  - id: architect
    name: System Architect
    persona: { file: ./agents/architect.md }
  - id: reviewer
    name: Code Reviewer
    persona: { file: ./agents/reviewer.md }
```

## Security

PackAI inspects incoming packs to protect developer workstations:

- **Zip-Slip defense**: Validates file paths during archive extraction to block directory traversal attacks (`../../`).
- **Command audit**: Statically scans MCP server definitions for dangerous command patterns (reverse shells, piping `curl` into `bash`, unauthorized privilege escalation).
- **Prompt guard**: Identifies instruction override patterns and jailbreak delimiters in system prompts before injection.
- **Keychain integration**: API keys and database credentials declared in manifests are read from the host OS Keychain, never committed to disk in plaintext.
- **Forensic watermarking**: Optionally embeds zero-width Unicode signatures (`U+200B` / `U+200C`) into files for traitor tracing. Run `packai trace <file>` to inspect attribution.

## CLI Reference

```text
Usage: packai [command] [options]

Commands:
  init [name]                      Scaffold a new pack, or reverse-engineer with --from-existing
  validate [path]                  Validate packai.yaml, AGENTS.md, mcp.json, and skills/
  diff [path]                      Preview changes and client capability notices before applying
  apply [path] (alias: install, i) Turnkey provision an agent system into a target project
  clean [path] (alias: uninstall)  Atomically remove provisioned files using .packai/lock.json
  pack [path]                      Compile a pack directory into a .packai archive
  unpack <file>                    Extract a .packai archive into a target directory
  info [path]                      Show pack dossier, requirements, and discovered agents
  list [path] (alias: ls)          List all packs currently installed in the workspace
  export [path]                    Generate official plugin manifests for Claude, Cursor, and Codex
  run [target]                     Execute standalone framework swarms with injected secrets
  trace [path]                     Forensic inspection to extract zero-width leak tracking signatures

Options:
  -V, --version                    Display version number
  -h, --help                       Display help information
```

## Development & Testing

PackAI uses Node.js's built-in test runner (`node:test`) for fast, zero-dependency testing.

```bash
# Clone the repository
git clone https://github.com/Enis-Atilgan/aipack.git
cd aipack

# Install workspace dependencies
npm install

# Run the test suite
npm test
```

## License

[MIT](./LICENSE)