import { readFileSync, writeFileSync, existsSync, mkdirSync, rmSync } from 'fs';
import { resolve, join } from 'path';
import { execSync } from 'child_process';
import { loadManifestAsync, validateManifest, runSemanticChecks } from './validate.js';
import { runPreflight } from '../utils/preflight.js';
import { getCredential, setCredential } from '../utils/credentials.js';
import { exportToClaude } from '../exporters/claude.js';
import { exportToCursor } from '../exporters/cursor.js';
import { exportToAgentsMd } from '../exporters/agentsmd.js';
import { exportToWindsurf } from '../exporters/windsurf.js';
import { exportToRooModes } from '../exporters/roomodes.js';
import { log } from '../utils/logger.js';
import chalk from 'chalk';

/**
 * Merge new MCP servers into an existing MCP configuration file without overwriting existing servers.
 */
function mergeMcpConfig(filePath, newServers) {
  let existing = { mcpServers: {} };
  if (existsSync(filePath)) {
    try {
      existing = JSON.parse(readFileSync(filePath, 'utf-8'));
      if (!existing.mcpServers) existing.mcpServers = {};
    } catch {
      existing = { mcpServers: {} };
    }
  }

  for (const server of newServers) {
    existing.mcpServers[server.id || server.name] = {
      command: server.command || server.source || 'npx',
      args: server.args || [],
      env: server.env || server.config || {},
    };
  }

  const dir = resolve(filePath, '..');
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  writeFileSync(filePath, JSON.stringify(existing, null, 2), 'utf-8');
}

export async function applyCommand(path, options = {}) {
  let tempCleanupDir = null;
  try {
    const { manifest, dir, isTemp } = await loadManifestAsync(path);
    if (isTemp) tempCleanupDir = dir;
    const targetDir = resolve(options.cwd || '.');
    const targetClient = (options.target || 'all').toLowerCase();

    if (!existsSync(targetDir)) {
      mkdirSync(targetDir, { recursive: true });
    }

    console.log();
    console.log(chalk.bold.cyan(`🐺 PackAI Universal Provisioning Engine`));
    console.log(chalk.dim(`Applying: ${manifest.name} (v${manifest.version}) [Level: ${manifest.level.toUpperCase()}]`));
    console.log(chalk.dim(`Target directory: ${targetDir}`));
    console.log();

    // 1. Validation
    const valResult = validateManifest(manifest);
    if (!valResult.valid) {
      log.error('Manifest schema validation failed:');
      for (const err of valResult.errors) {
        console.log(`  - ${err.instancePath || '/'}: ${err.message}`);
      }
      process.exit(1);
    }

    const { errors: semErrors, warnings: semWarnings } = runSemanticChecks(manifest, dir);
    if (semErrors.length > 0) {
      log.error('Semantic validation failed:');
      for (const e of semErrors) console.log(`  - ${e}`);
      process.exit(1);
    }
    if (semWarnings.length > 0) {
      for (const w of semWarnings) log.warn(w);
    }

    // 2. Pre-Flight Audit
    log.heading('Pre-Flight System Audit');
    const preflight = await runPreflight(manifest);

    log.item('Host OS', `${preflight.host.platform} (${preflight.host.arch})`);
    log.item('RAM Available', `${preflight.host.totalRamGb} GB`);
    log.item('Package Managers', preflight.host.pkgManagers.join(', ') || 'None detected');

    // Platform compatibility
    if (!preflight.platform.ok) {
      for (const err of preflight.platform.errors) {
        log.error(`Platform Check: ${err}`);
      }
      if (!options.force) {
        log.error('Aborting due to platform incompatibility. Use --force to override.');
        process.exit(1);
      }
    } else {
      console.log(chalk.green(`  ✓ Platform compatibility verified`));
    }

    // Binaries & Runtimes
    if (preflight.binaries.length > 0) {
      console.log(chalk.bold('\n  Dependencies:'));
      for (const b of preflight.binaries) {
        if (b.installed) {
          const vStr = b.version ? chalk.dim(` (${b.version})`) : '';
          console.log(`  ${chalk.green('✓')} ${chalk.bold(b.name)}${vStr}`);
        } else {
          console.log(`  ${chalk.red('✗')} ${chalk.bold(b.name)} - ${chalk.yellow('NOT INSTALLED')}`);
          if (b.suggestedInstallCmd) {
            console.log(chalk.dim(`    Suggested install: ${chalk.cyan(b.suggestedInstallCmd)}`));
            if (options.autoInstall) {
              log.info(`Executing auto-install: ${b.suggestedInstallCmd}`);
              try {
                execSync(b.suggestedInstallCmd, { stdio: 'inherit' });
                console.log(chalk.green(`    ✓ Successfully installed ${b.name}`));
              } catch (e) {
                log.error(`Auto-install failed: ${e.message}`);
              }
            }
          } else if (b.manualUrl) {
            console.log(chalk.dim(`    Download manual: ${b.manualUrl}`));
          }
        }
      }
    }

    // Services
    if (preflight.services.length > 0) {
      console.log(chalk.bold('\n  Services & Daemons:'));
      for (const s of preflight.services) {
        if (s.active) {
          console.log(`  ${chalk.green('✓')} ${chalk.bold(s.name)} (active)`);
        } else {
          console.log(`  ${chalk.red('✗')} ${chalk.bold(s.name)} - ${chalk.yellow('INACTIVE')}`);
          if (s.autoStartCmd) {
            console.log(chalk.dim(`    Start command: ${chalk.cyan(s.autoStartCmd)}`));
            if (options.autoStart) {
              log.info(`Starting service: ${s.autoStartCmd}`);
              try {
                execSync(s.autoStartCmd, { stdio: 'inherit' });
              } catch (e) {
                log.error(`Failed to start service: ${e.message}`);
              }
            }
          }
        }
      }
    }

    // Secrets & Credentials
    if (preflight.secrets.length > 0) {
      console.log(chalk.bold('\n  Secrets & Credentials:'));
      for (const sec of preflight.secrets) {
        let stored = getCredential(sec.id);
        if (stored) {
          console.log(`  ${chalk.green('✓')} ${chalk.bold(sec.id)} (resolved from OS Keychain/Env)`);
        } else if (sec.required) {
          console.log(`  ${chalk.red('✗')} ${chalk.bold(sec.id)} (${sec.label}) - ${chalk.yellow('MISSING')}`);
          if (options.interactive) {
            try {
              const rl = (await import('readline/promises')).default.createInterface({
                input: process.stdin,
                output: process.stdout,
              });
              const answer = await rl.question(chalk.cyan(`    [?] Enter value for ${sec.label || sec.id}: `));
              rl.close();

              if (answer && answer.trim()) {
                const val = answer.trim();
                let valid = true;
                if (sec.validation_regex) {
                  const rx = new RegExp(sec.validation_regex);
                  if (!rx.test(val)) {
                    log.error(`    Invalid format according to pattern: ${sec.validation_regex}`);
                    valid = false;
                  }
                }
                if (valid) {
                  setCredential(sec.id, val);
                  console.log(chalk.green(`    ✓ Successfully saved ${sec.id} to OS Keychain!`));
                }
              }
            } catch {
              // TTY error or input cancelled
            }
          } else {
            console.log(chalk.dim(`    Set with: export ${sec.id}="value" (or run with -i to prompt)`));
          }
        } else {
          console.log(`  ${chalk.dim('○')} ${chalk.dim(sec.id)} (optional)`);
        }
      }
    }

    console.log();

    // 3. Client Injection
    log.heading('Provisioning AI Runtimes');

    const mcpServers = manifest.tools?.mcp_servers || [];

    // --- Claude Code / Desktop Injection ---
    if (targetClient === 'all' || targetClient === 'claude') {
      const claudeMdContent = exportToClaude(manifest, dir);
      const claudeMdPath = join(targetDir, 'CLAUDE.md');
      writeFileSync(claudeMdPath, claudeMdContent, 'utf-8');
      console.log(`  ${chalk.green('✓')} Injected master protocol: ${chalk.cyan('CLAUDE.md')}`);

      // Level 3: Subagents (conforms to Claude Code 2026 isolated subprocess spec)
      if (manifest.level === 'system' && manifest.agents) {
        const agentsDir = join(targetDir, '.claude', 'agents');
        if (!existsSync(agentsDir)) mkdirSync(agentsDir, { recursive: true });

        for (const agent of manifest.agents) {
          const toolsStr = Array.isArray(agent.tools) && agent.tools.length > 0
            ? agent.tools.join(', ')
            : 'Read, Edit, Bash, Glob, Grep, Write';
          const modelStr = agent.model_preference || 'inherit';
          const descStr = (agent.description || agent.name).replace(/\n/g, ' ');

          let agentContent = `---\nname: ${agent.id}\ndescription: ${descStr}\ntools: ${toolsStr}\nmodel: ${modelStr}\n---\n\n`;
          agentContent += `# Agent: ${agent.name} (${agent.id})\n\n`;
          if (agent.description) agentContent += `${agent.description}\n\n`;
          if (agent.model_preference) agentContent += `**Model Preference:** ${agent.model_preference}\n\n`;

          if (agent.persona?.file) {
            try {
              agentContent += readFileSync(join(dir, agent.persona.file), 'utf-8');
            } catch {
              agentContent += agent.persona.instructions || '';
            }
          } else if (agent.persona?.instructions) {
            agentContent += agent.persona.instructions;
          }

          const agentFile = join(agentsDir, `${agent.id}.md`);
          writeFileSync(agentFile, agentContent, 'utf-8');
          console.log(`  ${chalk.green('✓')} Injected subagent: ${chalk.cyan(`.claude/agents/${agent.id}.md`)}`);
        }
      }

      // MCP config for Claude
      if (mcpServers.length > 0) {
        const claudeMcpPath = join(targetDir, '.claude', 'settings.json');
        mergeMcpConfig(claudeMcpPath, mcpServers);
        console.log(`  ${chalk.green('✓')} Wired ${mcpServers.length} MCP servers into: ${chalk.cyan('.claude/settings.json')}`);
      }
    }

    // --- Cursor Injection ---
    if (targetClient === 'all' || targetClient === 'cursor') {
      const cursorRulesContent = exportToCursor(manifest, dir);
      const cursorRulesPath = join(targetDir, '.cursorrules');
      writeFileSync(cursorRulesPath, cursorRulesContent, 'utf-8');
      console.log(`  ${chalk.green('✓')} Injected Cursor rules: ${chalk.cyan('.cursorrules')}`);

      // Level 3: Cursor modular rules (.cursor/rules/*.mdc)
      // Anti-token blowout: only coordinator/entrypoint is alwaysApply: true, specialists are false with semantic descriptions
      if (manifest.level === 'system' && manifest.agents) {
        const cursorRulesDir = join(targetDir, '.cursor', 'rules');
        if (!existsSync(cursorRulesDir)) mkdirSync(cursorRulesDir, { recursive: true });

        const entryAgentId = manifest.workflow?.entry;
        for (const agent of manifest.agents) {
          const isEntry = entryAgentId === agent.id;
          const descStr = (agent.description || agent.name).replace(/\n/g, ' ');
          const globsStr = agent.globs ? (Array.isArray(agent.globs) ? agent.globs.join(', ') : agent.globs) : '';

          let ruleContent = `---\ndescription: ${descStr}\n`;
          if (globsStr) ruleContent += `globs: ${globsStr}\n`;
          ruleContent += `alwaysApply: ${isEntry ? 'true' : 'false'}\n---\n\n`;
          ruleContent += `# Agent: ${agent.name} (${agent.id})\n\n`;
          if (agent.model_preference) ruleContent += `**Model Tier:** \`${agent.model_preference}\`\n\n`;

          if (agent.persona?.file) {
            try {
              ruleContent += readFileSync(join(dir, agent.persona.file), 'utf-8') + '\n\n';
            } catch {
              ruleContent += (agent.persona.instructions || '') + '\n\n';
            }
          } else if (agent.persona?.instructions) {
            ruleContent += agent.persona.instructions + '\n\n';
          }

          if (agent.rules?.items) {
            ruleContent += `## Rules\n`;
            for (const r of agent.rules.items) ruleContent += `- ${r}\n`;
            ruleContent += '\n';
          }

          const ruleFile = join(cursorRulesDir, `${agent.id}.mdc`);
          writeFileSync(ruleFile, ruleContent, 'utf-8');
          console.log(`  ${chalk.green('✓')} Injected Cursor modular rule: ${chalk.cyan(`.cursor/rules/${agent.id}.mdc`)}`);
        }
      }

      // MCP config for Cursor
      if (mcpServers.length > 0) {
        const cursorMcpPath = join(targetDir, '.cursor', 'mcp.json');
        mergeMcpConfig(cursorMcpPath, mcpServers);
        console.log(`  ${chalk.green('✓')} Wired ${mcpServers.length} MCP servers into: ${chalk.cyan('.cursor/mcp.json')}`);
      }
    }

    // --- Universal AGENTS.md (Linux Foundation AAIF Standard) ---
    if (targetClient === 'all' || targetClient === 'agentsmd') {
      const agentsMdContent = exportToAgentsMd(manifest, dir);
      const agentsMdPath = join(targetDir, 'AGENTS.md');
      writeFileSync(agentsMdPath, agentsMdContent, 'utf-8');
      console.log(`  ${chalk.green('✓')} Injected universal spec: ${chalk.cyan('AGENTS.md')} (Copilot/Zed/Aider/Codex)`);
    }

    // --- Windsurf Cascade Injection ---
    if (targetClient === 'all' || targetClient === 'windsurf') {
      const windsurfContent = exportToWindsurf(manifest, dir);
      const windsurfPath = join(targetDir, '.windsurfrules');
      writeFileSync(windsurfPath, windsurfContent, 'utf-8');
      console.log(`  ${chalk.green('✓')} Injected Windsurf rules: ${chalk.cyan('.windsurfrules')}`);
    }

    // --- Roo-Code / Cline Injection ---
    if (targetClient === 'all' || targetClient === 'roo' || targetClient === 'cline') {
      const rooContent = exportToRooModes(manifest, dir);
      const rooPath = join(targetDir, '.roomodes');
      writeFileSync(rooPath, rooContent, 'utf-8');
      console.log(`  ${chalk.green('✓')} Injected Roo/Cline modes: ${chalk.cyan('.roomodes')}`);

      if (mcpServers.length > 0) {
        const rooMcpPath = join(targetDir, '.roo', 'mcp.json');
        mergeMcpConfig(rooMcpPath, mcpServers);
        console.log(`  ${chalk.green('✓')} Wired ${mcpServers.length} MCP servers into: ${chalk.cyan('.roo/mcp.json')}`);
      }
    }

    console.log();
    log.success(`Turnkey provisioning complete! Your agent system is ready.`);
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
