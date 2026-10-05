import { readFileSync, existsSync, rmSync } from 'fs';
import { resolve, join } from 'path';
import { loadManifestAsync } from './validate.js';
import { exportToClaude } from '../exporters/claude.js';
import { exportToCursor } from '../exporters/cursor.js';
import { exportToAgentsMd } from '../exporters/agentsmd.js';
import { log } from '../utils/logger.js';
import chalk from 'chalk';

export const CLIENT_CAPABILITIES = {
  claude: {
    name: 'Claude Code / Desktop',
    supportsSubagents: true,
    supportsMcp: true,
    supportsRules: true,
    supportsWorkflowRouting: true,
  },
  cursor: {
    name: 'Cursor',
    supportsSubagents: false, // Emulated via .cursor/rules/*.mdc
    supportsMcp: true,
    supportsRules: true,
    supportsWorkflowRouting: false, // Emulated via rule globs/alwaysApply
  },
  agentsmd: {
    name: 'AGENTS.md (Zed, Copilot, Aider, Codex)',
    supportsSubagents: false, // Flattened markdown
    supportsMcp: false,
    supportsRules: true,
    supportsWorkflowRouting: false,
  },
  windsurf: {
    name: 'Windsurf Cascade',
    supportsSubagents: false,
    supportsMcp: false,
    supportsRules: true,
    supportsWorkflowRouting: false,
  },
  roo: {
    name: 'Roo-Code / Cline',
    supportsSubagents: true, // Custom modes in .roomodes
    supportsMcp: true,
    supportsRules: true,
    supportsWorkflowRouting: false,
  }
};

function simpleLineDiff(oldStr, newStr) {
  const oldLines = oldStr ? oldStr.split('\n') : [];
  const newLines = newStr ? newStr.split('\n') : [];
  const lines = [];

  const max = Math.max(oldLines.length, newLines.length);
  for (let i = 0; i < max; i++) {
    const o = oldLines[i];
    const n = newLines[i];

    if (o === undefined) {
      lines.push(chalk.green(`+ ${n}`));
    } else if (n === undefined) {
      lines.push(chalk.red(`- ${o}`));
    } else if (o !== n) {
      lines.push(chalk.red(`- ${o}`));
      lines.push(chalk.green(`+ ${n}`));
    }
  }

  return lines;
}

export async function diffCommand(path, options = {}) {
  let tempCleanupDir = null;
  try {
    const { manifest, dir, isTemp } = await loadManifestAsync(path);
    if (isTemp) tempCleanupDir = dir;
    const targetDir = resolve(options.cwd || '.');
    const targetClient = (options.target || 'all').toLowerCase();

    console.log();
    console.log(chalk.bold.cyan(`🔍 PackAI Preview Diff: ${manifest.name} (v${manifest.version})`));
    console.log(chalk.dim(`Target directory: ${targetDir}`));
    console.log();

    // Client Capability Gap Audit
    const clientsToCheck = targetClient === 'all' ? Object.keys(CLIENT_CAPABILITIES) : [targetClient];
    const capabilityNotices = [];

    for (const c of clientsToCheck) {
      const cap = CLIENT_CAPABILITIES[c];
      if (!cap) continue;
      if (manifest.level === 'system' && !cap.supportsSubagents) {
        capabilityNotices.push(`[${cap.name}] No native subagent isolation. Multi-agent workforce will be emulated/flattened.`);
      }
      if (manifest.workflow && !cap.supportsWorkflowRouting) {
        capabilityNotices.push(`[${cap.name}] State-machine workflow not natively supported. Fallback to inline prompts.`);
      }
      if (manifest.tools?.mcp_servers?.length > 0 && !cap.supportsMcp) {
        capabilityNotices.push(`[${cap.name}] Does not support automated MCP tool wiring.`);
      }
    }

    if (capabilityNotices.length > 0) {
      console.log(chalk.bold.yellow('⚠ Client Capability Audit Notices:'));
      for (const notice of capabilityNotices) {
        console.log(chalk.yellow(`  • ${notice}`));
      }
      console.log();
    }

    let changesFound = false;

    // --- Claude Inspection ---
    if (targetClient === 'all' || targetClient === 'claude') {
      const claudeMdPath = join(targetDir, 'CLAUDE.md');
      const expectedClaudeMd = exportToClaude(manifest, dir);
      const existingClaudeMd = existsSync(claudeMdPath) ? readFileSync(claudeMdPath, 'utf-8') : null;

      if (!existingClaudeMd) {
        changesFound = true;
        console.log(chalk.green(`[CREATE] CLAUDE.md (${expectedClaudeMd.length} characters)`));
      } else if (existingClaudeMd !== expectedClaudeMd) {
        changesFound = true;
        console.log(chalk.yellow(`[MODIFY] CLAUDE.md`));
        const diffLines = simpleLineDiff(existingClaudeMd, expectedClaudeMd).slice(0, 20);
        console.log(diffLines.join('\n'));
        if (diffLines.length >= 20) console.log(chalk.dim('  ... (diff truncated)'));
      } else {
        console.log(chalk.dim(`[UNCHANGED] CLAUDE.md`));
      }

      // Subagents
      if (manifest.level === 'system' && manifest.agents) {
        for (const agent of manifest.agents) {
          const agentPath = join(targetDir, '.claude', 'agents', `${agent.id}.md`);
          const exists = existsSync(agentPath);
          changesFound = true;
          if (exists) {
            console.log(chalk.yellow(`[OVERWRITE] .claude/agents/${agent.id}.md`));
          } else {
            console.log(chalk.green(`[CREATE] .claude/agents/${agent.id}.md (${agent.name})`));
          }
        }
      }

      // MCP
      if (manifest.tools?.mcp_servers && manifest.tools.mcp_servers.length > 0) {
        const mcpPath = join(targetDir, '.claude', 'settings.json');
        console.log(chalk.cyan(`[MCP MERGE] .claude/settings.json (+${manifest.tools.mcp_servers.length} servers)`));
        for (const s of manifest.tools.mcp_servers) {
          console.log(chalk.dim(`  + ${s.name || s.id}: ${s.command || s.source}`));
        }
        changesFound = true;
      }
    }

    // --- Cursor Inspection ---
    if (targetClient === 'all' || targetClient === 'cursor') {
      const cursorrulesPath = join(targetDir, '.cursorrules');
      const expectedCursor = exportToCursor(manifest, dir);
      const existingCursor = existsSync(cursorrulesPath) ? readFileSync(cursorrulesPath, 'utf-8') : null;

      if (!existingCursor) {
        changesFound = true;
        console.log(chalk.green(`[CREATE] .cursorrules (${expectedCursor.length} characters)`));
      } else if (existingCursor !== expectedCursor) {
        changesFound = true;
        console.log(chalk.yellow(`[MODIFY] .cursorrules`));
        const diffLines = simpleLineDiff(existingCursor, expectedCursor).slice(0, 20);
        console.log(diffLines.join('\n'));
      } else {
        console.log(chalk.dim(`[UNCHANGED] .cursorrules`));
      }

      if (manifest.tools?.mcp_servers && manifest.tools.mcp_servers.length > 0) {
        console.log(chalk.cyan(`[MCP MERGE] .cursor/mcp.json (+${manifest.tools.mcp_servers.length} servers)`));
        changesFound = true;
      }
    }

    // --- AGENTS.md Universal Inspection ---
    if (targetClient === 'all' || targetClient === 'agentsmd') {
      const agentsMdPath = join(targetDir, 'AGENTS.md');
      const expectedAgents = exportToAgentsMd(manifest, dir);
      const existingAgents = existsSync(agentsMdPath) ? readFileSync(agentsMdPath, 'utf-8') : null;

      if (!existingAgents) {
        changesFound = true;
        console.log(chalk.green(`[CREATE] AGENTS.md (${expectedAgents.length} characters)`));
      } else if (existingAgents !== expectedAgents) {
        changesFound = true;
        console.log(chalk.yellow(`[MODIFY] AGENTS.md`));
      } else {
        console.log(chalk.dim(`[UNCHANGED] AGENTS.md`));
      }
    }

    // --- Skills & Knowledge Preview ---
    if (manifest.skills && Array.isArray(manifest.skills) && manifest.skills.length > 0) {
      console.log(chalk.green(`[SKILLS PROVISION] skills/ (+${manifest.skills.length} agent skills)`));
      changesFound = true;
    }
    if (existsSync(join(dir, 'knowledge'))) {
      console.log(chalk.green(`[KNOWLEDGE PROVISION] .packai/knowledge/`));
      changesFound = true;
    }
    if (manifest.execution?.command) {
      console.log(chalk.cyan(`[EXECUTION READY] Command: "${manifest.execution.command}" (run via packai run)`));
    }

    console.log();
    if (changesFound) {
      console.log(chalk.dim(`Run "packai apply" to write these changes to disk.`));
    } else {
      console.log(chalk.green(`Target is already up-to-date with this pack.`));
    }
    console.log();

  } catch (err) {
    log.error(err.message);
    process.exit(1);
  } finally {
    if (tempCleanupDir) {
      try { rmSync(tempCleanupDir, { recursive: true, force: true }); } catch {}
    }
  }
}
