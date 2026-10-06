# 📦 PackAI Official Seed Packs (`packs/`)

This directory houses the official, certified PackAI turnkey packs.

## 🏛️ Directory Structure

Each subfolder represents an autonomous, self-contained pack:

```
packs/
├── offensive-red-team/          # Level 3: Autonomous Cyber Warfare & Vulnerability Mesh
├── fullstack-nextjs-architect/  # Level 3: Enterprise SaaS Multi-Agent Workforce
└── cloud-sec-auditor/           # Level 2: Cloud Infrastructure & Terraform Guardian
```

## 📐 Pack Levels

- **Level 1 (Simple):** `AGENTS.md` persona, directives and coding style rules.
- **Level 2 (Enhanced):** `AGENTS.md` + `skills/` + `mcp.json` + `packai.yaml` (system requirements, binaries, secrets).
- **Level 3 (System):** `AGENTS.md` + `skills/` + `mcp.json` + `packai.yaml` (workflow routing, coordinator-specialist-auditor mesh, execution runner).

## 🛠️ Verification & Building

To validate a pack:
```bash
packai validate ./packs/<pack-name>
```

To compile into a `.packai` bundle:
```bash
packai pack ./packs/<pack-name> --output dist/<pack-name>.packai
```

To test locally:
```bash
packai apply ./packs/<pack-name> --cwd /tmp/test-project
```
