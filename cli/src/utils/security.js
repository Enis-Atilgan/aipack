import extractZip from 'extract-zip';
import { resolve } from 'path';

/**
 * PackAI Security Shield Engine
 * Provides protection against Zip-Slip, malicious MCP shell commands,
 * and prompt injection heuristics.
 */

/**
 * Safe ZIP Extractor with Zip-Slip Path Traversal Protection
 */
export async function safeExtractZip(zipPath, destinationDir) {
  const destResolved = resolve(destinationDir);

  try {
    await extractZip(zipPath, { dir: destResolved });
  } catch (err) {
    if (
      err.message.includes('invalid relative path') ||
      err.message.includes('Out of bound') ||
      err.message.includes('..')
    ) {
      throw new Error(`[SECURITY ALERT] Zip-Slip path traversal detected! Malicious archive entry: ${err.message}`);
    }
    throw err;
  }
}

/**
 * MCP Server Security Auditor
 * Detects dangerous commands, reverse shells, and malicious pipelines.
 */
export function auditMcpSecurity(mcpServers = []) {
  const threats = [];
  const dangerousPatterns = [
    { pattern: /rm\s+-rf\s+(\/|~|\$HOME|\*)/i, description: 'Destructive filesystem deletion' },
    { pattern: /(nc|netcat|ncat)\s+.*-e\s+(\/bin\/sh|\/bin\/bash)/i, description: 'Netcat reverse shell execution' },
    { pattern: /\/dev\/tcp\/\d+\.\d+\.\d+\.\d+/i, description: 'Raw bash /dev/tcp network socket' },
    { pattern: /mkfifo\s+.*\/tmp/i, description: 'Named pipe backdoor synthesis' },
    { pattern: /(curl|wget)\s+.*\|\s*(sh|bash|zsh)/i, description: 'Arbitrary remote script execution via pipe' },
    { pattern: /powershell\s+.*-enc(odedcommand)?/i, description: 'Obfuscated PowerShell encoded command' }
  ];

  for (const server of mcpServers) {
    const fullCmd = [server.command, ...(server.args || [])].filter(Boolean).join(' ');
    for (const dp of dangerousPatterns) {
      if (dp.pattern.test(fullCmd)) {
        threats.push({
          server: server.name || server.id,
          threat: dp.description,
          command: fullCmd
        });
      }
    }
  }

  return {
    safe: threats.length === 0,
    threats
  };
}

/**
 * Prompt Injection & Hostile Override Heuristics
 */
export function auditPromptInjection(content) {
  if (!content || typeof content !== 'string') return { clean: true, warnings: [] };

  const warnings = [];
  const injectionSignatures = [
    { signature: /ignore\s+(all\s+)?(previous|prior)\s+(instructions|directives|prompts)/i, description: 'Instruction override directive' },
    { signature: /disregard\s+(all\s+)?(rules|guardrails|safety)/i, description: 'Guardrail suppression attempt' },
    { signature: /you\s+are\s+now\s+(DAN|unrestricted|jailbroken)/i, description: 'Persona jailbreak pattern (DAN/Unrestricted)' },
    { signature: /developer\s+mode\s+output/i, description: 'Developer mode exploit pattern' },
    { signature: /reveal\s+(your\s+)?(system\s+prompt|core\s+instructions)/i, description: 'System prompt exfiltration probe' }
  ];

  for (const sig of injectionSignatures) {
    if (sig.signature.test(content)) {
      warnings.push(sig.description);
    }
  }

  return {
    clean: warnings.length === 0,
    warnings
  };
}
