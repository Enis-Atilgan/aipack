import { writeFileSync, existsSync, rmSync } from 'fs';
import { resolve } from 'path';
import { loadManifestAsync, validateManifest } from './validate.js';
import { exportToCursor } from '../exporters/cursor.js';
import { exportToClaude } from '../exporters/claude.js';
import { exportToChatGPT } from '../exporters/chatgpt.js';
import { exportToAgentsMd } from '../exporters/agentsmd.js';
import { exportToWindsurf } from '../exporters/windsurf.js';
import { exportToRooModes } from '../exporters/roomodes.js';
import {
  exportClaudePlugin,
  exportCursorPlugin,
  exportCodexPlugin,
  exportAllPlugins
} from '../exporters/plugins.js';
import { log } from '../utils/logger.js';
import chalk from 'chalk';

const FILE_EXPORTERS = {
  cursor: { fn: exportToCursor, defaultFile: '.cursorrules' },
  claude: { fn: exportToClaude, defaultFile: 'CLAUDE.md' },
  chatgpt: { fn: exportToChatGPT, defaultFile: 'custom_instructions.txt' },
  agentsmd: { fn: exportToAgentsMd, defaultFile: 'AGENTS.md' },
  windsurf: { fn: exportToWindsurf, defaultFile: '.windsurfrules' },
  roo: { fn: exportToRooModes, defaultFile: '.roomodes' },
  cline: { fn: exportToRooModes, defaultFile: '.roomodes' }
};

const PLUGIN_EXPORTERS = {
  'claude-plugin': { fn: exportClaudePlugin, defaultDir: './dist/claude-plugin' },
  'cursor-plugin': { fn: exportCursorPlugin, defaultDir: './dist/cursor-plugin' },
  'codex-plugin': { fn: exportCodexPlugin, defaultDir: './dist/codex-plugin' },
  'plugins': { fn: exportAllPlugins, defaultDir: './dist/plugins' },
  'all-plugins': { fn: exportAllPlugins, defaultDir: './dist/plugins' }
};

export async function exportCommand(path, options) {
  let packDir = null;
  let isTempDir = false;

  try {
    const target = options.target.toLowerCase();

    const isFileTarget = Boolean(FILE_EXPORTERS[target]);
    const isPluginTarget = Boolean(PLUGIN_EXPORTERS[target]);

    if (!isFileTarget && !isPluginTarget) {
      const supported = [
        ...Object.keys(FILE_EXPORTERS),
        ...Object.keys(PLUGIN_EXPORTERS)
      ].join(', ');
      log.error(`Unknown target: "${target}". Supported targets: ${supported}`);
      process.exit(1);
    }

    const { manifest, dir, isTemp } = await loadManifestAsync(path);
    packDir = dir;
    isTempDir = isTemp;

    // Quick validation
    const result = validateManifest(manifest);
    if (!result.valid) {
      log.error('Manifest has validation errors. Run "packai validate" for details.');
      process.exit(1);
    }

    // 1. Directory / Marketplace Plugin Export
    if (isPluginTarget) {
      const exporter = PLUGIN_EXPORTERS[target];
      const outputDir = options.output || exporter.defaultDir;
      const res = exporter.fn(manifest, dir, outputDir);

      console.log();
      console.log(chalk.bold.cyan(`📦 PackAI Plugin Manifest Exporter`));
      log.item('Pack', manifest.name);
      log.item('Target Platform', target);
      log.item('Output Directory', res.outputDir);
      log.item('Files Bundled', `${res.fileCount} files`);
      console.log();
      log.success(`Official plugin manifest bundle generated successfully!`);
      log.dim(`  Ready for submission to ${target === 'claude-plugin' ? 'Claude Code' : target === 'cursor-plugin' ? 'Cursor Marketplace' : 'marketplace'} publishers.`);
      console.log();
      return;
    }

    // 2. Single-File Export
    const exporter = FILE_EXPORTERS[target];
    const output = exporter.fn(manifest, dir);
    const outputFile = options.output || exporter.defaultFile;
    const outputPath = resolve(outputFile);

    writeFileSync(outputPath, output, 'utf-8');

    log.heading('Export complete');
    log.item('Pack', manifest.name);
    log.item('Target', target);
    log.item('Output', outputPath);
    log.item('Size', `${output.length} chars`);
    console.log();
    log.success(`Exported to ${target} format!`);

  } catch (err) {
    log.error(err.message);
    process.exit(1);
  } finally {
    if (isTempDir && packDir && existsSync(packDir)) {
      try {
        rmSync(packDir, { recursive: true, force: true });
      } catch {}
    }
  }
}

