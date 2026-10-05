import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { infoCommand } from '../src/commands/info.js';
import { join } from 'path';
import os from 'os';
import { mkdirSync, writeFileSync, rmSync } from 'fs';

describe('AIPack Info Command', () => {
  const tmpDir = join(os.tmpdir(), `aipack-info-test-${Date.now()}`);

  test('infoCommand runs cleanly on a system pack manifest', async () => {
    mkdirSync(tmpDir, { recursive: true });

    const manifest = {
      spec_version: '1.0',
      name: 'info-test-pack',
      version: '1.0.0',
      description: 'Test pack for info command.',
      author: { name: 'hatred', github: 'hatred' },
      level: 'system',
      agents: [
        { id: 'lead', name: 'Lead Architect', model_preference: 'smart' }
      ],
      workflow: {
        entry: 'lead',
        routes: []
      },
      requirements: {
        platform: { os: ['darwin', 'linux'], min_ram_gb: 8 }
      }
    };

    writeFileSync(join(tmpDir, 'manifest.json'), JSON.stringify(manifest, null, 2));

    // infoCommand outputs to console, should not throw
    await assert.doesNotReject(async () => {
      await infoCommand(tmpDir);
    });

    try {
      rmSync(tmpDir, { recursive: true, force: true });
    } catch {}
  });
});
