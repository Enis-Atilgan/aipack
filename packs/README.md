# 📦 PackAI Packs Directory (`packs/`)

This directory is designated for organizing and developing self-contained, shareable PackAI bundles.

## 🏛️ Anatomy of a Pack

Every pack is an autonomous directory adhering to open standards (`AGENTS.md`, `mcp.json`, `skills/`):

```text
my-pack/
├── packai.yaml               # PackAI Manifest: Metadata, requirements & execution config
├── AGENTS.md                 # Universal Agent Rules (Linux Foundation AAIF format)
├── mcp.json                  # Model Context Protocol tool configurations
├── skills/                   # Modular Agent Skills (SKILL.md)
│   └── my-skill/
│       └── SKILL.md
└── knowledge/                # Physical context documents & reference material
```

## 📐 Pack Classification

PackAI categorizes packs into 3 capability tiers:

| Level | Name | Composition | Typical Use Case |
| :--- | :--- | :--- | :--- |
| **Level 1** | **Simple** | `AGENTS.md` (Persona + Rules) | Coding guidelines, style guides, framework rules |
| **Level 2** | **Enhanced** | `AGENTS.md` + `skills/` + `mcp.json` + `packai.yaml` | Tool-augmented assistants (e.g. database query bot, API helper) |
| **Level 3** | **System** | `AGENTS.md` + `skills/` + `mcp.json` + `packai.yaml` (Workflow + Multi-Agent Mesh) | Full multi-agent squads (Architect, Specialist, Auditor meshes) |

## 🛠️ Authoring & Verification Commands

### 1. Scaffold a New Pack
```bash
packai init my-pack --level enhanced --category coding
```

### 2. Validate Pack Manifest & Companion Files
```bash
packai validate ./packs/my-pack
```

### 3. Compile into a `.packai` Archive
```bash
packai pack ./packs/my-pack
# Creates: my-pack-1.0.0.packai (ZIP container)
```

### 4. Test Deployment Against a Target Project
```bash
packai apply ./packs/my-pack --cwd /path/to/test-project
```

### 5. Safe De-Provisioning
```bash
packai clean ./packs/my-pack --cwd /path/to/test-project
```
