import { loadManifestAsync } from './validate.js';
import { log } from '../utils/logger.js';
import chalk from 'chalk';
import { rmSync } from 'fs';

export async function infoCommand(path, options = {}) {
  let tempCleanupDir = null;
  try {
    const { manifest, dir, isTemp } = await loadManifestAsync(path);
    if (isTemp) tempCleanupDir = dir;

    console.log();
    console.log(chalk.bold.cyan(`🐺 PackAI Dossier: ${manifest.name} (v${manifest.version})`));
    console.log(chalk.dim(`Level: ${manifest.level.toUpperCase()} | License: ${manifest.license || 'N/A'} | Category: ${manifest.category || 'other'}`));
    console.log(chalk.dim(`Description: ${manifest.description}`));
    console.log();

    // 1. Author & Metadata
    log.heading('Metadata');
    log.item('Author', manifest.author?.name || 'Unknown');
    if (manifest.author?.github) log.item('GitHub', manifest.author.github);
    if (manifest.tags?.length > 0) log.item('Tags', manifest.tags.join(', '));
    if (manifest.language) log.item('Language', manifest.language);

    // 2. Multi-Agent Workforce (Level 3)
    if (manifest.agents && manifest.agents.length > 0) {
      console.log();
      log.heading(`Agent Workforce (${manifest.agents.length} agents)`);
      for (const a of manifest.agents) {
        const tier = a.model_preference ? chalk.yellow(`[${a.model_preference}]`) : '';
        console.log(`  • ${chalk.bold.green(a.name)} (\`${a.id}\`) ${tier}`);
        if (a.description) console.log(chalk.dim(`    ${a.description}`));
      }
    }

    // 3. Workflow & Orchestration
    if (manifest.workflow) {
      console.log();
      log.heading('Workflow & Orchestration');
      if (manifest.workflow.entry) {
        log.item('Entrypoint', chalk.green(manifest.workflow.entry));
      }
      if (manifest.workflow.routes?.length > 0) {
        console.log(chalk.bold('  Routing Graph:'));
        for (const r of manifest.workflow.routes) {
          console.log(`    ${chalk.cyan(r.from)} ──[${r.condition}]──> ${chalk.green(r.to)}`);
        }
      }
    }

    // 4. Tools (MCP Servers)
    const mcpServers = manifest.tools?.mcp_servers || [];
    if (mcpServers.length > 0) {
      console.log();
      log.heading(`MCP Tool Integrations (${mcpServers.length})`);
      for (const s of mcpServers) {
        console.log(`  ⚙ ${chalk.bold(s.name || s.id)}: ${chalk.dim(s.command || s.source || 'npx')}`);
        if (s.description) console.log(chalk.dim(`    ${s.description}`));
      }
    }

    // 5. System Requirements & Pre-Flight Spec
    const req = manifest.requirements;
    if (req) {
      console.log();
      log.heading('System Requirements & Pre-Flight');
      if (req.platform) {
        if (req.platform.os) log.item('Supported OS', req.platform.os.join(', '));
        if (req.platform.min_ram_gb) log.item('Min RAM', `${req.platform.min_ram_gb} GB`);
        if (req.platform.gpu) log.item('GPU Target', req.platform.gpu.type || 'Optional');
      }
      if (req.binaries?.length > 0) {
        log.item('Required CLI Tools', req.binaries.map(b => b.name).join(', '));
      }
      if (req.services?.length > 0) {
        log.item('Required Daemons', req.services.map(s => s.name).join(', '));
      }
      if (req.secrets?.length > 0) {
        log.item('Required Secrets', req.secrets.map(s => s.id).join(', '));
      }
    }

    // 6. Skills Directory / Declared Skills
    const skills = manifest.skills || [];
    if (skills.length > 0) {
      console.log();
      log.heading(`Skills (${skills.length})`);
      for (const s of skills) {
        console.log(`  🎯 ${chalk.bold(s.name)}: ${chalk.dim(s.description || s.path || '')}`);
      }
    }

    // 7. Execution Runtime
    if (manifest.execution) {
      console.log();
      log.heading('Execution Runtime');
      if (manifest.execution.command) log.item('Command', manifest.execution.command);
      if (manifest.execution.entrypoint) log.item('Entrypoint', chalk.green(manifest.execution.entrypoint));
      if (manifest.execution.cwd) log.item('Working Directory', manifest.execution.cwd);
      if (manifest.execution.timeout_seconds) log.item('Timeout', `${manifest.execution.timeout_seconds}s`);
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
