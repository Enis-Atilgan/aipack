import { writeFileSync } from 'fs';
import { resolve, join } from 'path';
import { loadManifest, validateManifest } from './validate.js';
import { exportToCursor } from '../exporters/cursor.js';
import { exportToClaude } from '../exporters/claude.js';
import { exportToChatGPT } from '../exporters/chatgpt.js';
import { log } from '../utils/logger.js';

const EXPORTERS = {
  cursor: { fn: exportToCursor, defaultFile: '.cursorrules' },
  claude: { fn: exportToClaude, defaultFile: 'CLAUDE.md' },
  chatgpt: { fn: exportToChatGPT, defaultFile: 'custom_instructions.txt' },
};

export async function exportCommand(path, options) {
  try {
    const target = options.target.toLowerCase();

    if (!EXPORTERS[target]) {
      log.error(`Unknown target: "${target}". Supported: ${Object.keys(EXPORTERS).join(', ')}`);
      process.exit(1);
    }

    const { manifest, dir } = loadManifest(path);

    // Quick validation
    const result = validateManifest(manifest);
    if (!result.valid) {
      log.error('Manifest has validation errors. Run "aipack validate" for details.');
      process.exit(1);
    }

    const exporter = EXPORTERS[target];
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
  }
}
