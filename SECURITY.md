# Security Policy

## Reporting a Vulnerability

We take the security of PackAI and the agent configurations it provisions seriously. If you discover a security vulnerability in PackAI CLI or its provisioning pipeline, please report it privately:

- **Email**: `enisatilgan0101@gmail.com`
- Please do not disclose vulnerabilities in public GitHub issues until a patch has been released.
- You will receive a response within 48 hours acknowledging receipt of your report.

## Built-In Security Guarantees

PackAI provisions executable configs, subagents, and MCP servers directly onto local developer machines. To safeguard developer environments, PackAI enforces several defense layers:

### 1. Zip-Slip & Path Traversal Prevention
When extracting `.packai` archives, `safeExtractZip` inspects every entry's target destination path. Any attempt to write outside the target directory (e.g. `../../etc/passwd` or `~/.ssh/authorized_keys`) is intercepted and rejected before bytes are written to disk.

### 2. Pre-Flight MCP Security Audit
Before writing MCP server configurations into `.mcp.json` or `.cursor/mcp.json`, PackAI's security shield scans command lines and arguments for destructive patterns:
- Dangerous reverse shells (`nc -e`, `/dev/tcp`, `mkfifo`)
- Unverified remote script execution (`curl ... | sh`, `wget ... | bash`)
- Arbitrary privilege escalation attempts

### 3. Prompt Injection Defense
Pack manifests containing prompt files (`AGENTS.md`, `system.md`, subagent personas) are statically audited for common jailbreaks, DAN prompts, and instruction override delimiters that attempt to subvert agent boundaries.

### 4. Credential Isolation
PackAI never embeds raw secrets or API keys into pack archives or project source control. Credentials declared in `packai.yaml` are securely resolved from the host OS Keychain (or ephemeral environment variables) at runtime.

### 5. Forensic Watermarking (Traitor Tracing)
Downloaded bundles can be deterministically marked with zero-width unicode steganographic signatures (`U+200B` / `U+200C`). If an authorized pack is leaked publicly, the publisher can run `packai trace <file>` to extract the cryptographic attribution hash.
