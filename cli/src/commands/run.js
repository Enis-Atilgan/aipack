import { spawn } from 'child_process';
import { resolve, join } from 'path';
import { existsSync, rmSync } from 'fs';
import os from 'os';
import chalk from 'chalk';
import { loadManifestAsync } from './validate.js';
import { runPreflight } from '../utils/preflight.js';
import { getCredential } from '../utils/credentials.js';
import { log } from '../utils/logger.js';

export async function runCommand(target, options = {}) {
  let tempCleanupDir = null;
  try {
    const packTarget = target || options.cwd || '.';
    const { manifest, dir, isTemp } = await loadManifestAsync(packTarget);
    if (isTemp) tempCleanupDir = dir;

    console.log();
    console.log(chalk.bold.cyan(`🐺 PackAI Execution Runner`));
    console.log(chalk.dim(`Target: ${manifest.name} (v${manifest.version}) [Level: ${manifest.level.toUpperCase()}]`));
    console.log();

    // 1. Pre-Flight System Audit
    const preflight = await runPreflight(manifest);
    if (!preflight.platform.ok && !options.force) {
      log.error(`Platform incompatibility: ${preflight.platform.errors.join(', ')}`);
      log.error('Use --force to override platform checks.');
      process.exit(1);
    }

    const missingBinaries = preflight.binaries.filter(b => !b.installed);
    if (missingBinaries.length > 0 && !options.force) {
      log.error(`Missing required runtime binaries: ${missingBinaries.map(b => b.name).join(', ')}`);
      for (const b of missingBinaries) {
        if (b.suggestedInstallCmd) console.log(chalk.dim(`  Install: ${b.suggestedInstallCmd}`));
      }
      process.exit(1);
    }

    // 2. Prepare Environment & Inject Credentials
    const executionEnv = { ...process.env };
    if (preflight.secrets.length > 0) {
      for (const sec of preflight.secrets) {
        const val = getCredential(sec.id) || process.env[sec.id] || process.env[sec.env];
        if (val) {
          executionEnv[sec.id] = val;
          if (sec.env) executionEnv[sec.env] = val;
        } else if (sec.required && !options.force) {
          log.warn(`Missing required secret: ${sec.id}. Set via environment or run "packai apply -i"`);
        }
      }
    }

    // 3. Execution Dispatch
    const execConfig = manifest.execution;
    if (execConfig && execConfig.command) {
      const workingDir = options.cwd
        ? resolve(options.cwd)
        : (execConfig.cwd ? resolve(dir, execConfig.cwd) : dir);
      console.log(chalk.bold.green(`▶ Launching: ${chalk.cyan(execConfig.command)}`));
      console.log(chalk.dim(`Working directory: ${workingDir}`));
      console.log();

      await new Promise((resolvePromise, rejectPromise) => {
        const child = spawn(execConfig.command, {
          cwd: workingDir,
          env: executionEnv,
          shell: true,
          stdio: 'inherit'
        });

        child.on('error', (err) => {
          log.error(`Execution failed: ${err.message}`);
          rejectPromise(err);
        });

        child.on('close', (code) => {
          if (code === 0) {
            console.log();
            log.success(`Process finished cleanly (exit code 0).`);
            resolvePromise();
          } else {
            console.log();
            log.error(`Process exited with code ${code}.`);
            rejectPromise(new Error(`Exit code ${code}`));
          }
        });
      });
      return;
    }

    // If no execution.command is defined, this is an IDE / Agent Orchestration Pack
    console.log(chalk.yellow(`ℹ This pack is an IDE & Model Context Protocol agent workforce.`));
    console.log(chalk.dim(`No standalone shell command was defined in "execution.command".`));
    console.log();
    console.log(chalk.bold('Available Interaction Channels:'));
    console.log(`  1. ${chalk.bold('Claude Code')}: Run ${chalk.cyan('claude')} in your project directory.`);
    console.log(`  2. ${chalk.bold('OpenCode')}: Run ${chalk.cyan('opencode')} for open-source terminal agent.`);
    console.log(`  3. ${chalk.bold('Cursor')}: Open the workspace in Cursor and interact with @agents.`);
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
